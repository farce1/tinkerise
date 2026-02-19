/**
 * Tests for update-check utilities.
 *
 * Tests checkForUpdate cache behavior, HTTP fetch mocking,
 * semver comparison, opt-out env var, and printUpdateNudge output.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Hoist mocks before vi.mock calls
const { mockReadFile, mockWriteFile, mockMkdir } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockMkdir: vi.fn(),
}))

const mockCreateRequire = vi.hoisted(() => vi.fn())

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}))

vi.mock('node:module', () => ({
  createRequire: mockCreateRequire,
}))

vi.mock('picocolors', () => ({
  default: {
    dim: (s: string) => s,
    bold: (s: string) => s,
  },
}))

// Keep real semver for accurate comparison
// Keep real os and path modules

describe('update-check', () => {
  const CURRENT_VERSION = '1.0.0'
  const NEWER_VERSION = '2.0.0'
  const OLDER_VERSION = '0.9.0'
  const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
  const NOW = 1700000000000

  let originalEnv: string | undefined
  let dateNowSpy: ReturnType<typeof vi.spyOn>
  let mockFetch: ReturnType<typeof vi.fn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    // Store and clean env
    originalEnv = process.env.TINKERISE_NO_UPDATE_CHECK
    delete process.env.TINKERISE_NO_UPDATE_CHECK

    // Mock Date.now for cache timing
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(NOW)

    // Mock createRequire to return current version
    mockCreateRequire.mockReturnValue(() => ({ version: CURRENT_VERSION }))

    // Mock fetch
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    // Default: no cache exists
    mockReadFile.mockRejectedValue(new Error('ENOENT'))
    mockWriteFile.mockResolvedValue(undefined)
    mockMkdir.mockResolvedValue(undefined)

    // Spy on console.log for printUpdateNudge
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore env
    if (originalEnv !== undefined) {
      process.env.TINKERISE_NO_UPDATE_CHECK = originalEnv
    }
    else {
      delete process.env.TINKERISE_NO_UPDATE_CHECK
    }
    dateNowSpy.mockRestore()
    vi.unstubAllGlobals()
    consoleLogSpy.mockRestore()
  })

  describe('checkForUpdate', () => {
    it('returns null when TINKERISE_NO_UPDATE_CHECK=1', async () => {
      process.env.TINKERISE_NO_UPDATE_CHECK = '1'
      const { checkForUpdate } = await import('../../src/utils/update-check.js')

      const result = await checkForUpdate()

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns cached latestVersion when cache is fresh and version is newer', async () => {
      const freshCache = JSON.stringify({
        lastCheck: NOW - 1000, // 1 second ago
        latestVersion: NEWER_VERSION,
      })
      mockReadFile.mockResolvedValue(freshCache)

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(result).toBe(NEWER_VERSION)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns null when cache is fresh but version is same as current', async () => {
      const freshCache = JSON.stringify({
        lastCheck: NOW - 1000,
        latestVersion: CURRENT_VERSION,
      })
      mockReadFile.mockResolvedValue(freshCache)

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(result).toBeNull()
    })

    it('returns null when cache is fresh but version is older than current', async () => {
      const freshCache = JSON.stringify({
        lastCheck: NOW - 1000,
        latestVersion: OLDER_VERSION,
      })
      mockReadFile.mockResolvedValue(freshCache)

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(result).toBeNull()
    })

    it('fetches from registry when cache is stale', async () => {
      const staleCache = JSON.stringify({
        lastCheck: NOW - CHECK_INTERVAL - 1000, // older than 24h
        latestVersion: CURRENT_VERSION,
      })
      mockReadFile.mockResolvedValue(staleCache)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: NEWER_VERSION }),
      })

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(mockFetch).toHaveBeenCalledOnce()
      expect(result).toBe(NEWER_VERSION)
    })

    it('fetches from registry when no cache exists', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: NEWER_VERSION }),
      })

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(mockFetch).toHaveBeenCalledOnce()
      expect(result).toBe(NEWER_VERSION)
    })

    it('writes cache after successful fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: NEWER_VERSION }),
      })

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      await checkForUpdate()

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('tinkerise'),
        { recursive: true },
      )
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('update-check.json'),
        expect.stringContaining(NEWER_VERSION),
        'utf-8',
      )
    })

    it('returns latest version from registry when newer than current', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: NEWER_VERSION }),
      })

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(result).toBe(NEWER_VERSION)
    })

    it('returns null from registry when same version as current', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: CURRENT_VERSION }),
      })

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(result).toBeNull()
    })

    it('returns null when fetch response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(result).toBeNull()
    })

    it('returns null when fetch throws (network error)', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(result).toBeNull()
    })

    it('returns null when fetch times out (AbortController fires)', async () => {
      // Simulate an abort error
      mockFetch.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))

      const { checkForUpdate } = await import('../../src/utils/update-check.js')
      const result = await checkForUpdate()

      expect(result).toBeNull()
    })
  })

  describe('printUpdateNudge', () => {
    it('calls console.log with string containing current and latest version', async () => {
      const { printUpdateNudge } = await import('../../src/utils/update-check.js')

      printUpdateNudge(NEWER_VERSION)

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join(' ')
      expect(output).toContain(CURRENT_VERSION)
      expect(output).toContain(NEWER_VERSION)
    })

    it('output contains "tinkerise update" command text', async () => {
      const { printUpdateNudge } = await import('../../src/utils/update-check.js')

      printUpdateNudge(NEWER_VERSION)

      const output = consoleLogSpy.mock.calls.map(c => c[0]).join(' ')
      expect(output).toContain('tinkerise update')
    })
  })
})
