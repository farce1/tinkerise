/**
 * Tests for interactive mode utilities.
 *
 * Tests isFullyNonInteractive, buildPreselectedOptions,
 * mergePromptAndFlags, and ensureNonInteractive.
 *
 * Mocks Commander.js Command for getOptionValueSource() and
 * @tinkerise/core for isCI/ciName.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Use vi.hoisted for mocks referenced inside vi.mock factories
const { mockIsCI, mockCiName } = vi.hoisted(() => ({
  mockIsCI: { value: false },
  mockCiName: { value: null as string | null },
}))

vi.mock('@tinkerise/core', () => ({
  get isCI() { return mockIsCI.value },
  get ciName() { return mockCiName.value },
}))

vi.mock('picocolors', () => ({
  default: {
    red: (s: string) => s,
    bold: (s: string) => s,
    dim: (s: string) => s,
  },
}))

import {
  isOptionProvided,
  isFullyNonInteractive,
  buildPreselectedOptions,
  mergePromptAndFlags,
  ensureNonInteractive,
} from '../../src/utils/interactive.js'
import type { Command } from 'commander'

/**
 * Create a mock Commander Command with configurable option sources.
 */
function createMockCommand(
  optionSources: Record<string, string> = {},
  optionValues: Record<string, unknown> = {},
): Command {
  return {
    getOptionValueSource: vi.fn((name: string) => optionSources[name] ?? undefined),
    opts: vi.fn(() => optionValues),
  } as unknown as Command
}

describe('isOptionProvided', () => {
  it('returns true when option source is cli', () => {
    const cmd = createMockCommand({ typescript: 'cli' })
    expect(isOptionProvided(cmd, 'typescript')).toBe(true)
  })

  it('returns false when option source is default', () => {
    const cmd = createMockCommand({ typescript: 'default' })
    expect(isOptionProvided(cmd, 'typescript')).toBe(false)
  })

  it('returns false when option source is undefined', () => {
    const cmd = createMockCommand({})
    expect(isOptionProvided(cmd, 'typescript')).toBe(false)
  })
})

describe('isFullyNonInteractive', () => {
  it('returns false when no args provided', () => {
    const cmd = createMockCommand()
    expect(isFullyNonInteractive(cmd)).toBe(false)
  })

  it('returns false when only category provided', () => {
    const cmd = createMockCommand()
    expect(isFullyNonInteractive(cmd, 'web')).toBe(false)
  })

  it('returns false when category + framework but no name', () => {
    const cmd = createMockCommand()
    expect(isFullyNonInteractive(cmd, 'web', 'next')).toBe(false)
  })

  it('returns true when category + framework + name all provided', () => {
    const cmd = createMockCommand()
    expect(isFullyNonInteractive(cmd, 'web', 'next', 'my-app')).toBe(true)
  })
})

describe('buildPreselectedOptions', () => {
  it('returns ["typescript"] when --typescript provided via CLI', () => {
    const cmd = createMockCommand(
      { typescript: 'cli' },
      { typescript: true },
    )
    expect(buildPreselectedOptions(cmd)).toEqual(['typescript'])
  })

  it('returns ["typescript", "tailwind"] when both flags provided', () => {
    const cmd = createMockCommand(
      { typescript: 'cli', tailwind: 'cli' },
      { typescript: true, tailwind: true },
    )
    expect(buildPreselectedOptions(cmd)).toEqual(['typescript', 'tailwind'])
  })

  it('returns [] when no option flags provided', () => {
    const cmd = createMockCommand(
      { typescript: 'default', tailwind: 'default' },
      { typescript: false, tailwind: false },
    )
    expect(buildPreselectedOptions(cmd)).toEqual([])
  })

  it('does not include options whose value is false', () => {
    const cmd = createMockCommand(
      { typescript: 'cli' },
      { typescript: false },
    )
    expect(buildPreselectedOptions(cmd)).toEqual([])
  })

  it('includes eslint when explicitly provided', () => {
    const cmd = createMockCommand(
      { eslint: 'cli' },
      { eslint: true },
    )
    expect(buildPreselectedOptions(cmd)).toEqual(['eslint'])
  })

  it('deduplicates when both --ts and --typescript provided', () => {
    const cmd = createMockCommand(
      { typescript: 'cli', ts: 'cli' },
      { typescript: true, ts: true },
    )
    const result = buildPreselectedOptions(cmd)
    expect(result).toEqual(['typescript'])
    expect(result.length).toBe(1)
  })
})

describe('mergePromptAndFlags', () => {
  it('merges prompt options into record', () => {
    const cmd = createMockCommand({}, {})
    const result = mergePromptAndFlags(['typescript', 'eslint'], cmd)
    expect(result).toEqual({ typescript: true, eslint: true })
  })

  it('adds no-git when git option is explicitly false', () => {
    const cmd = createMockCommand(
      { git: 'cli' },
      { git: false },
    )
    const result = mergePromptAndFlags([], cmd)
    expect(result['no-git']).toBe(true)
  })

  it('adds no-install when install option is explicitly false', () => {
    const cmd = createMockCommand(
      { install: 'cli' },
      { install: false },
    )
    const result = mergePromptAndFlags([], cmd)
    expect(result['no-install']).toBe(true)
  })

  it('does not add no-git when git was not explicitly provided', () => {
    const cmd = createMockCommand(
      { git: 'default' },
      { git: true },
    )
    const result = mergePromptAndFlags([], cmd)
    expect(result['no-git']).toBeUndefined()
  })

  it('does not add no-install when install was not explicitly provided', () => {
    const cmd = createMockCommand(
      { install: 'default' },
      { install: true },
    )
    const result = mergePromptAndFlags([], cmd)
    expect(result['no-install']).toBeUndefined()
  })
})

describe('ensureNonInteractive', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    // Enable CI for these tests
    mockIsCI.value = true
    mockCiName.value = null
  })

  afterEach(() => {
    exitSpy.mockRestore()
    stderrSpy.mockRestore()
    mockIsCI.value = false
    mockCiName.value = null
  })

  it('exits with code 1 when category is missing', () => {
    const cmd = createMockCommand()
    expect(() => ensureNonInteractive(cmd)).toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('prints error mentioning category when missing', () => {
    const cmd = createMockCommand()
    try { ensureNonInteractive(cmd) } catch { /* expected */ }
    const output = stderrSpy.mock.calls.map(c => c[0]).join('')
    expect(output).toContain('category')
  })

  it('exits when framework is missing', () => {
    const cmd = createMockCommand()
    expect(() => ensureNonInteractive(cmd, 'web')).toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(1)
    const output = stderrSpy.mock.calls.map(c => c[0]).join('')
    expect(output).toContain('framework')
  })

  it('exits when name is missing', () => {
    const cmd = createMockCommand()
    expect(() => ensureNonInteractive(cmd, 'web', 'next')).toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(1)
    const output = stderrSpy.mock.calls.map(c => c[0]).join('')
    expect(output).toContain('name')
  })

  it('does not exit when all args provided', () => {
    const cmd = createMockCommand()
    expect(() => ensureNonInteractive(cmd, 'web', 'next', 'my-app')).not.toThrow()
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('includes CI environment name in error message', () => {
    mockCiName.value = 'GitHub Actions'
    const cmd = createMockCommand()
    try { ensureNonInteractive(cmd) } catch { /* expected */ }
    const output = stderrSpy.mock.calls.map(c => c[0]).join('')
    expect(output).toContain('GitHub Actions')
  })

  it('shows "unknown" when CI name is null', () => {
    mockCiName.value = null
    const cmd = createMockCommand()
    try { ensureNonInteractive(cmd) } catch { /* expected */ }
    const output = stderrSpy.mock.calls.map(c => c[0]).join('')
    expect(output).toContain('unknown')
  })

  it('does not exit when isCI is false', () => {
    mockIsCI.value = false
    const cmd = createMockCommand()
    // No args at all, but not in CI, so should be a no-op
    expect(() => ensureNonInteractive(cmd)).not.toThrow()
    expect(exitSpy).not.toHaveBeenCalled()
  })
})
