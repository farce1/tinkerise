import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ProjectContext } from '../../../src/enhancements/types.js'

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

const mockExeca = vi.hoisted(() => vi.fn().mockResolvedValue({ stdout: '', stderr: '' }))

vi.mock('execa', () => ({
  execa: mockExeca,
}))

import { envModule } from '../../../src/enhancements/modules/env.js'

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

describe('envModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    mockReadFile.mockRejectedValue(new Error('ENOENT'))
  })

  describe('detect', () => {
    it('returns not installed when no env files exist', async () => {
      const result = await envModule.detect(makeCtx())
      expect(result.installed).toBe(false)
      expect(result.configFiles).toEqual([])
    })

    it('returns installed when .env.example exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === '/tmp/test-project/.env.example') return undefined
        throw new Error('ENOENT')
      })

      const result = await envModule.detect(makeCtx())
      expect(result.installed).toBe(true)
      expect(result.configFiles).toContain('/tmp/test-project/.env.example')
    })

    it('returns installed when .env exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === '/tmp/test-project/.env') return undefined
        throw new Error('ENOENT')
      })

      const result = await envModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns installed when src/env.ts exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === '/tmp/test-project/src/env.ts') return undefined
        throw new Error('ENOENT')
      })

      const result = await envModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })
  })

  describe('install', () => {
    it('installs @t3-oss/env-core and zod packages', async () => {
      const result = await envModule.install(makeCtx())

      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining([
          'install',
          '--save-dev',
          expect.stringContaining('@t3-oss/env-core'),
          expect.stringContaining('zod'),
        ]),
        expect.objectContaining({ cwd: '/tmp/test-project' }),
      )
      expect(result.packagesAdded).toHaveLength(2)
      expect(result.packagesAdded[0]).toContain('@t3-oss/env-core')
      expect(result.packagesAdded[1]).toContain('zod')
    })

    it('creates env.ts with createEnv pattern', async () => {
      await envModule.install(makeCtx())

      const envTsCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('env.ts'),
      )
      expect(envTsCall).toBeTruthy()
      const content = envTsCall![1] as string

      expect(content).toContain('createEnv')
      expect(content).toContain('@t3-oss/env-core')
      expect(content).toContain('z.string().url().optional()')
      expect(content).toContain('NODE_ENV')
      expect(content).toContain('runtimeEnv: process.env')
      expect(content).toContain('emptyStringAsUndefined: true')
    })

    it('creates .env and .env.example', async () => {
      await envModule.install(makeCtx())

      const envCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('.env') && !(c[0] as string).endsWith('.env.example'),
      )
      const envExampleCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('.env.example'),
      )

      expect(envCall).toBeTruthy()
      expect(envExampleCall).toBeTruthy()

      const envContent = envCall![1] as string
      const exampleContent = envExampleCall![1] as string

      expect(envContent).toContain('DATABASE_URL=')
      expect(envContent).toContain('NODE_ENV=development')
      expect(exampleContent).toContain('DATABASE_URL=')
      expect(exampleContent).toContain('NODE_ENV=development')
    })

    it('adds .env to .gitignore', async () => {
      // .gitignore doesn't exist
      mockReadFile.mockRejectedValue(new Error('ENOENT'))

      await envModule.install(makeCtx())

      const gitignoreCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('.gitignore'),
      )
      expect(gitignoreCall).toBeTruthy()
      const content = gitignoreCall![1] as string
      expect(content).toContain('.env')
    })

    it('does not duplicate .env in .gitignore if already present', async () => {
      mockReadFile.mockImplementation(async (path: string) => {
        if ((path as string).endsWith('.gitignore')) {
          return 'node_modules\n.env\ndist\n'
        }
        throw new Error('ENOENT')
      })

      const result = await envModule.install(makeCtx())

      // .gitignore should NOT be in filesModified since it wasn't changed
      const gitignoreInFiles = result.filesModified.some(f => f.endsWith('.gitignore'))
      expect(gitignoreInFiles).toBe(false)
    })

    it('appends .env to .gitignore with newline handling', async () => {
      mockReadFile.mockImplementation(async (path: string) => {
        if ((path as string).endsWith('.gitignore')) {
          return 'node_modules\ndist' // No trailing newline
        }
        throw new Error('ENOENT')
      })

      await envModule.install(makeCtx())

      const gitignoreCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('.gitignore'),
      )
      expect(gitignoreCall).toBeTruthy()
      const content = gitignoreCall![1] as string
      // Should have newline before .env since original doesn't end with one
      expect(content).toBe('node_modules\ndist\n.env\n')
    })

    it('places env.ts in src/ when src/ directory exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === '/tmp/test-project/src') return undefined
        throw new Error('ENOENT')
      })

      await envModule.install(makeCtx())

      const envTsCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('env.ts'),
      )
      expect(envTsCall).toBeTruthy()
      expect(envTsCall![0]).toContain('src/env.ts')
    })

    it('places env.ts at root when no src/ directory', async () => {
      // All access calls fail (no src/ directory)
      mockAccess.mockRejectedValue(new Error('ENOENT'))

      await envModule.install(makeCtx())

      const envTsCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('env.ts'),
      )
      expect(envTsCall).toBeTruthy()
      expect(envTsCall![0]).not.toContain('src/')
    })

    it('returns success with all modified files', async () => {
      const result = await envModule.install(makeCtx())

      expect(result.success).toBe(true)
      expect(result.filesModified.length).toBeGreaterThanOrEqual(3) // env.ts, .env.example, .env, maybe .gitignore
    })
  })
})
