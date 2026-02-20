import type { Prerequisite } from '@tinkerise/shared'
import { describe, expect, it, vi } from 'vitest'

// Mock modules before importing the module under test
vi.mock('which', () => ({
  default: vi.fn(),
}))

// Mock execa to avoid the addAbortListener issue in Bun
vi.mock('execa', () => ({
  execa: vi.fn(),
}))

// Dynamic import after mocks are set up
const { default: which } = await import('which')
const { execa } = await import('execa')
const { checkPrerequisite, checkPrerequisites, PrerequisiteError } = await import('../../src/prerequisites/checker')

const mockedWhich = vi.mocked(which)
const mockedExeca = vi.mocked(execa)

describe('checkPrerequisite()', () => {
  describe('command existence', () => {
    it('returns ok: true when which resolves the command', async () => {
      mockedWhich.mockResolvedValueOnce('/usr/bin/node' as never)

      const result = await checkPrerequisite({ command: 'node', versionFlag: '--version' })
      expect(result.ok).toBe(true)
      expect(result.command).toBe('node')
    })

    it('returns ok: false with install instructions when which returns null', async () => {
      mockedWhich.mockResolvedValueOnce(null as never)

      const prereq: Prerequisite = {
        command: 'go',
        versionFlag: '--version',
        installInstructions: { darwin: 'brew install go' },
      }
      const result = await checkPrerequisite(prereq)

      expect(result.ok).toBe(false)
      expect(result.error).toContain('not found in PATH')
      expect(result.installInstructions).toBeDefined()
    })
  })

  describe('version checking', () => {
    it('returns ok: true when version satisfies range', async () => {
      mockedWhich.mockResolvedValueOnce('/usr/bin/node' as never)
      mockedExeca.mockResolvedValueOnce({ stdout: 'v20.11.0' } as never)

      const result = await checkPrerequisite({
        command: 'node',
        versionFlag: '--version',
        versionRange: '>=20.0.0',
      })

      expect(result.ok).toBe(true)
      expect(result.version).toBe('20.11.0')
    })

    it('returns ok: false when version does not satisfy range', async () => {
      mockedWhich.mockResolvedValueOnce('/usr/bin/node' as never)
      mockedExeca.mockResolvedValueOnce({ stdout: 'v18.0.0' } as never)

      const result = await checkPrerequisite({
        command: 'node',
        versionFlag: '--version',
        versionRange: '>=20.0.0',
      })

      expect(result.ok).toBe(false)
      expect(result.error).toContain('does not satisfy')
    })

    it('handles semver.coerce() for various version formats', async () => {
      mockedWhich.mockResolvedValueOnce('/usr/bin/python3' as never)
      mockedExeca.mockResolvedValueOnce({ stdout: 'Python 3.12.1' } as never)

      const result = await checkPrerequisite({
        command: 'python3',
        versionFlag: '--version',
        versionRange: '>=3.10.0',
      })

      expect(result.ok).toBe(true)
      expect(result.version).toBe('3.12.1')
    })

    it('returns ok: false when version cannot be parsed', async () => {
      mockedWhich.mockResolvedValueOnce('/usr/bin/tool' as never)
      mockedExeca.mockResolvedValueOnce({ stdout: 'no version info' } as never)

      const result = await checkPrerequisite({
        command: 'tool',
        versionFlag: '--version',
        versionRange: '>=1.0.0',
      })

      expect(result.ok).toBe(false)
      expect(result.error).toContain('Could not parse version')
    })
  })
})

describe('checkPrerequisites()', () => {
  it('resolves successfully when all pass', async () => {
    mockedWhich.mockResolvedValue('/usr/bin/node' as never)

    const results = await checkPrerequisites([
      { command: 'node', versionFlag: '--version' },
    ])

    expect(results).toHaveLength(1)
    expect(results[0]!.ok).toBe(true)
  })

  it('throws PrerequisiteError when any fail', async () => {
    mockedWhich.mockResolvedValueOnce(null as never)

    await expect(
      checkPrerequisites([
        { command: 'missing-tool', versionFlag: '--version' },
      ]),
    ).rejects.toThrow(PrerequisiteError)
  })

  it('error message includes all failures', async () => {
    mockedWhich.mockResolvedValueOnce(null as never)
    mockedWhich.mockResolvedValueOnce(null as never)

    try {
      await checkPrerequisites([
        { command: 'tool-a', versionFlag: '--version' },
        { command: 'tool-b', versionFlag: '--version' },
      ])
      expect.unreachable('should have thrown')
    }
    catch (e) {
      expect(e).toBeInstanceOf(PrerequisiteError)
      const err = e as PrerequisiteError
      expect(err.message).toContain('tool-a')
      expect(err.message).toContain('tool-b')
    }
  })
})

describe('platform-aware instructions', () => {
  it('returns fallback message when platform not in map', async () => {
    mockedWhich.mockResolvedValueOnce(null as never)

    const result = await checkPrerequisite({
      command: 'exotic-tool',
      versionFlag: '--version',
      installInstructions: {},
    })

    expect(result.ok).toBe(false)
    expect(result.installInstructions).toContain('exotic-tool')
  })
})
