import type { ProjectContext } from '../../../src/enhancements/types.js'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ciModule } from '../../../src/enhancements/modules/ci.js'

const TEST_ROOT = join('/', 'tmp', 'test-project')
const projectPath = (relativePath: string) => join(TEST_ROOT, ...relativePath.split('/'))

const mockAccess = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockMkdir = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

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

describe('ciModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    // Default: package.json with all tools
    mockReadFile.mockResolvedValue(JSON.stringify({
      type: 'module',
      scripts: { lint: 'eslint .', typecheck: 'tsc --noEmit', test: 'vitest', build: 'tsup' },
      dependencies: {},
      devDependencies: { eslint: '^9.0.0', typescript: '^5.0.0', vitest: '^3.0.0' },
    }))
  })

  describe('detect', () => {
    it('returns not installed when no workflow files', async () => {
      const result = await ciModule.detect(makeCtx())
      expect(result.installed).toBe(false)
    })

    it('returns installed when ci.yml exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.github/workflows/ci.yml'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await ciModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns installed when test.yml exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.github/workflows/test.yml'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await ciModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })
  })

  describe('install', () => {
    it('generates npm workflow', async () => {
      const result = await ciModule.install(makeCtx())

      const yamlCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('ci.yml'),
      )
      expect(yamlCall).toBeTruthy()
      const yaml = yamlCall![1] as string

      expect(yaml).toContain('npm ci')
      expect(yaml).toContain('npm run lint')
      expect(yaml).toContain('npm run typecheck')
      expect(yaml).toContain('npm run test -- --run')
      expect(yaml).toContain('npm run build')
      expect(yaml).not.toContain('corepack')
      expect(yaml).not.toContain('pnpm/action-setup')
      expect(result.packagesAdded).toEqual([])
    })

    it('generates pnpm workflow', async () => {
      await ciModule.install(makeCtx({ packageManager: 'pnpm' }))

      const yamlCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('ci.yml'),
      )
      const yaml = yamlCall![1] as string

      expect(yaml).toContain('pnpm/action-setup@v4')
      expect(yaml).toContain('corepack enable')
      expect(yaml).toContain('pnpm install --frozen-lockfile')
      expect(yaml).toContain('pnpm run lint')
      expect(yaml).toContain('cache: \'pnpm\'')
    })

    it('generates yarn workflow', async () => {
      await ciModule.install(makeCtx({ packageManager: 'yarn' }))

      const yamlCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('ci.yml'),
      )
      const yaml = yamlCall![1] as string

      expect(yaml).toContain('corepack enable')
      expect(yaml).toContain('yarn install --frozen-lockfile')
      expect(yaml).toContain('cache: \'yarn\'')
    })

    it('generates bun workflow', async () => {
      await ciModule.install(makeCtx({ packageManager: 'bun' }))

      const yamlCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('ci.yml'),
      )
      const yaml = yamlCall![1] as string

      expect(yaml).toContain('oven-sh/setup-bun@v2')
      expect(yaml).toContain('bun install --frozen-lockfile')
      expect(yaml).toContain('bun run lint')
      expect(yaml).not.toContain('setup-node')
    })

    it('skips lint step when no eslint', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        type: 'module',
        scripts: { build: 'tsup' },
        dependencies: {},
        devDependencies: {},
      }))

      await ciModule.install(makeCtx())

      const yamlCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('ci.yml'),
      )
      const yaml = yamlCall![1] as string

      expect(yaml).not.toContain('run lint')
    })

    it('skips typecheck when no typescript', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        type: 'module',
        scripts: { build: 'tsup' },
        dependencies: {},
        devDependencies: {},
      }))

      await ciModule.install(makeCtx())

      const yamlCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('ci.yml'),
      )
      const yaml = yamlCall![1] as string

      expect(yaml).not.toContain('typecheck')
    })

    it('creates .github/workflows directory', async () => {
      await ciModule.install(makeCtx())

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('.github/workflows'),
        { recursive: true },
      )
    })
  })
})
