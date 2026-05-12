/**
 * Tests for the tinkerise doctor command.
 *
 * Verifies:
 * - Table output formatting with Tool/Status/Version/Required columns
 * - Checkmark/X status symbols for pass/fail
 * - Install instructions shown only for failures
 * - Summary line with pass/total count
 * - Category grouping (Runtimes, Scaffolder Tools)
 * - DOCTOR_CHECKS completeness (all 10 tools)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DOCTOR_CHECKS, runDoctor } from '../../src/commands/doctor.js'

// vi.hoisted mock fns
const { mockCheckPrerequisite } = vi.hoisted(() => ({
  mockCheckPrerequisite: vi.fn(),
}))

vi.mock('@tinkerise/core', () => ({
  checkPrerequisite: mockCheckPrerequisite,
}))

vi.mock('picocolors', () => ({
  default: {
    green: (s: string) => `[green]${s}[/green]`,
    red: (s: string) => `[red]${s}[/red]`,
    bold: (s: string) => `[bold]${s}[/bold]`,
    dim: (s: string) => `[dim]${s}[/dim]`,
  },
}))

describe('dOCTOR_CHECKS completeness', () => {
  it('contains all 6 runtime tool entries', () => {
    const runtimeCommands = DOCTOR_CHECKS
      .filter(c => c.category === 'Runtimes')
      .map(c => c.command)

    expect(runtimeCommands).toContain('node')
    expect(runtimeCommands).toContain('python3')
    expect(runtimeCommands).toContain('go')
    expect(runtimeCommands).toContain('rustc')
    expect(runtimeCommands).toContain('flutter')
    expect(runtimeCommands).toContain('dart')
    expect(runtimeCommands).toHaveLength(6)
  })

  it('contains all 4 scaffolder tool entries', () => {
    const toolCommands = DOCTOR_CHECKS
      .filter(c => c.category === 'Scaffolder Tools')
      .map(c => c.command)

    expect(toolCommands).toContain('django-admin')
    expect(toolCommands).toContain('fastapi-admin')
    expect(toolCommands).toContain('go-blueprint')
    expect(toolCommands).toContain('cargo-generate')
    expect(toolCommands).toHaveLength(4)
  })

  it('has 10 total checks', () => {
    expect(DOCTOR_CHECKS).toHaveLength(10)
  })

  it('go uses versionFlag "version" not "--version"', () => {
    const goCheck = DOCTOR_CHECKS.find(c => c.command === 'go')!
    expect(goCheck.versionFlag).toBe('version')
  })

  it('dart has no versionRange (informational only)', () => {
    const dartCheck = DOCTOR_CHECKS.find(c => c.command === 'dart')!
    expect(dartCheck.versionRange).toBeUndefined()
  })

  it('python uses python3 command (not python)', () => {
    const pythonCheck = DOCTOR_CHECKS.find(c => c.tool === 'Python')!
    expect(pythonCheck.command).toBe('python3')
  })
})

describe('runDoctor', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  function getOutput(): string {
    return consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
  }

  it('shows all tools passing when all prerequisites are met', async () => {
    mockCheckPrerequisite.mockResolvedValue({
      ok: true,
      command: 'node',
      version: '20.11.0',
    })

    await runDoctor()

    const output = getOutput()
    // Should have green checkmarks for all 10 tools
    const checkmarks = (output.match(/\[green\]/g) ?? []).length
    expect(checkmarks).toBe(10)
    // No red X marks
    expect(output).not.toContain('[red]')
    // Summary: 10/10
    expect(output).toContain('10/10 checks passed')
  })

  it('shows X for missing tool with install instructions', async () => {
    mockCheckPrerequisite.mockImplementation(async (prereq: { command: string }) => {
      if (prereq.command === 'python3') {
        return {
          ok: false,
          command: 'python3',
          error: '\'python3\' not found in PATH',
          installInstructions: 'brew install python@3.12',
        }
      }
      return { ok: true, command: prereq.command, version: '1.0.0' }
    })

    await runDoctor()

    const output = getOutput()
    // Python should have red X
    expect(output).toContain('[red]')
    // Install instructions should appear
    expect(output).toContain('brew install python@3.12')
    // Summary: 9/10
    expect(output).toContain('9/10 checks passed')
  })

  it('shows version and error for below-minimum version', async () => {
    mockCheckPrerequisite.mockImplementation(async (prereq: { command: string }) => {
      if (prereq.command === 'go') {
        return {
          ok: false,
          command: 'go',
          version: '1.20.0',
          error: 'go 1.20.0 does not satisfy >=1.22',
          installInstructions: 'brew install go',
        }
      }
      return { ok: true, command: prereq.command, version: '1.0.0' }
    })

    await runDoctor()

    const output = getOutput()
    // Go should have red X
    expect(output).toContain('[red]')
    // Install instructions shown
    expect(output).toContain('brew install go')
    // Summary: 9/10
    expect(output).toContain('9/10 checks passed')
  })

  it('shows summary line in N/M format', async () => {
    mockCheckPrerequisite.mockResolvedValue({
      ok: true,
      command: 'node',
      version: '20.11.0',
    })

    await runDoctor()

    const output = getOutput()
    expect(output).toMatch(/\d+\/\d+ checks passed/)
  })

  it('shows re-run suggestion when any check fails', async () => {
    mockCheckPrerequisite.mockResolvedValue({
      ok: false,
      command: 'node',
      error: 'not found',
      installInstructions: 'brew install node',
    })

    await runDoctor()

    const output = getOutput()
    expect(output).toContain('re-run: tinkerise doctor')
  })

  it('does not show re-run suggestion when all pass', async () => {
    mockCheckPrerequisite.mockResolvedValue({
      ok: true,
      command: 'node',
      version: '20.11.0',
    })

    await runDoctor()

    const output = getOutput()
    expect(output).not.toContain('re-run: tinkerise doctor')
  })

  it('install instructions only shown for failed checks', async () => {
    // Make all pass except one
    mockCheckPrerequisite.mockImplementation(async (prereq: { command: string }) => {
      if (prereq.command === 'flutter') {
        return {
          ok: false,
          command: 'flutter',
          error: 'not found',
          installInstructions: 'brew install --cask flutter',
        }
      }
      return { ok: true, command: prereq.command, version: '1.0.0' }
    })

    await runDoctor()

    const output = getOutput()
    // Flutter install instructions shown
    expect(output).toContain('brew install --cask flutter')
    // Node install instructions NOT shown (it passed)
    expect(output).not.toContain('brew install node')
  })

  it('groups checks under Runtimes and Scaffolder Tools category headers', async () => {
    mockCheckPrerequisite.mockResolvedValue({
      ok: true,
      command: 'node',
      version: '20.11.0',
    })

    await runDoctor()

    const output = getOutput()
    expect(output).toContain('[bold]Runtimes[/bold]')
    expect(output).toContain('[bold]Scaffolder Tools[/bold]')

    // Runtimes header should appear before Scaffolder Tools header
    const runtimesIdx = output.indexOf('Runtimes')
    const scaffolderIdx = output.indexOf('Scaffolder Tools')
    expect(runtimesIdx).toBeLessThan(scaffolderIdx)
  })

  it('prints tinkerise doctor header', async () => {
    mockCheckPrerequisite.mockResolvedValue({
      ok: true,
      command: 'node',
      version: '20.11.0',
    })

    await runDoctor()

    const output = getOutput()
    expect(output).toContain('[bold]\ntinkerise doctor\n[/bold]')
  })
})

describe('dOCTOR_CHECKS required field (D-11/D-24)', () => {
  it('Node.js is required: true', () => {
    const node = DOCTOR_CHECKS.find(c => c.tool === 'Node.js')!
    expect(node.required).toBe(true)
  })

  it('every non-Node.js entry is required: false', () => {
    const nonNode = DOCTOR_CHECKS.filter(c => c.tool !== 'Node.js')
    expect(nonNode).toHaveLength(9)
    for (const check of nonNode) {
      expect(check.required).toBe(false)
    }
  })

  it('every DOCTOR_CHECKS entry carries a required boolean', () => {
    for (const check of DOCTOR_CHECKS) {
      expect(typeof check.required).toBe('boolean')
    }
  })
})

describe('runDoctor --json (CLI-13)', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let consoleSpy: ReturnType<typeof vi.spyOn>
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const { __resetJsonModeForTests, detectJsonMode } = await import('../../src/utils/output-mode.js')
    __resetJsonModeForTests()
    detectJsonMode(['node', 'tinkerise', 'doctor', '--json'])
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code}) called`)
    }) as never)
  })

  afterEach(async () => {
    stdoutSpy.mockRestore()
    consoleSpy.mockRestore()
    exitSpy.mockRestore()
    const { __resetJsonModeForTests } = await import('../../src/utils/output-mode.js')
    __resetJsonModeForTests()
  })

  function readEnvelope(): { schemaVersion: number, command: string, data: { checks: Array<Record<string, unknown>>, summary: Record<string, number> } } {
    const calls = stdoutSpy.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    return JSON.parse(String(calls[0]![0]))
  }

  it('emits envelope with schemaVersion 1 and command "doctor" when all pass', async () => {
    mockCheckPrerequisite.mockResolvedValue({ ok: true, command: 'node', version: '20.11.0' })

    await runDoctor()

    const envelope = readEnvelope()
    expect(envelope.schemaVersion).toBe(1)
    expect(envelope.command).toBe('doctor')
    expect(envelope.data.checks).toHaveLength(10)
    expect(envelope.data.summary.total).toBe(10)
    expect(envelope.data.summary.passed).toBe(10)
    expect(envelope.data.summary.failed).toBe(0)
    expect(envelope.data.summary.requiredFailed).toBe(0)
    expect(envelope.data.summary.optionalFailed).toBe(0)
  })

  it('does not exit 1 when no required check fails (only optional fails)', async () => {
    mockCheckPrerequisite.mockImplementation(async (prereq: { command: string }) => {
      if (prereq.command === 'python3') {
        return { ok: false, command: 'python3', error: 'not found', installInstructions: 'brew install python' }
      }
      return { ok: true, command: prereq.command, version: '1.0.0' }
    })

    await runDoctor()

    const envelope = readEnvelope()
    expect(envelope.data.summary.requiredFailed).toBe(0)
    expect(envelope.data.summary.optionalFailed).toBe(1)
    expect(envelope.data.summary.failed).toBe(1)
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('exits 1 when Node.js (required) fails — still emits data envelope (D-23/D-24)', async () => {
    mockCheckPrerequisite.mockImplementation(async (prereq: { command: string }) => {
      if (prereq.command === 'node') {
        return { ok: false, command: 'node', error: 'not found', installInstructions: 'brew install node' }
      }
      return { ok: true, command: prereq.command, version: '1.0.0' }
    })

    await expect(runDoctor()).rejects.toThrow('process.exit(1)')

    // Envelope STILL emitted before exit (D-23)
    const envelope = readEnvelope()
    expect(envelope.data.summary.requiredFailed).toBe(1)
    expect(envelope.data.summary.optionalFailed).toBe(0)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('summary uses snake_case requiredFailed and optionalFailed (D-24)', async () => {
    mockCheckPrerequisite.mockResolvedValue({ ok: true, command: 'node', version: '20.11.0' })

    await runDoctor()

    const envelope = readEnvelope()
    expect(envelope.data.summary).toHaveProperty('requiredFailed')
    expect(envelope.data.summary).toHaveProperty('optionalFailed')
    expect(typeof envelope.data.summary.requiredFailed).toBe('number')
    expect(typeof envelope.data.summary.optionalFailed).toBe('number')
  })

  it('each check entry carries tool, command, category, required, ok', async () => {
    mockCheckPrerequisite.mockResolvedValue({ ok: true, command: 'node', version: '20.11.0' })

    await runDoctor()

    const envelope = readEnvelope()
    for (const entry of envelope.data.checks) {
      expect(typeof entry.tool).toBe('string')
      expect(typeof entry.command).toBe('string')
      expect(typeof entry.category).toBe('string')
      expect(typeof entry.required).toBe('boolean')
      expect(typeof entry.ok).toBe('boolean')
    }
    const node = envelope.data.checks.find(c => c.tool === 'Node.js')!
    expect(node.required).toBe(true)
    expect(node.version).toBe('20.11.0')
  })

  it('version omitted on failure; error + installInstructions populated', async () => {
    mockCheckPrerequisite.mockImplementation(async (prereq: { command: string }) => {
      if (prereq.command === 'go') {
        return { ok: false, command: 'go', error: '\'go\' not found in PATH', installInstructions: 'brew install go' }
      }
      return { ok: true, command: prereq.command, version: '1.0.0' }
    })

    await runDoctor()

    const envelope = readEnvelope()
    const go = envelope.data.checks.find(c => c.tool === 'Go')!
    expect(go.ok).toBe(false)
    expect(go.version).toBeUndefined()
    expect(go.error).toContain('not found')
    expect(go.installInstructions).toContain('brew install go')
  })

  it('does NOT emit human console.log in JSON mode', async () => {
    mockCheckPrerequisite.mockResolvedValue({ ok: true, command: 'node', version: '20.11.0' })

    await runDoctor()

    expect(consoleSpy).not.toHaveBeenCalled()
  })

  it('exports runDoctorChecks as a deterministic test seam (I-09 option a)', async () => {
    const mod = await import('../../src/commands/doctor.js')
    expect(typeof mod.runDoctorChecks).toBe('function')

    // Inject a minimal overrides array; verify the seam returns the same
    // {check, result} structure the production path uses.
    mockCheckPrerequisite.mockResolvedValue({ ok: true, command: 'node', version: '20.11.0' })
    const result = await mod.runDoctorChecks([
      {
        tool: 'Node.js',
        command: 'node',
        versionFlag: '--version',
        versionRange: '>=20.11.0',
        category: 'Runtimes',
        required: true,
        installInstructions: { darwin: 'brew install node', linux: '', win32: '' },
      },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]!.check.tool).toBe('Node.js')
    expect(result[0]!.result.ok).toBe(true)
  })
})
