import type { ProjectContext } from '../../../src/enhancements/types.js'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renovateModule } from '../../../src/enhancements/modules/renovate.js'

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

describe('renovateModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAccess.mockRejectedValue(new Error('ENOENT'))
  })

  describe('detect', () => {
    it('returns false when no renovate config exists', async () => {
      const result = await renovateModule.detect(makeCtx())
      expect(result.installed).toBe(false)
      expect(result.configFiles).toEqual([])
    })

    it('returns true when renovate.json exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('renovate.json'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await renovateModule.detect(makeCtx())
      expect(result.installed).toBe(true)
      expect(result.configFiles).toContain(projectPath('renovate.json'))
    })

    it('returns true when .renovaterc exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.renovaterc'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await renovateModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns true when .github/renovate.json exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.github/renovate.json'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await renovateModule.detect(makeCtx())
      expect(result.installed).toBe(true)
    })

    it('returns true when package.json has renovate key', async () => {
      const result = await renovateModule.detect(
        makeCtx({ packageJson: { type: 'module', renovate: {} } }),
      )
      expect(result.installed).toBe(true)
      expect(result.configFiles).toContain(projectPath('package.json'))
    })
  })

  describe('install', () => {
    it('writes renovate.json with config:recommended', async () => {
      const result = await renovateModule.install(makeCtx())

      const writeCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('renovate.json'),
      )
      expect(writeCall).toBeTruthy()
      const content = JSON.parse((writeCall![1] as string).trim())
      expect(content.$schema).toBe('https://docs.renovatebot.com/renovate-schema.json')
      expect(content.extends).toEqual(['config:recommended'])
      expect(result.success).toBe(true)
    })

    it('returns empty packagesAdded array', async () => {
      const result = await renovateModule.install(makeCtx())
      expect(result.packagesAdded).toEqual([])
    })
  })
})
