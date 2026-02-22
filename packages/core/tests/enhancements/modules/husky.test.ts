import type { ProjectContext } from '../../../src/enhancements/types.js'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { huskyModule } from '../../../src/enhancements/modules/husky.js'

const TEST_ROOT = join('/', 'tmp', 'test-project')
const projectPath = (relativePath: string) => join(TEST_ROOT, ...relativePath.split('/'))
const normalizePath = (path: string) => path.replace(/\\/g, '/')

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

describe('huskyModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no directories or files exist
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    // Default: fresh package.json with no tools
    mockReadFile.mockResolvedValue(JSON.stringify({
      type: 'module',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    }))
  })

  describe('detect', () => {
    it('returns not installed when no .husky dir', async () => {
      const result = await huskyModule.detect(makeCtx())
      expect(result.installed).toBe(false)
    })

    it('returns installed when .husky exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.husky'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await huskyModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns installed when husky in deps', async () => {
      const result = await huskyModule.detect(
        makeCtx({ installedDeps: { husky: '^9.0.0' } }),
      )
      expect(result.installed).toBe(true)
    })
  })

  describe('install', () => {
    it('fails gracefully when no .git directory', async () => {
      const result = await huskyModule.install(makeCtx())

      expect(result.success).toBe(false)
      expect(result.warnings).toContain(
        'No .git directory found. Initialize git first: git init',
      )
    })

    it('creates pre-commit hook with lint-staged', async () => {
      // .git exists
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.git'))
          return undefined
        throw new Error('ENOENT')
      })

      await huskyModule.install(makeCtx())

      // Check that .husky/pre-commit was written
      const preCommitCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => normalizePath(c[0] as string).includes('.husky/pre-commit'),
      )
      expect(preCommitCall).toBeTruthy()
      expect(preCommitCall![1]).toBe('npx lint-staged\n')
    })

    it('lint-staged config includes eslint when eslint installed', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.git'))
          return undefined
        throw new Error('ENOENT')
      })
      mockReadFile.mockResolvedValue(JSON.stringify({
        type: 'module',
        scripts: {},
        dependencies: {},
        devDependencies: { eslint: '^9.0.0' },
      }))

      await huskyModule.install(makeCtx())

      // Find the package.json write with lint-staged
      const pkgCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('package.json'),
      )
      const lastPkgWrite = pkgCalls[pkgCalls.length - 1]
      const parsed = JSON.parse(lastPkgWrite[1] as string)

      expect(parsed['lint-staged']).toBeDefined()
      const config = parsed['lint-staged'] as Record<string, string[]>
      const codeGlob = Object.keys(config).find(k => k.includes('js'))
      expect(codeGlob).toBeDefined()
      expect(config[codeGlob!]).toContain('eslint --fix')
    })

    it('lint-staged config includes prettier when prettier installed', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.git'))
          return undefined
        throw new Error('ENOENT')
      })
      mockReadFile.mockResolvedValue(JSON.stringify({
        type: 'module',
        scripts: {},
        dependencies: {},
        devDependencies: { prettier: '^3.0.0' },
      }))

      await huskyModule.install(makeCtx())

      const pkgCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('package.json'),
      )
      const lastPkgWrite = pkgCalls[pkgCalls.length - 1]
      const parsed = JSON.parse(lastPkgWrite[1] as string)

      const config = parsed['lint-staged'] as Record<string, string[]>
      const formatGlob = Object.keys(config).find(k => k.includes('json'))
      expect(formatGlob).toBeDefined()
      expect(config[formatGlob!]).toContain('prettier --write')
    })

    it('lint-staged config includes both when both installed', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.git'))
          return undefined
        throw new Error('ENOENT')
      })
      mockReadFile.mockResolvedValue(JSON.stringify({
        type: 'module',
        scripts: {},
        dependencies: {},
        devDependencies: { eslint: '^9.0.0', prettier: '^3.0.0' },
      }))

      await huskyModule.install(makeCtx())

      const pkgCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('package.json'),
      )
      const lastPkgWrite = pkgCalls[pkgCalls.length - 1]
      const parsed = JSON.parse(lastPkgWrite[1] as string)

      const config = parsed['lint-staged'] as Record<string, string[]>
      expect(Object.keys(config).length).toBe(2)
    })

    it('lint-staged config is empty when neither installed', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.git'))
          return undefined
        throw new Error('ENOENT')
      })

      await huskyModule.install(makeCtx())

      const pkgCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('package.json'),
      )
      const lastPkgWrite = pkgCalls[pkgCalls.length - 1]
      const parsed = JSON.parse(lastPkgWrite[1] as string)

      const config = parsed['lint-staged'] as Record<string, string[]>
      expect(Object.keys(config).length).toBe(0)
    })

    it('adds prepare script', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.git'))
          return undefined
        throw new Error('ENOENT')
      })

      await huskyModule.install(makeCtx())

      // First writeFile for package.json should be from addScript('prepare')
      const pkgCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('package.json'),
      )
      const firstPkgWrite = pkgCalls[0]
      const parsed = JSON.parse(firstPkgWrite[1] as string)
      expect(parsed.scripts.prepare).toBe('husky')
    })
  })
})
