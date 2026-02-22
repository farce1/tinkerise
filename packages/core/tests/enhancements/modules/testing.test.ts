import type { ProjectContext } from '../../../src/enhancements/types.js'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { testingModule } from '../../../src/enhancements/modules/testing.js'

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

describe('testingModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no files exist
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    // Default: fresh package.json
    mockReadFile.mockResolvedValue(JSON.stringify({
      type: 'module',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    }))
  })

  describe('detect', () => {
    it('returns not installed when no test config exists', async () => {
      const result = await testingModule.detect(makeCtx())
      expect(result.installed).toBe(false)
    })

    it('returns installed when vitest.config.ts exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('vitest.config.ts'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await testingModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns installed when jest.config.js exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('jest.config.js'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await testingModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns installed when vitest is in installedDeps', async () => {
      const result = await testingModule.detect(
        makeCtx({ installedDeps: { vitest: '^3.0.0' } }),
      )
      expect(result.installed).toBe(true)
    })

    it('returns installed when jest is in installedDeps', async () => {
      const result = await testingModule.detect(
        makeCtx({ installedDeps: { jest: '^29.0.0' } }),
      )
      expect(result.installed).toBe(true)
    })
  })

  describe('install', () => {
    it('installs vitest package', async () => {
      await testingModule.install(makeCtx())

      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining([
          'install',
          '--save-dev',
          expect.stringContaining('vitest@'),
        ]),
        expect.objectContaining({ cwd: TEST_ROOT }),
      )
    })

    it('generates vitest.config.ts with defineConfig', async () => {
      await testingModule.install(makeCtx())

      const configCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('vitest.config.ts'),
      )
      expect(configCall).toBeTruthy()
      const content = configCall![1] as string
      expect(content).toContain('import { defineConfig } from \'vitest/config\'')
      expect(content).toContain('include: [\'**/*.{test,spec}.{js,ts,jsx,tsx}\']')
      expect(content).toContain('exclude: [\'node_modules\', \'dist\']')
    })

    it('adds test and test:run scripts to package.json', async () => {
      await testingModule.install(makeCtx())

      // addScript reads + writes package.json, so check writeFile calls
      const pkgCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('package.json'),
      )

      // Should have two writes for two addScript calls
      expect(pkgCalls.length).toBe(2)

      // First write: 'test' script
      const firstPkg = JSON.parse(pkgCalls[0]![1] as string)
      expect(firstPkg.scripts.test).toBe('vitest')

      // Second write: 'test:run' script — reads fresh from previous write
      // But since mockReadFile always returns the default, we verify the call happened
      const secondPkg = JSON.parse(pkgCalls[1]![1] as string)
      expect(secondPkg.scripts['test:run']).toBe('vitest run')
    })

    it('creates example test files (sum.ts and sum.test.ts)', async () => {
      await testingModule.install(makeCtx())

      // Check that writeFile is called for tests/sum.ts
      const sumWrite = mockWriteFile.mock.calls.find(
        (c: unknown[]) => normalizePath(c[0] as string).includes('tests/sum.ts') && !(c[0] as string).includes('.test.'),
      )
      expect(sumWrite).toBeTruthy()
      const sumContent = sumWrite![1] as string
      expect(sumContent).toContain('export function sum(a: number, b: number): number')

      // Check that writeFile is called for tests/sum.test.ts
      const testWrite = mockWriteFile.mock.calls.find(
        (c: unknown[]) => normalizePath(c[0] as string).includes('tests/sum.test.ts'),
      )
      expect(testWrite).toBeTruthy()
      const testContent = testWrite![1] as string
      expect(testContent).toContain('import { describe, expect, it } from \'vitest\'')
      expect(testContent).toContain('import { sum } from \'./sum\'')
      expect(testContent).toContain('adds two positive numbers')
      expect(testContent).toContain('handles zero')
      expect(testContent).toContain('handles negative numbers')
    })

    it('returns success with correct structure', async () => {
      const result = await testingModule.install(makeCtx())

      expect(result.success).toBe(true)
      expect(result.packagesAdded).toEqual(
        expect.arrayContaining([expect.stringContaining('vitest@')]),
      )
      expect(result.filesModified.map(normalizePath)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('vitest.config.ts'),
          expect.stringContaining('tests/sum.ts'),
          expect.stringContaining('tests/sum.test.ts'),
        ]),
      )
      expect(result.warnings).toHaveLength(0)
    })
  })
})
