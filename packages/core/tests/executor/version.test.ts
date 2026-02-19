/**
 * Tests for upstream version detection.
 *
 * Verifies:
 * - Returns null when versionedFlags is empty array (early-return)
 * - Returns null when versionedFlags is undefined (early-return)
 * - Returns valid semver string when command succeeds
 * - Calls execa with correct command and args
 * - Returns null when command fails/throws
 * - Returns null for non-semver output
 * - Coerces version strings with prefix/suffix
 */

import type { ScaffolderEntry } from '@tinkerise/shared'
import { defineScaffolder } from '@tinkerise/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { detectUpstreamVersion } from '../../src/executor/version.js'

// Hoist mock for vi.mock factory
const mockExeca = vi.hoisted(() => vi.fn())

vi.mock('execa', () => ({
  execa: mockExeca,
}))

/** Create a test scaffolder entry with optional versionedFlags */
function makeEntry(overrides: Partial<ScaffolderEntry> = {}): ScaffolderEntry {
  return defineScaffolder({
    name: 'test-tool',
    category: 'web',
    command: 'npx',
    packageName: 'create-test',
    integration: { type: 'delegate', command: 'create-test' },
    ...overrides,
  })
}

describe('detectUpstreamVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null and does NOT call execa when versionedFlags is empty array', async () => {
    const entry = makeEntry({ versionedFlags: [] })
    const result = await detectUpstreamVersion(entry)

    expect(result).toBeNull()
    expect(mockExeca).not.toHaveBeenCalled()
  })

  it('returns null and does NOT call execa when versionedFlags is undefined', async () => {
    const entry = makeEntry()
    const result = await detectUpstreamVersion(entry)

    expect(result).toBeNull()
    expect(mockExeca).not.toHaveBeenCalled()
  })

  it('returns valid semver string when execa resolves with semver stdout', async () => {
    mockExeca.mockResolvedValue({ stdout: '5.3.1' })

    const entry = makeEntry({
      versionedFlags: [{ versionRange: '>=5.0.0', flags: [{ unified: 'typescript', native: '--ts' }] }],
    })
    const result = await detectUpstreamVersion(entry)

    expect(result).toBe('5.3.1')
  })

  it('calls execa with correct command, args, and options', async () => {
    mockExeca.mockResolvedValue({ stdout: '1.0.0' })

    const entry = makeEntry({
      command: 'npx',
      packageName: 'create-test',
      versionedFlags: [{ versionRange: '>=1.0.0', flags: [{ unified: 'ts', native: '--ts' }] }],
    })
    await detectUpstreamVersion(entry)

    expect(mockExeca).toHaveBeenCalledWith(
      'npx',
      ['create-test', '--version'],
      expect.objectContaining({ reject: false, timeout: 10_000 }),
    )
  })

  it('returns null when execa rejects (command not found)', async () => {
    mockExeca.mockRejectedValue(new Error('Command not found'))

    const entry = makeEntry({
      versionedFlags: [{ versionRange: '>=1.0.0', flags: [{ unified: 'ts', native: '--ts' }] }],
    })
    const result = await detectUpstreamVersion(entry)

    expect(result).toBeNull()
  })

  it('returns null when execa resolves with non-semver output', async () => {
    mockExeca.mockResolvedValue({ stdout: 'not a version' })

    const entry = makeEntry({
      versionedFlags: [{ versionRange: '>=1.0.0', flags: [{ unified: 'ts', native: '--ts' }] }],
    })
    const result = await detectUpstreamVersion(entry)

    expect(result).toBeNull()
  })

  it('coerces version strings with prefix and suffix', async () => {
    mockExeca.mockResolvedValue({ stdout: 'v4.2.1\n' })

    const entry = makeEntry({
      versionedFlags: [{ versionRange: '>=4.0.0', flags: [{ unified: 'ts', native: '--ts' }] }],
    })
    const result = await detectUpstreamVersion(entry)

    expect(result).toBe('4.2.1')
  })
})
