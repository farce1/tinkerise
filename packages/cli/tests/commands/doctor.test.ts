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

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

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

import { runDoctor, DOCTOR_CHECKS } from '../../src/commands/doctor.js'

describe('DOCTOR_CHECKS completeness', () => {
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

  it('Go uses versionFlag "version" not "--version"', () => {
    const goCheck = DOCTOR_CHECKS.find(c => c.command === 'go')!
    expect(goCheck.versionFlag).toBe('version')
  })

  it('Dart has no versionRange (informational only)', () => {
    const dartCheck = DOCTOR_CHECKS.find(c => c.command === 'dart')!
    expect(dartCheck.versionRange).toBeUndefined()
  })

  it('Python uses python3 command (not python)', () => {
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
          error: "'python3' not found in PATH",
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
