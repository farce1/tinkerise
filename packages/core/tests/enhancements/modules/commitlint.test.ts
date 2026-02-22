import type { ProjectContext } from '../../../src/enhancements/types.js'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { commitlintModule } from '../../../src/enhancements/modules/commitlint.js'

const TEST_ROOT = join('/', 'tmp', 'test-project')
const projectPath = (relativePath: string) => join(TEST_ROOT, ...relativePath.split('/'))

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

describe('commitlintModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no files or directories exist
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    // Default: fresh package.json with type: module
    mockReadFile.mockResolvedValue(JSON.stringify({
      type: 'module',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    }))
  })

  describe('detect', () => {
    it('returns not installed when no config files exist', async () => {
      const result = await commitlintModule.detect(makeCtx())
      expect(result.installed).toBe(false)
    })

    it('returns installed when commitlint.config.js exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('commitlint.config.js'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await commitlintModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns installed when package.json has commitlint key', async () => {
      const result = await commitlintModule.detect(
        makeCtx({ packageJson: { type: 'module', commitlint: { extends: ['@commitlint/config-conventional'] } } }),
      )
      expect(result.installed).toBe(true)
    })

    it('returns installed when .commitlintrc exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.commitlintrc'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await commitlintModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })
  })

  describe('install', () => {
    it('installs @commitlint/cli and @commitlint/config-conventional', async () => {
      await commitlintModule.install(makeCtx())

      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining([
          'install',
          '--save-dev',
          expect.stringContaining('@commitlint/cli@'),
          expect.stringContaining('@commitlint/config-conventional@'),
        ]),
        expect.objectContaining({ cwd: TEST_ROOT }),
      )
    })

    it('generates commitlint.config.js with config-conventional extends', async () => {
      await commitlintModule.install(makeCtx())

      const configCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('commitlint.config.js'),
      )
      expect(configCall).toBeTruthy()
      expect(configCall![1]).toContain('extends: [\'@commitlint/config-conventional\']')
    })

    it('uses .mjs extension when package.json type is not module', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        scripts: {},
        dependencies: {},
        devDependencies: {},
      }))

      await commitlintModule.install(makeCtx({ packageJson: {} }))

      const configCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('commitlint.config.mjs'),
      )
      expect(configCall).toBeTruthy()
    })

    it('adds commit-msg hook when .husky directory exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.husky'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await commitlintModule.install(makeCtx())

      const hookCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('.husky/commit-msg'),
      )
      expect(hookCall).toBeTruthy()
      expect(hookCall![1]).toBe('npx --no -- commitlint --edit $1\n')
      expect(result.filesModified).toEqual(
        expect.arrayContaining([expect.stringContaining('.husky/commit-msg')]),
      )
    })

    it('does NOT write commit-msg hook when .husky directory is absent', async () => {
      await commitlintModule.install(makeCtx())

      const hookCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('commit-msg'),
      )
      expect(hookCall).toBeUndefined()
    })

    it('includes warning message when husky is not present', async () => {
      const result = await commitlintModule.install(makeCtx())

      expect(result.warnings).toContain(
        'Add husky (`tinkerise add husky`) to enable git hook enforcement',
      )
    })

    it('does not include warning when husky is present', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.husky'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await commitlintModule.install(makeCtx())

      expect(result.warnings).toHaveLength(0)
    })

    it('returns success with correct structure', async () => {
      const result = await commitlintModule.install(makeCtx())

      expect(result.success).toBe(true)
      expect(result.packagesAdded).toEqual(
        expect.arrayContaining([
          expect.stringContaining('@commitlint/cli@'),
          expect.stringContaining('@commitlint/config-conventional@'),
        ]),
      )
    })
  })
})
