import type { ProjectContext } from '../../../src/enhancements/types.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { editorconfigModule } from '../../../src/enhancements/modules/editorconfig.js'

const mockAccess = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockMkdir = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('node:fs/promises', () => ({
  access: mockAccess,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}))

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

describe('editorconfigModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAccess.mockRejectedValue(new Error('ENOENT'))
  })

  describe('detect', () => {
    it('returns false when no .editorconfig exists', async () => {
      const result = await editorconfigModule.detect(makeCtx())
      expect(result.installed).toBe(false)
      expect(result.configFiles).toEqual([])
    })

    it('returns true when .editorconfig exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === '/tmp/test-project/.editorconfig')
          return undefined
        throw new Error('ENOENT')
      })

      const result = await editorconfigModule.detect(makeCtx())
      expect(result.installed).toBe(true)
      expect(result.configFiles).toContain('/tmp/test-project/.editorconfig')
    })
  })

  describe('install', () => {
    it('writes .editorconfig with expected content', async () => {
      await editorconfigModule.install(makeCtx())

      const writeCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('.editorconfig'),
      )
      expect(writeCall).toBeTruthy()
      const content = writeCall![1] as string
      expect(content).toContain('root = true')
    })

    it('includes indent_size 2 and indent_style space', async () => {
      await editorconfigModule.install(makeCtx())

      const writeCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('.editorconfig'),
      )
      const content = writeCall![1] as string
      expect(content).toContain('indent_size = 2')
      expect(content).toContain('indent_style = space')
    })

    it('includes Makefile tab exception', async () => {
      await editorconfigModule.install(makeCtx())

      const writeCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('.editorconfig'),
      )
      const content = writeCall![1] as string
      expect(content).toContain('[Makefile]')
      expect(content).toContain('indent_style = tab')
    })

    it('includes markdown trim exception', async () => {
      await editorconfigModule.install(makeCtx())

      const writeCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('.editorconfig'),
      )
      const content = writeCall![1] as string
      expect(content).toContain('[*.md]')
      expect(content).toContain('trim_trailing_whitespace = false')
    })

    it('returns empty packagesAdded array', async () => {
      const result = await editorconfigModule.install(makeCtx())
      expect(result.packagesAdded).toEqual([])
    })
  })
})
