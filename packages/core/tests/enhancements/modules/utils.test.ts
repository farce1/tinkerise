/**
 * Tests for enhancement module shared utilities (_utils.ts).
 *
 * Verifies:
 * - installPackages calls correct PM command with dev dependency flags
 * - installPackages returns empty array for empty input
 * - writeConfigFile writes to correct path with correct content
 * - writeConfigFile creates intermediate directories
 * - addScript adds new script to package.json
 * - addScript returns false when script already exists
 * - readPackageJson returns parsed JSON from disk
 */

import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addScript, installPackages, readPackageJson, writeConfigFile } from '../../../src/enhancements/modules/_utils.js'

const PROJECT_ROOT = join('/', 'tmp', 'project')
const projectPath = (relativePath: string) => join(PROJECT_ROOT, ...relativePath.split('/'))

// Hoist mocks for vi.mock factories
const mockExeca = vi.hoisted(() => vi.fn().mockResolvedValue({ stdout: '', stderr: '' }))
const mockReadFile = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockMkdir = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('execa', () => ({
  execa: mockExeca,
}))

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}))

describe('enhancement _utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadFile.mockResolvedValue(JSON.stringify({ name: 'test', scripts: {} }))
  })

  describe('installPackages', () => {
    it('returns empty array for empty package list', async () => {
      const result = await installPackages([], {
        cwd: PROJECT_ROOT,
        packageManager: 'npm',
      })

      expect(result).toEqual([])
      expect(mockExeca).not.toHaveBeenCalled()
    })

    it('calls npm with install --save-dev for npm', async () => {
      await installPackages(['pkg-a@1.0.0', 'pkg-b@2.0.0'], {
        cwd: PROJECT_ROOT,
        packageManager: 'npm',
      })

      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        ['install', '--save-dev', 'pkg-a@1.0.0', 'pkg-b@2.0.0'],
        expect.objectContaining({ cwd: PROJECT_ROOT }),
      )
    })

    it('calls bun with add --dev for bun', async () => {
      await installPackages(['pkg-a'], {
        cwd: PROJECT_ROOT,
        packageManager: 'bun',
      })

      expect(mockExeca).toHaveBeenCalledWith(
        'bun',
        ['add', '--dev', 'pkg-a'],
        expect.objectContaining({ cwd: PROJECT_ROOT }),
      )
    })

    it('calls pnpm with add --save-dev for pnpm', async () => {
      await installPackages(['pkg-a'], {
        cwd: PROJECT_ROOT,
        packageManager: 'pnpm',
      })

      expect(mockExeca).toHaveBeenCalledWith(
        'pnpm',
        ['add', '--save-dev', 'pkg-a'],
        expect.objectContaining({ cwd: PROJECT_ROOT }),
      )
    })

    it('calls yarn with add --dev for yarn', async () => {
      await installPackages(['pkg-a'], {
        cwd: PROJECT_ROOT,
        packageManager: 'yarn',
      })

      expect(mockExeca).toHaveBeenCalledWith(
        'yarn',
        ['add', '--dev', 'pkg-a'],
        expect.objectContaining({ cwd: PROJECT_ROOT }),
      )
    })

    it('uses inherit stdio when verbose is true', async () => {
      await installPackages(['pkg-a'], {
        cwd: PROJECT_ROOT,
        packageManager: 'npm',
        verbose: true,
      })

      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        expect.any(Array),
        expect.objectContaining({ stdio: 'inherit' }),
      )
    })

    it('uses pipe stdio when verbose is false', async () => {
      await installPackages(['pkg-a'], {
        cwd: PROJECT_ROOT,
        packageManager: 'npm',
        verbose: false,
      })

      expect(mockExeca).toHaveBeenCalledWith(
        'npm',
        expect.any(Array),
        expect.objectContaining({ stdio: 'pipe' }),
      )
    })

    it('returns the package list for chaining', async () => {
      const result = await installPackages(['pkg-a', 'pkg-b'], {
        cwd: PROJECT_ROOT,
        packageManager: 'npm',
      })

      expect(result).toEqual(['pkg-a', 'pkg-b'])
    })
  })

  describe('writeConfigFile', () => {
    it('writes content to the correct path', async () => {
      await writeConfigFile(PROJECT_ROOT, '.eslintrc.json', '{"rules":{}}')

      expect(mockWriteFile).toHaveBeenCalledWith(
        projectPath('.eslintrc.json'),
        '{"rules":{}}',
        'utf-8',
      )
    })

    it('creates intermediate directories', async () => {
      await writeConfigFile(PROJECT_ROOT, '.eslintrc.json', '{}')

      expect(mockMkdir).toHaveBeenCalledWith(
        PROJECT_ROOT,
        { recursive: true },
      )
    })

    it('returns the absolute path of the written file', async () => {
      const result = await writeConfigFile(PROJECT_ROOT, '.prettierrc', '{}')

      expect(result).toBe(projectPath('.prettierrc'))
    })
  })

  describe('addScript', () => {
    it('adds a new script to package.json', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: 'test', scripts: {} }))

      const result = await addScript(PROJECT_ROOT, 'lint', 'eslint .')

      expect(result).toBe(true)
      expect(mockWriteFile).toHaveBeenCalledWith(
        projectPath('package.json'),
        expect.stringContaining('"lint"'),
        'utf-8',
      )
    })

    it('returns false when script already exists', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        name: 'test',
        scripts: { lint: 'eslint .' },
      }))

      const result = await addScript(PROJECT_ROOT, 'lint', 'eslint --fix .')

      expect(result).toBe(false)
      expect(mockWriteFile).not.toHaveBeenCalled()
    })

    it('preserves existing scripts when adding a new one', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        name: 'test',
        scripts: { build: 'tsc' },
      }))

      await addScript(PROJECT_ROOT, 'lint', 'eslint .')

      const writtenContent = mockWriteFile.mock.calls[0][1] as string
      const parsed = JSON.parse(writtenContent)
      expect(parsed.scripts.build).toBe('tsc')
      expect(parsed.scripts.lint).toBe('eslint .')
    })

    it('creates scripts object when package.json has none', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ name: 'test' }))

      await addScript(PROJECT_ROOT, 'lint', 'eslint .')

      const writtenContent = mockWriteFile.mock.calls[0][1] as string
      const parsed = JSON.parse(writtenContent)
      expect(parsed.scripts.lint).toBe('eslint .')
    })
  })

  describe('readPackageJson', () => {
    it('returns parsed JSON from package.json', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        name: 'my-package',
        version: '1.0.0',
      }))

      const result = await readPackageJson(PROJECT_ROOT)

      expect(result.name).toBe('my-package')
      expect(result.version).toBe('1.0.0')
    })

    it('reads from the correct path', async () => {
      mockReadFile.mockResolvedValue('{}')

      await readPackageJson(PROJECT_ROOT)

      expect(mockReadFile).toHaveBeenCalledWith(
        projectPath('package.json'),
        'utf-8',
      )
    })
  })
})
