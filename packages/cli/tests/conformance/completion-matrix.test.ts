/**
 * Phase 34 Plan 04 — completion-matrix conformance test (D-15 Layer 2).
 *
 * Mirrors the json-output-matrix.test.ts structure exactly: a fixture
 * loader with a runtime sanity check, a `runScenario` loop that drives
 * the configured shell through a TAB sequence via run-shell-completion.mjs,
 * a ScenarioRecord report written to
 * packages/cli/tests/conformance/artifacts/completion-report.json, and a
 * per-record `expect(failures).toEqual([])` final assertion.
 *
 * Task 2a ships the orchestrator + the single bash smoke scenario; Task 2b
 * extends the fixture to ~12-18 scenarios across all three shells and
 * implements the zsh/fish harness branches.
 */

import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { execaNode } from 'execa'
import { describe, expect, it } from 'vitest'
import { runShellCompletion } from './harness/run-shell-completion.mjs'

type ShellKind = 'bash' | 'zsh' | 'fish'

interface Scenario {
  id: string
  name: string
  requirements: string[]
  shell: ShellKind
  partialCommand: string
  expectedCandidates?: string[]
  expectedCandidatesInclude?: string[]
  expectExitOk?: boolean
  mockBin?: {
    __complete?: Record<string, string[] | 'FAIL'>
  }
}

interface Fixture {
  version: number
  suite: string
  description: string
  scenarios: Scenario[]
}

interface ScenarioRecord {
  id: string
  name: string
  requirements: string[]
  status: 'fail' | 'pass' | 'skipped'
  shell: ShellKind
  durationMs: number
  failures: string[]
  candidates: string[]
  stderrSnippet: string
}

const FIXTURE_PATH = resolve(import.meta.dirname, 'fixtures/completion-matrix.json')
const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js')
const ARTIFACT_DIR = resolve(import.meta.dirname, 'artifacts')
const REPORT_PATH = resolve(ARTIFACT_DIR, 'completion-report.json')

function stripAnsi(input: string): string {
  return stripVTControlCharacters(input)
}

function compact(input: string, maxLength = 220): string {
  const normalized = input.replace(/\r\n/g, '\n').trim()
  if (!normalized)
    return '(empty)'
  if (normalized.length <= maxLength)
    return normalized
  return `${normalized.slice(0, maxLength - 3)}...`
}

function shellAvailable(shell: ShellKind): boolean {
  // `command -v` is POSIX; using bash -c keeps this portable across
  // macOS dev machines and Linux CI runners.
  const r = spawnSync('bash', ['-c', `command -v ${shell}`], { stdio: 'ignore' })
  return r.status === 0
}

function validateFixture(fixture: Fixture): void {
  expect(fixture.version).toBe(1)
  expect(fixture.suite).toBe('completion-matrix')
  expect(fixture.scenarios.length).toBeGreaterThanOrEqual(1)
  const ids = new Set(fixture.scenarios.map(s => s.id))
  expect(ids.size).toBe(fixture.scenarios.length)
  for (const scenario of fixture.scenarios) {
    expect(['bash', 'zsh', 'fish']).toContain(scenario.shell)
    expect(typeof scenario.partialCommand).toBe('string')
  }
}

async function emitCompletionScript(shell: ShellKind): Promise<string> {
  // Build the script by invoking the dist binary directly — the
  // generator must walk the LIVE Commander tree at generation time
  // per D-02. Using the dist binary here also locks the end-to-end
  // wiring from `completion <shell>` -> generator output.
  const result = await execaNode(CLI_PATH, ['completion', shell], {
    reject: false,
    stripFinalNewline: false,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  })
  if ((result.exitCode ?? 1) !== 0)
    throw new Error(`tinkerise completion ${shell} failed: ${stripAnsi(result.stderr ?? '')}`)
  return stripAnsi(result.stdout ?? '')
}

describe.skipIf(process.platform === 'win32')('completion-matrix conformance', () => {
  it('runs every fixture scenario through the per-shell TAB harness', { timeout: 120_000 }, async () => {
    const fixture: Fixture = JSON.parse(await readFile(FIXTURE_PATH, 'utf-8'))
    validateFixture(fixture)

    // Cache per-shell completion scripts — generating them is the
    // slowest step in the loop (each emission spawns the dist binary).
    const scripts = new Map<ShellKind, string>()

    const records: ScenarioRecord[] = []

    for (const scenario of fixture.scenarios) {
      const startedAt = Date.now()
      const failures: string[] = []

      // Skip scenarios whose shell isn't installed on this runner.
      // On the developer machine fish is typically missing — the
      // skip path keeps the test green locally. CI installs fish
      // per D-17 so the full matrix exercises there.
      if (!shellAvailable(scenario.shell)) {
        records.push({
          id: scenario.id,
          name: scenario.name,
          requirements: scenario.requirements,
          status: 'skipped',
          shell: scenario.shell,
          durationMs: Date.now() - startedAt,
          failures: [],
          candidates: [],
          stderrSnippet: `(skipped: ${scenario.shell} not installed)`,
        })
        continue
      }

      if (!scripts.has(scenario.shell))
        scripts.set(scenario.shell, await emitCompletionScript(scenario.shell))
      const completionScript = scripts.get(scenario.shell)!

      let result: { candidates: string[], exitCode: number, stderr: string }
      try {
        result = await runShellCompletion({
          shell: scenario.shell,
          completionScript,
          partialCommand: scenario.partialCommand,
          mockBin: scenario.mockBin,
        })
      }
      catch (error) {
        failures.push(`harness threw: ${(error as Error).message}`)
        records.push({
          id: scenario.id,
          name: scenario.name,
          requirements: scenario.requirements,
          status: 'fail',
          shell: scenario.shell,
          durationMs: Date.now() - startedAt,
          failures,
          candidates: [],
          stderrSnippet: '(harness exception)',
        })
        continue
      }

      // Exit-code check
      if (scenario.expectExitOk && result.exitCode !== 0)
        failures.push(`expected exit 0, got ${result.exitCode}`)

      // Candidate-set checks
      if (scenario.expectedCandidates !== undefined) {
        const expected = new Set(scenario.expectedCandidates)
        const actual = new Set(result.candidates)
        if (expected.size !== actual.size || [...expected].some(v => !actual.has(v))) {
          failures.push(
            `candidates mismatch: expected=${JSON.stringify(scenario.expectedCandidates)} actual=${JSON.stringify(result.candidates)}`,
          )
        }
      }
      if (scenario.expectedCandidatesInclude) {
        for (const required of scenario.expectedCandidatesInclude) {
          if (!result.candidates.includes(required))
            failures.push(`expected candidate '${required}' missing from ${JSON.stringify(result.candidates)}`)
        }
      }

      // Relaxed stderr contract: bash/zsh/fish frequently emit benign init
      // warnings (compinit insecure-directory, missing _init_completion,
      // etc.) when run under --noprofile/--norc/--no-config. The contract
      // is that tinkerise-originated error noise must not leak into the
      // user's prompt (D-09 / D-19), so we forbid the specific patterns
      // below and accept everything else.
      expect(result.stderr, `scenario ${scenario.id} leaked tinkerise error noise`).not.toMatch(
        /COMPLETION_|command not found|tinkerise.*error/i,
      )

      records.push({
        id: scenario.id,
        name: scenario.name,
        requirements: scenario.requirements,
        status: failures.length === 0 ? 'pass' : 'fail',
        shell: scenario.shell,
        durationMs: Date.now() - startedAt,
        failures,
        candidates: result.candidates,
        stderrSnippet: compact(result.stderr),
      })
    }

    await mkdir(ARTIFACT_DIR, { recursive: true })
    const report = {
      generatedAt: new Date().toISOString(),
      fixture: FIXTURE_PATH,
      reportPath: REPORT_PATH,
      records,
      totals: {
        total: records.length,
        passed: records.filter(r => r.status === 'pass').length,
        failed: records.filter(r => r.status === 'fail').length,
        skipped: records.filter(r => r.status === 'skipped').length,
      },
    }
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8')
    console.log(`completion-matrix conformance report: ${REPORT_PATH}`)

    const tableRows = records.map(r => ({
      id: r.id,
      shell: r.shell,
      status: r.status,
      candidates: r.candidates.length,
      ms: r.durationMs,
    }))
    console.table(tableRows)

    for (const record of records) {
      if (record.status === 'skipped')
        continue
      expect(
        record.failures,
        [
          `Scenario ${record.id} failed:`,
          ...record.failures,
          `candidates: ${JSON.stringify(record.candidates)}`,
          `stderr: ${record.stderrSnippet}`,
        ].join('\n'),
      ).toEqual([])
    }
  })
})
