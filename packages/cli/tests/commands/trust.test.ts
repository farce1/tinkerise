/**
 * Tests for the `tinkerise trust` command.
 *
 * Verifies:
 * - trust add canonicalizes the source and persists trust
 * - trust remove canonicalizes and revokes
 * - trust list reads the store
 * - invalid source specs are rejected
 */

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerTrustCommand } from '../../src/commands/trust.js'

const { mockListTrustedSources, mockTrustSource, mockUntrustSource, mockDiscoverNpmSources, mockLogInfo } = vi.hoisted(() => ({
  mockListTrustedSources: vi.fn(),
  mockTrustSource: vi.fn(),
  mockUntrustSource: vi.fn(),
  mockDiscoverNpmSources: vi.fn(),
  mockLogInfo: vi.fn(),
}))

vi.mock('@tinkerise/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tinkerise/core')>()
  return {
    ...actual,
    listTrustedSources: mockListTrustedSources,
    trustSource: mockTrustSource,
    untrustSource: mockUntrustSource,
    discoverNpmSources: mockDiscoverNpmSources,
  }
})

vi.mock('@clack/prompts', () => ({
  log: { info: mockLogInfo, success: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('picocolors', () => ({
  default: { dim: (s: string) => s, bold: (s: string) => s },
}))

async function runTrust(args: string[]): Promise<void> {
  const program = new Command()
  program.exitOverride()
  registerTrustCommand(program)
  await program.parseAsync(['node', 'tinkerise', 'trust', ...args])
}

describe('trust command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListTrustedSources.mockResolvedValue([])
    mockTrustSource.mockResolvedValue(undefined)
    mockUntrustSource.mockResolvedValue(true)
    mockDiscoverNpmSources.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('trusts a source using its canonical id', async () => {
    await runTrust(['add', 'github:Acme/Widgets'])
    expect(mockTrustSource).toHaveBeenCalledWith('github:acme/widgets')
  })

  it('revokes trust using the canonical id', async () => {
    await runTrust(['remove', 'npm:Foo'])
    expect(mockUntrustSource).toHaveBeenCalledWith('npm:foo')
  })

  it('lists trusted sources', async () => {
    mockListTrustedSources.mockResolvedValue([{ id: 'npm:foo', trustedAt: '2026-06-14T00:00:00.000Z' }])
    await runTrust(['list'])
    expect(mockListTrustedSources).toHaveBeenCalled()
  })

  it('shows installed-but-untrusted sources', async () => {
    mockListTrustedSources.mockResolvedValue([{ id: 'npm:tinkerise-enhancement-trusted', trustedAt: '2026-06-14T00:00:00.000Z' }])
    mockDiscoverNpmSources.mockResolvedValue(['tinkerise-enhancement-trusted', 'tinkerise-scaffolder-new'])

    await runTrust(['list'])

    const output = mockLogInfo.mock.calls.map(c => String(c[0])).join('\n')
    expect(output).toContain('npm:tinkerise-scaffolder-new')
    // already-trusted discovered packages are not duplicated into the untrusted list
    expect(output).not.toMatch(/not trusted[\s\S]*tinkerise-enhancement-trusted/)
  })

  it('rejects an invalid source spec', async () => {
    await expect(runTrust(['add', 'not-a-source'])).rejects.toThrow(/source/i)
    expect(mockTrustSource).not.toHaveBeenCalled()
  })
})
