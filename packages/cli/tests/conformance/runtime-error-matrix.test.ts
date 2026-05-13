import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { execaNode } from 'execa'
import { describe, expect, it } from 'vitest'

type ChannelExpectation = 'stderr-only' | 'stdout-only' | 'mixed'

interface StreamExpectation {
  required: string[]
  forbidden: string[]
}

interface ScenarioExpectation {
  exitCode: number
  channel: ChannelExpectation
  stdout: StreamExpectation
  stderr: StreamExpectation
}

interface MatrixScenario {
  id: string
  name: string
  requirements: string[]
  entry: 'dist' | 'harness-non-error'
  argv: string[]
  expect: ScenarioExpectation
}

interface MatrixFixture {
  version: number
  suite: string
  description: string
  scenarios: MatrixScenario[]
}

interface ScenarioRecord {
  id: string
  name: string
  requirements: string[]
  status: 'pass' | 'fail'
  expectedExitCode: number
  actualExitCode: number
  channel: ChannelExpectation
  durationMs: number
  failures: string[]
  stdoutSnippet: string
  stderrSnippet: string
}

const MATRIX_FIXTURE_PATH = resolve(import.meta.dirname, 'fixtures/runtime-error-matrix.json')
const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js')
const ERROR_HANDLER_PATH = resolve(import.meta.dirname, '../../src/utils/error-handler.ts')
const ARTIFACT_DIR = resolve(import.meta.dirname, 'artifacts')
const REPORT_PATH = resolve(ARTIFACT_DIR, 'runtime-error-report.json')
const HARNESS_PATH = resolve(ARTIFACT_DIR, 'runtime-error-harness.mjs')

function stripAnsi(input: string): string {
  return stripVTControlCharacters(input)
}

function compactTranscript(input: string, maxLength = 220): string {
  const normalized = input.replace(/\r\n/g, '\n').trim()
  if (!normalized)
    return '(empty)'

  if (normalized.length <= maxLength)
    return normalized

  return `${normalized.slice(0, maxLength - 3)}...`
}

function matchesPattern(output: string, pattern: string): boolean {
  if (pattern.startsWith('re:')) {
    const regex = new RegExp(pattern.slice(3), 'm')
    return regex.test(output)
  }

  return output.includes(pattern)
}

function assertPatterns(label: 'stdout' | 'stderr', output: string, expectation: StreamExpectation): string[] {
  const failures: string[] = []

  for (const pattern of expectation.required) {
    if (!matchesPattern(output, pattern)) {
      failures.push(`${label} missing required pattern: ${pattern}`)
    }
  }

  for (const pattern of expectation.forbidden) {
    if (matchesPattern(output, pattern)) {
      failures.push(`${label} matched forbidden pattern: ${pattern}`)
    }
  }

  return failures
}

async function ensureHarnessScript(): Promise<void> {
  await mkdir(ARTIFACT_DIR, { recursive: true })

  const script = [
    `import { createJiti } from 'jiti'`,
    `const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: false })`,
    `const mod = await jiti.import(process.argv[2])`,
    `mod.handleError('conformance-non-error')`,
    '',
  ].join('\n')

  await writeFile(HARNESS_PATH, script, 'utf-8')
}

async function runScenario(scenario: MatrixScenario): Promise<{
  exitCode: number
  stdout: string
  stderr: string
}> {
  const env = {
    ...process.env,
    FORCE_COLOR: '0',
    NO_COLOR: '1',
  }

  if (scenario.entry === 'harness-non-error') {
    const result = await execaNode(HARNESS_PATH, [ERROR_HANDLER_PATH], {
      reject: false,
      env,
    })

    return {
      exitCode: result.exitCode ?? 1,
      stdout: stripAnsi(result.stdout),
      stderr: stripAnsi(result.stderr),
    }
  }

  const result = await execaNode(CLI_PATH, scenario.argv, {
    reject: false,
    env,
  })

  return {
    exitCode: result.exitCode ?? 1,
    stdout: stripAnsi(result.stdout),
    stderr: stripAnsi(result.stderr),
  }
}

function validateFixture(fixture: MatrixFixture): void {
  expect(fixture.version).toBe(1)
  expect(fixture.suite).toBe('runtime-error-matrix')
  expect(fixture.scenarios).toHaveLength(8)

  const uniqueIds = new Set(fixture.scenarios.map(scenario => scenario.id))
  expect(uniqueIds.size).toBe(fixture.scenarios.length)
}

describe('runtime error conformance matrix', () => {
  it('enforces 8 required runtime UX scenarios and emits report artifacts', { timeout: 30_000 }, async () => {
    await ensureHarnessScript()

    const fixture = JSON.parse(await readFile(MATRIX_FIXTURE_PATH, 'utf-8')) as MatrixFixture
    validateFixture(fixture)

    const records: ScenarioRecord[] = []

    for (const scenario of fixture.scenarios) {
      const startedAt = Date.now()
      const result = await runScenario(scenario)
      const durationMs = Date.now() - startedAt

      const failures: string[] = []
      if (result.exitCode !== scenario.expect.exitCode) {
        failures.push(`exit code mismatch: expected ${scenario.expect.exitCode}, got ${result.exitCode}`)
      }

      if (scenario.expect.channel === 'stderr-only') {
        if (result.stdout.trim()) {
          failures.push('expected stdout to be empty for stderr-only scenario')
        }
        if (!result.stderr.trim()) {
          failures.push('expected stderr output for stderr-only scenario')
        }
      }
      else if (scenario.expect.channel === 'stdout-only') {
        if (!result.stdout.trim()) {
          failures.push('expected stdout output for stdout-only scenario')
        }
        if (result.stderr.trim()) {
          failures.push('expected stderr to be empty for stdout-only scenario')
        }
      }

      failures.push(...assertPatterns('stdout', result.stdout, scenario.expect.stdout))
      failures.push(...assertPatterns('stderr', result.stderr, scenario.expect.stderr))

      records.push({
        id: scenario.id,
        name: scenario.name,
        requirements: scenario.requirements,
        status: failures.length === 0 ? 'pass' : 'fail',
        expectedExitCode: scenario.expect.exitCode,
        actualExitCode: result.exitCode,
        channel: scenario.expect.channel,
        durationMs,
        failures,
        stdoutSnippet: compactTranscript(result.stdout),
        stderrSnippet: compactTranscript(result.stderr),
      })

      if (process.env.TINKERISE_CONFORMANCE_FORCE_MISMATCH === '1' && records.length === 1) {
        records[0]!.failures.push('forced mismatch for conformance failure-path verification')
        records[0]!.status = 'fail'
      }
    }

    const tableRows = records.map(record => ({
      id: record.id,
      status: record.status,
      exit: `${record.actualExitCode}/${record.expectedExitCode}`,
      channel: record.channel,
      requirements: record.requirements.join(','),
      ms: record.durationMs,
    }))

    console.table(tableRows)

    await mkdir(ARTIFACT_DIR, { recursive: true })
    const report = {
      generatedAt: new Date().toISOString(),
      fixture: relative(process.cwd(), MATRIX_FIXTURE_PATH),
      reportPath: relative(process.cwd(), REPORT_PATH),
      scenarios: records,
      totals: {
        total: records.length,
        passed: records.filter(record => record.status === 'pass').length,
        failed: records.filter(record => record.status === 'fail').length,
      },
    }
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8')
    console.log(`runtime error conformance report: ${REPORT_PATH}`)

    await rm(HARNESS_PATH, { force: true })

    for (const record of records) {
      expect(
        record.failures,
        [
          `Scenario ${record.id} failed:`,
          ...record.failures,
          `stdout: ${record.stdoutSnippet}`,
          `stderr: ${record.stderrSnippet}`,
        ].join('\n'),
      ).toEqual([])
    }

    expect(records).toHaveLength(8)
    expect(records.every(record => record.status === 'pass')).toBe(true)
  })
})
