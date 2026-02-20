import type { ProjectContext } from '../../../src/enhancements/types.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { eslintModule } from '../../../src/enhancements/modules/eslint.js'

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
    rootDir: '/tmp/test-project',
    packageManager: 'npm',
    framework: null,
    packageJson: { type: 'module' },
    installedDeps: {},
    freshScaffold: false,
    verbose: false,
    ...overrides,
  }
}

describe('eslintModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no config files exist
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    // Default: fresh package.json
    mockReadFile.mockResolvedValue(JSON.stringify({ type: 'module', scripts: {} }))
  })

  describe('detect', () => {
    it('returns not installed when no config files exist', async () => {
      const ctx = makeCtx()
      const result = await eslintModule.detect(ctx)

      expect(result.installed).toBe(false)
      expect(result.configFiles).toEqual([])
    })

    it('returns installed when eslint.config.js exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === '/tmp/test-project/eslint.config.js')
          return undefined
        throw new Error('ENOENT')
      })

      const ctx = makeCtx()
      const result = await eslintModule.detect(ctx)

      expect(result.installed).toBe(true)
      expect(result.configFiles).toContain('/tmp/test-project/eslint.config.js')
    })

    it('returns installed when legacy .eslintrc.json exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === '/tmp/test-project/.eslintrc.json')
          return undefined
        throw new Error('ENOENT')
      })

      const ctx = makeCtx()
      const result = await eslintModule.detect(ctx)

      expect(result.installed).toBe(true)
    })

    it('returns installed when eslintConfig in package.json', async () => {
      const ctx = makeCtx({
        packageJson: { type: 'module', eslintConfig: {} },
      })
      const result = await eslintModule.detect(ctx)

      expect(result.installed).toBe(true)
    })
  })

  describe('install', () => {
    it('installs base packages for null framework', async () => {
      const ctx = makeCtx()
      await eslintModule.install(ctx)

      // Check execa was called with npm install --save-dev and base packages
      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining(['install', '--save-dev']),
        expect.objectContaining({ cwd: '/tmp/test-project' }),
      )

      const args = mockExeca.mock.calls[0][1] as string[]
      expect(args.some((a: string) => a.startsWith('eslint@'))).toBe(true)
      expect(args.some((a: string) => a.startsWith('@eslint/js@'))).toBe(true)
      expect(args.some((a: string) => a.startsWith('globals@'))).toBe(true)

      // Should write eslint.config.js (type: module)
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/tmp/test-project/eslint.config.js',
        expect.any(String),
        'utf-8',
      )

      // Should add lint script
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/tmp/test-project/package.json',
        expect.stringContaining('"lint"'),
        'utf-8',
      )
    })

    it('installs React plugin for Next.js framework', async () => {
      const ctx = makeCtx({
        framework: 'next',
        installedDeps: { typescript: '^5.0.0' },
      })
      await eslintModule.install(ctx)

      const args = mockExeca.mock.calls[0][1] as string[]
      expect(args.some((a: string) => a.startsWith('eslint-plugin-react@'))).toBe(true)
      expect(args.some((a: string) => a.startsWith('typescript-eslint@'))).toBe(true)

      // Check config content includes react import and settings
      const configCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('eslint.config.js'),
      )
      const content = configCall![1] as string
      expect(content).toContain('import react from \'eslint-plugin-react\'')
      expect(content).toContain('react: { version: \'detect\' }')
    })

    it('installs Vue plugin for Nuxt framework with TypeScript', async () => {
      const ctx = makeCtx({
        framework: 'nuxt',
        installedDeps: { typescript: '^5.0.0' },
      })
      await eslintModule.install(ctx)

      const args = mockExeca.mock.calls[0][1] as string[]
      expect(args.some((a: string) => a.startsWith('eslint-plugin-vue@'))).toBe(true)
      expect(args.some((a: string) => a.startsWith('typescript-eslint@'))).toBe(true)

      // Check Vue SFC parser config
      const configCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('eslint.config.js'),
      )
      const content = configCall![1] as string
      expect(content).toContain('import pluginVue from \'eslint-plugin-vue\'')
      expect(content).toContain('tseslint.parser')
    })

    it('uses .mjs extension when no type:module', async () => {
      const ctx = makeCtx({
        packageJson: {},
      })
      await eslintModule.install(ctx)

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/tmp/test-project/eslint.config.mjs',
        expect.any(String),
        'utf-8',
      )
    })

    it('installs Svelte plugin for svelte framework', async () => {
      const ctx = makeCtx({ framework: 'svelte' })
      await eslintModule.install(ctx)

      const args = mockExeca.mock.calls[0][1] as string[]
      expect(args.some((a: string) => a.startsWith('eslint-plugin-svelte@'))).toBe(true)
    })

    it('installs Astro plugin for astro framework', async () => {
      const ctx = makeCtx({ framework: 'astro' })
      await eslintModule.install(ctx)

      const args = mockExeca.mock.calls[0][1] as string[]
      expect(args.some((a: string) => a.startsWith('eslint-plugin-astro@'))).toBe(true)
    })
  })
})
