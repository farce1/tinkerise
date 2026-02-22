import type { ProjectContext } from '../../../src/enhancements/types.js'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prettierModule } from '../../../src/enhancements/modules/prettier.js'

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

describe('prettierModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    mockReadFile.mockResolvedValue(JSON.stringify({ type: 'module', scripts: {} }))
  })

  describe('detect', () => {
    it('returns not installed when no config/dep', async () => {
      const result = await prettierModule.detect(makeCtx())
      expect(result.installed).toBe(false)
    })

    it('returns installed when .prettierrc exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.prettierrc'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await prettierModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns installed when prettier in deps', async () => {
      const result = await prettierModule.detect(
        makeCtx({ installedDeps: { prettier: '^3.0.0' } }),
      )
      expect(result.installed).toBe(true)
    })

    it('returns partial when dep but no config', async () => {
      const result = await prettierModule.detect(
        makeCtx({ installedDeps: { prettier: '^3.0.0' } }),
      )
      expect(result.partial).toBe(true)
    })
  })

  describe('install', () => {
    it('does not create config file when no Tailwind', async () => {
      await prettierModule.install(makeCtx())

      // writeFile should be called for package.json (addScript) but NOT for .prettierrc
      const prettierrcCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('.prettierrc'),
      )
      expect(prettierrcCalls).toHaveLength(0)

      // Verify prettier is installed
      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining(['install', '--save-dev']),
        expect.any(Object),
      )
      const args = mockExeca.mock.calls[0][1] as string[]
      expect(args.some((a: string) => a.startsWith('prettier@'))).toBe(true)
    })

    it('creates .prettierrc with Tailwind plugin when tailwindcss in deps', async () => {
      const ctx = makeCtx({ installedDeps: { tailwindcss: '^4.0.0' } })
      await prettierModule.install(ctx)

      // Should write .prettierrc
      const prettierrcCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('.prettierrc'),
      )
      expect(prettierrcCalls).toHaveLength(1)

      const content = prettierrcCalls[0][1] as string
      const parsed = JSON.parse(content)
      expect(parsed.plugins).toEqual(['prettier-plugin-tailwindcss'])

      // Both prettier and plugin installed
      const args = mockExeca.mock.calls[0][1] as string[]
      expect(args.some((a: string) => a.startsWith('prettier-plugin-tailwindcss@'))).toBe(true)
    })

    it('adds format and format:check scripts', async () => {
      await prettierModule.install(makeCtx())

      // Check that writeFile was called for package.json with format scripts
      const pkgCalls = mockWriteFile.mock.calls.filter(
        (c: unknown[]) => (c[0] as string).endsWith('package.json'),
      )
      // addScript is called twice (format and format:check)
      expect(pkgCalls.length).toBeGreaterThanOrEqual(1)

      // First call should add "format"
      const firstContent = JSON.parse(pkgCalls[0][1] as string)
      expect(firstContent.scripts.format).toBe('prettier --write .')
    })
  })
})
