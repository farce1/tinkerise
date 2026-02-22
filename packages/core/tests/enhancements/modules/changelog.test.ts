/**
 * Tests for changelog enhancement module.
 *
 * Verifies:
 * - detect() returns installed when config files exist
 * - detect() returns installed when conventional-changelog-cli in deps
 * - detect() returns installed when standard-version in deps
 * - detect() returns not installed when no config or deps
 * - install() installs conventional-changelog-cli with correct version
 * - install() writes .changelogrc.json config
 * - install() adds changelog and release scripts
 * - install() warns about commitlint when not detected
 * - install() does not warn when commitlint config exists
 */

import type { ProjectContext } from '../../../src/enhancements/types.js'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { changelogModule } from '../../../src/enhancements/modules/changelog.js'

const TEST_ROOT = join('/', 'tmp', 'test-project')
const projectPath = (relativePath: string) => join(TEST_ROOT, ...relativePath.split('/'))

// Hoist mocks for vi.mock factories
const mockExeca = vi.hoisted(() => vi.fn().mockResolvedValue({ stdout: '', stderr: '' }))
const mockAccess = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockMkdir = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('execa', () => ({
  execa: mockExeca,
}))

vi.mock('node:fs/promises', () => ({
  access: mockAccess,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}))

/** Build a mock ProjectContext with overridable fields */
function makeCtx(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    rootDir: TEST_ROOT,
    packageManager: 'npm',
    framework: null,
    packageJson: { type: 'module' },
    installedDeps: {},
    freshScaffold: false,
    verbose: false,
    ...overrides,
  }
}

describe('changelogModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no config files exist
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    // Default: fresh package.json with no scripts
    mockReadFile.mockResolvedValue(JSON.stringify({ type: 'module', scripts: {} }))
  })

  describe('detect', () => {
    it('returns not installed when no config files or deps exist', async () => {
      const ctx = makeCtx()
      const result = await changelogModule.detect(ctx)

      expect(result.installed).toBe(false)
      expect(result.configFiles).toEqual([])
    })

    it('returns installed when .changelogrc.json exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.changelogrc.json'))
          return undefined
        throw new Error('ENOENT')
      })

      const ctx = makeCtx()
      const result = await changelogModule.detect(ctx)

      expect(result.installed).toBe(true)
      expect(result.configFiles).toContain(projectPath('.changelogrc.json'))
    })

    it('returns installed when .versionrc exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.versionrc'))
          return undefined
        throw new Error('ENOENT')
      })

      const ctx = makeCtx()
      const result = await changelogModule.detect(ctx)

      expect(result.installed).toBe(true)
    })

    it('returns installed when conventional-changelog-cli is in deps', async () => {
      const ctx = makeCtx({
        installedDeps: { 'conventional-changelog-cli': '^6.0.0' },
      })
      const result = await changelogModule.detect(ctx)

      expect(result.installed).toBe(true)
    })

    it('returns installed when standard-version is in deps', async () => {
      const ctx = makeCtx({
        installedDeps: { 'standard-version': '^9.0.0' },
      })
      const result = await changelogModule.detect(ctx)

      expect(result.installed).toBe(true)
    })
  })

  describe('install', () => {
    it('installs conventional-changelog-cli as dev dependency', async () => {
      const ctx = makeCtx()
      await changelogModule.install(ctx)

      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining(['install', '--save-dev']),
        expect.objectContaining({ cwd: TEST_ROOT }),
      )

      const args = mockExeca.mock.calls[0][1] as string[]
      expect(args.some((a: string) => a.startsWith('conventional-changelog-cli@'))).toBe(true)
    })

    it('writes .changelogrc.json config file', async () => {
      const ctx = makeCtx()
      await changelogModule.install(ctx)

      expect(mockWriteFile).toHaveBeenCalledWith(
        projectPath('.changelogrc.json'),
        expect.stringContaining('conventionalcommits'),
        'utf-8',
      )
    })

    it('adds changelog and release scripts to package.json', async () => {
      const ctx = makeCtx()
      await changelogModule.install(ctx)

      // addScript calls readFile then writeFile for each script
      const pkgWriteCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('package.json'),
      )
      expect(pkgWriteCalls.length).toBeGreaterThanOrEqual(2)

      // Check that changelog script was added
      const lastPkgWrite = pkgWriteCalls[pkgWriteCalls.length - 1]
      const content = lastPkgWrite[1] as string
      expect(content).toContain('"release"')
    })

    it('warns about commitlint when not detected', async () => {
      const ctx = makeCtx()
      const result = await changelogModule.install(ctx)

      expect(result.warnings).toContain(
        'Consider adding commitlint (tinkerise add commitlint) for commit message enforcement',
      )
    })

    it('does not warn about commitlint when commitlint config exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('commitlint.config.js'))
          return undefined
        throw new Error('ENOENT')
      })

      const ctx = makeCtx()
      const result = await changelogModule.install(ctx)

      expect(result.warnings).not.toContain(
        'Consider adding commitlint (tinkerise add commitlint) for commit message enforcement',
      )
    })

    it('does not warn when commitlint key exists in package.json', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        type: 'module',
        scripts: {},
        commitlint: { extends: ['@commitlint/config-conventional'] },
      }))

      const ctx = makeCtx()
      const result = await changelogModule.install(ctx)

      expect(result.warnings).not.toContain(
        'Consider adding commitlint (tinkerise add commitlint) for commit message enforcement',
      )
    })

    it('returns success with filesModified and packagesAdded', async () => {
      const ctx = makeCtx()
      const result = await changelogModule.install(ctx)

      expect(result.success).toBe(true)
      expect(result.filesModified).toContain(projectPath('.changelogrc.json'))
      expect(result.packagesAdded!.length).toBeGreaterThan(0)
    })

    it('uses correct PM when packageManager is bun', async () => {
      const ctx = makeCtx({ packageManager: 'bun' })
      await changelogModule.install(ctx)

      expect(mockExeca).toHaveBeenCalledWith(
        'bun',
        expect.arrayContaining(['add', '--dev']),
        expect.objectContaining({ cwd: TEST_ROOT }),
      )
    })
  })
})
