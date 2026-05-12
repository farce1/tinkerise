import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import {
  DoctorEnvelopeV1Schema,
  ListEnvelopeV1Schema,
  PresetListEnvelopeV1Schema,
  PresetShowEnvelopeV1Schema,
} from '@tinkerise/shared'
import { execaNode } from 'execa'
import { describe, expect, it } from 'vitest'

type SchemaKey = 'doctor' | 'list' | 'preset-list' | 'preset-show'

const SCHEMA_MAP = {
  'list': ListEnvelopeV1Schema,
  'doctor': DoctorEnvelopeV1Schema,
  'preset-list': PresetListEnvelopeV1Schema,
  'preset-show': PresetShowEnvelopeV1Schema,
} as const

interface StreamExpectation {
  required: string[]
  forbidden: string[]
}

interface ScenarioExpectation {
  exitCode: number
  schema: SchemaKey
  envelopeKind: 'data' | 'error'
  expectedErrorCode?: string
  stdoutShape: 'single-json-object'
  dataAssert?: string
  stderr: StreamExpectation
}

interface Scenario {
  id: string
  name: string
  requirements: string[]
  entry: 'dist' | 'harness'
  argv?: string[]
  harness?: string
  envOverride?: Record<string, string>
  preSeed?: string
  expect: ScenarioExpectation
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
  status: 'fail' | 'pass'
  expectedExitCode: number
  actualExitCode: number
  durationMs: number
  failures: string[]
  stdoutSnippet: string
  stderrSnippet: string
}

const MATRIX_FIXTURE_PATH = resolve(import.meta.dirname, 'fixtures/json-output-matrix.json')
const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js')
const HARNESS_DIR = resolve(import.meta.dirname, 'harness')
const ARTIFACT_DIR = resolve(import.meta.dirname, 'artifacts')
const REPORT_PATH = resolve(ARTIFACT_DIR, 'json-output-report.json')

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

interface ScenarioRunResult {
  exitCode: number
  stdout: string
  stderr: string
  cleanupDirs: string[]
}

async function runScenario(scenario: Scenario): Promise<ScenarioRunResult> {
  const cleanupDirs: string[] = []
  const env: Record<string, string> = {
    ...process.env,
    FORCE_COLOR: '0',
    NO_COLOR: '1',
  }

  if (scenario.envOverride) {
    for (const [key, value] of Object.entries(scenario.envOverride)) {
      if (value === '__USE_TMPDIR__') {
        if (cleanupDirs.length === 0) {
          cleanupDirs.push(await mkdtemp(join(tmpdir(), 'tinkerise-conformance-')))
        }
        env[key] = cleanupDirs[0]!
      }
      else {
        env[key] = value
      }
    }
  }

  if (scenario.preSeed) {
    if (cleanupDirs.length === 0) {
      cleanupDirs.push(await mkdtemp(join(tmpdir(), 'tinkerise-conformance-')))
    }
    const seedDir = cleanupDirs[0]!
    env.HOME = seedDir
    env.XDG_CONFIG_HOME = seedDir
    const presetsDir = join(seedDir, 'tinkerise', 'presets')
    await mkdir(presetsDir, { recursive: true })
    const fixture = {
      version: 1,
      name: scenario.preSeed,
      description: 'Phase 33 conformance fixture',
      scaffold: { framework: 'next', category: 'web', flags: { typescript: true } },
      enhancements: [],
      config: {},
    }
    await writeFile(
      join(presetsDir, `${scenario.preSeed}.json`),
      JSON.stringify(fixture, null, 2),
      'utf-8',
    )
  }

  let target: string
  let argv: string[]
  if (scenario.entry === 'harness') {
    if (!scenario.harness)
      throw new Error(`scenario ${scenario.id} missing harness file`)
    target = resolve(HARNESS_DIR, scenario.harness)
    argv = []
  }
  else {
    target = CLI_PATH
    argv = scenario.argv ?? []
  }

  // stripFinalNewline=false so the test can assert the CLI emits exactly one
  // trailing newline on stdout (D-12). Without this flag, execa silently
  // strips the final \n, hiding the discipline check.
  const result = await execaNode(target, argv, {
    reject: false,
    env,
    stripFinalNewline: false,
  })

  return {
    exitCode: result.exitCode ?? 1,
    stdout: stripAnsi(result.stdout ?? ''),
    stderr: stripAnsi(result.stderr ?? ''),
    cleanupDirs,
  }
}

function matchesPattern(output: string, pattern: string): boolean {
  if (pattern.startsWith('re:')) {
    const regex = new RegExp(pattern.slice(3), 'm')
    return regex.test(output)
  }
  return output.includes(pattern)
}

function validateFixture(fixture: Fixture): void {
  expect(fixture.version).toBe(1)
  expect(fixture.suite).toBe('json-output-matrix')
  expect(fixture.scenarios).toHaveLength(8)

  const ids = new Set(fixture.scenarios.map(s => s.id))
  expect(ids.size).toBe(fixture.scenarios.length)
}

function assertDataEnvelope(
  scenario: Scenario,
  envelope: { data?: unknown, error?: { code: string, message: string } },
  failures: string[],
): void {
  if (scenario.expect.envelopeKind === 'data') {
    if (!envelope.data) {
      failures.push('expected data envelope, got error envelope')
    }
  }
  else if (!envelope.error) {
    failures.push('expected error envelope, got data envelope')
  }
  else if (scenario.expect.expectedErrorCode && envelope.error.code !== scenario.expect.expectedErrorCode) {
    failures.push(
      `error code mismatch: expected ${scenario.expect.expectedErrorCode}, got ${envelope.error.code}`,
    )
  }
}

function assertDataPredicate(scenario: Scenario, data: unknown, failures: string[]): void {
  if (!scenario.expect.dataAssert || !data)
    return

  // The dataAssert string comes ONLY from the committed fixture file —
  // never user input. This is documented as accepted in the threat model
  // (T-33-19). Treat as code-reviewed at PR time.
  // eslint-disable-next-line no-new-func
  const evaluator = new Function('data', `return (${scenario.expect.dataAssert})`)
  let ok = false
  try {
    ok = Boolean(evaluator(data))
  }
  catch (error) {
    failures.push(`dataAssert threw: ${(error as Error).message}`)
    return
  }
  if (!ok) {
    failures.push(`dataAssert failed: ${scenario.expect.dataAssert}`)
  }
}

describe('--json output conformance matrix', () => {
  it('enforces all --json scenarios match envelope schemas and stdout/stderr discipline', { timeout: 60_000 }, async () => {
    const fixture: Fixture = JSON.parse(await readFile(MATRIX_FIXTURE_PATH, 'utf-8'))
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

      // stdout discipline: exactly one trailing newline, no other newlines.
      if (!result.stdout.endsWith('\n') || result.stdout.indexOf('\n') !== result.stdout.length - 1) {
        failures.push('stdout must end with exactly one trailing newline (no other newlines)')
      }

      // stderr forbidden patterns (re:^\s*\{ catches stray JSON on stderr).
      for (const pattern of scenario.expect.stderr.forbidden) {
        if (matchesPattern(result.stderr, pattern)) {
          failures.push(`stderr matched forbidden pattern: ${pattern}`)
        }
      }
      for (const pattern of scenario.expect.stderr.required) {
        if (!matchesPattern(result.stderr, pattern)) {
          failures.push(`stderr missing required pattern: ${pattern}`)
        }
      }

      let parsed: unknown = null
      try {
        parsed = JSON.parse(result.stdout)
      }
      catch (error) {
        failures.push(`stdout is not valid JSON: ${(error as Error).message}`)
      }

      if (parsed !== null) {
        const schema = SCHEMA_MAP[scenario.expect.schema]
        const safe = schema.safeParse(parsed)
        if (!safe.success) {
          failures.push(`schema validation failed: ${JSON.stringify(safe.error.issues)}`)
        }
        else {
          const envelope = parsed as { data?: unknown, error?: { code: string, message: string } }
          assertDataEnvelope(scenario, envelope, failures)
          if (envelope.data) {
            assertDataPredicate(scenario, envelope.data, failures)
          }
        }
      }

      for (const dir of result.cleanupDirs) {
        await rm(dir, { recursive: true, force: true })
      }

      records.push({
        id: scenario.id,
        name: scenario.name,
        requirements: scenario.requirements,
        status: failures.length === 0 ? 'pass' : 'fail',
        expectedExitCode: scenario.expect.exitCode,
        actualExitCode: result.exitCode,
        durationMs,
        failures,
        stdoutSnippet: compactTranscript(result.stdout),
        stderrSnippet: compactTranscript(result.stderr),
      })
    }

    await mkdir(ARTIFACT_DIR, { recursive: true })
    const report = {
      generatedAt: new Date().toISOString(),
      fixture: MATRIX_FIXTURE_PATH,
      reportPath: REPORT_PATH,
      scenarios: records,
      totals: {
        total: records.length,
        passed: records.filter(r => r.status === 'pass').length,
        failed: records.filter(r => r.status === 'fail').length,
      },
    }
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8')
    console.log(`json-output conformance report: ${REPORT_PATH}`)

    const tableRows = records.map(record => ({
      id: record.id,
      status: record.status,
      exit: `${record.actualExitCode}/${record.expectedExitCode}`,
      requirements: record.requirements.join(','),
      ms: record.durationMs,
    }))
    console.table(tableRows)

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
