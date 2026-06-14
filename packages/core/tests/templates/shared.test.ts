/**
 * Tests for shared template utilities.
 *
 * Verifies:
 * - writeProjectFile creates files with correct content
 * - writeProjectFile creates intermediate directories
 * - writeProjectFile returns the absolute path
 * - runInstall calls execa with correct PM and args
 * - printTemplateSummary outputs project name, path, and PM
 * - printTemplateSummary uses 'npm run' for npm, bare PM for others
 */

import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConfigValidationError, TargetDirectoryExistsError } from '../../src/errors/base.js'
import { assertTargetDirAvailable, assertValidTemplateInput, printTemplateSummary, runInstall, writeProjectFile } from '../../src/templates/shared.js'

const PROJECT_ROOT = join('/', 'tmp', 'project')
const projectPath = (relativePath: string) => join(PROJECT_ROOT, ...relativePath.split('/'))

const enoent = (): NodeJS.ErrnoException => Object.assign(new Error('ENOENT'), { code: 'ENOENT' })

// Hoist mocks for vi.mock factories
const mockMkdir = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockWriteFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockReaddir = vi.hoisted(() => vi.fn())
const mockExeca = vi.hoisted(() => vi.fn().mockResolvedValue({ stdout: '', stderr: '' }))

vi.mock('node:fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  readdir: mockReaddir,
}))

vi.mock('execa', () => ({
  execa: mockExeca,
}))

vi.mock('picocolors', () => ({
  default: {
    green: (s: string) => s,
    bold: (s: string) => s,
    dim: (s: string) => s,
  },
}))

describe('shared template utilities', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('writeProjectFile', () => {
    it('writes content to the correct path', async () => {
      await writeProjectFile(PROJECT_ROOT, 'src/index.ts', 'export {}')

      expect(mockWriteFile).toHaveBeenCalledWith(
        projectPath('src/index.ts'),
        'export {}',
        'utf-8',
      )
    })

    it('creates intermediate directories with recursive: true', async () => {
      await writeProjectFile(PROJECT_ROOT, 'src/lib/utils.ts', 'export {}')

      expect(mockMkdir).toHaveBeenCalledWith(
        projectPath('src/lib'),
        { recursive: true },
      )
    })

    it('returns the absolute path of the written file', async () => {
      const result = await writeProjectFile(PROJECT_ROOT, 'package.json', '{}')

      expect(result).toBe(projectPath('package.json'))
    })

    it('handles nested filenames correctly', async () => {
      await writeProjectFile(PROJECT_ROOT, 'src/deep/nested/file.ts', 'code')

      expect(mockMkdir).toHaveBeenCalledWith(
        projectPath('src/deep/nested'),
        { recursive: true },
      )
    })
  })

  describe('runInstall', () => {
    it('calls execa with the package manager and install arg', async () => {
      await runInstall(PROJECT_ROOT, 'npm')

      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        ['install'],
        expect.objectContaining({ cwd: PROJECT_ROOT, stdio: 'inherit' }),
      )
    })

    it('uses the correct cwd', async () => {
      await runInstall('/custom/path', 'bun')

      expect(mockExeca).toHaveBeenCalledWith(
        'bun',
        ['install'],
        expect.objectContaining({ cwd: '/custom/path' }),
      )
    })

    it('uses stdio inherit', async () => {
      await runInstall(PROJECT_ROOT, 'pnpm')

      expect(mockExeca).toHaveBeenCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({ stdio: 'inherit' }),
      )
    })
  })

  describe('printTemplateSummary', () => {
    it('outputs the template type', () => {
      printTemplateSummary('my-lib', './my-lib', 'npm', 'Library')

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
      expect(output).toContain('Library')
      expect(output).toContain('project created!')
    })

    it('outputs the project name', () => {
      printTemplateSummary('my-project', './my-project', 'bun', 'CLI')

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
      expect(output).toContain('my-project')
    })

    it('outputs the package manager name', () => {
      printTemplateSummary('my-app', './my-app', 'pnpm', 'MCP Server')

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
      expect(output).toContain('pnpm')
    })

    it('shows npm run for npm package manager', () => {
      printTemplateSummary('my-lib', './my-lib', 'npm', 'Library')

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
      expect(output).toContain('npm run')
    })

    it('shows bare PM name for non-npm package managers', () => {
      printTemplateSummary('my-lib', './my-lib', 'bun', 'Library')

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
      expect(output).toContain('bun build')
      expect(output).not.toContain('bun run')
    })

    it('shows cd command with project name', () => {
      printTemplateSummary('cool-project', './cool-project', 'npm', 'Library')

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
      expect(output).toContain('cd cool-project')
    })
  })

  describe('assertValidTemplateInput', () => {
    it('accepts a valid name and package manager', () => {
      expect(() => assertValidTemplateInput('my-tool', 'pnpm')).not.toThrow()
    })

    it('rejects path-traversal and otherwise invalid project names', () => {
      for (const bad of ['../foo', '/tmp/x', 'Bad Name', '@scope/x', '.hidden']) {
        expect(() => assertValidTemplateInput(bad, 'npm')).toThrow(ConfigValidationError)
      }
    })

    it('rejects an unknown package manager', () => {
      expect(() => assertValidTemplateInput('my-tool', 'bogus')).toThrow(ConfigValidationError)
      try {
        assertValidTemplateInput('my-tool', 'bogus')
      }
      catch (err) {
        expect((err as ConfigValidationError).code).toBe('CONFIG_VALIDATION')
      }
    })
  })

  describe('assertTargetDirAvailable', () => {
    it('resolves when the directory does not exist (ENOENT)', async () => {
      mockReaddir.mockRejectedValueOnce(enoent())
      await expect(assertTargetDirAvailable('new-app')).resolves.toBeUndefined()
    })

    it('resolves when the directory exists but is empty', async () => {
      mockReaddir.mockResolvedValueOnce([])
      await expect(assertTargetDirAvailable('empty-app')).resolves.toBeUndefined()
    })

    it('throws TargetDirectoryExistsError when the directory is non-empty', async () => {
      mockReaddir.mockResolvedValueOnce(['package.json'])
      const promise = assertTargetDirAvailable('existing-app')
      await expect(promise).rejects.toBeInstanceOf(TargetDirectoryExistsError)
      await expect(promise).rejects.toMatchObject({ code: 'TARGET_DIRECTORY_EXISTS' })
    })

    it('rethrows unexpected filesystem errors', async () => {
      mockReaddir.mockRejectedValueOnce(Object.assign(new Error('EACCES'), { code: 'EACCES' }))
      await expect(assertTargetDirAvailable('locked-app')).rejects.toThrow('EACCES')
    })
  })
})
