/**
 * Tests for CLI tool template generator.
 *
 * Verifies:
 * - generateCliTool creates project directory
 * - generateCliTool writes package.json with commander dependency and bin entry
 * - generateCliTool writes src/index.ts with Commander program
 * - generateCliTool runs install when noInstall is not set
 * - generateCliTool skips install when noInstall is true
 * - Generated src/index.ts has example greet command
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateCliTool } from '../../src/templates/cli-tool.js'

// Hoist mocks for vi.mock factories
const mockMkdir = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockWriteFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockExeca = vi.hoisted(() => vi.fn().mockResolvedValue({ stdout: '', stderr: '' }))

vi.mock('node:fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
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

describe('generateCliTool', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  /** Helper: get all writeFile calls as { path, content } pairs */
  function getWrittenFiles(): Array<{ path: string, content: string }> {
    return mockWriteFile.mock.calls.map((call: [string, string, string]) => ({
      path: call[0],
      content: call[1],
    }))
  }

  /** Helper: find a written file by partial path match */
  function findFile(partialPath: string): { path: string, content: string } | undefined {
    return getWrittenFiles().find(f => f.path.includes(partialPath))
  }

  it('creates project directory', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    expect(mockMkdir).toHaveBeenCalledWith('my-tool', { recursive: true })
  })

  it('writes package.json with commander dependency and bin entry', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    const file = findFile('package.json')
    expect(file).toBeDefined()

    const pkg = JSON.parse(file!.content)
    expect(pkg.name).toBe('my-tool')
    expect(pkg.version).toBe('0.0.1')
    expect(pkg.type).toBe('module')
    expect(pkg.dependencies.commander).toBe('^13.0.0')
    expect(pkg.devDependencies.tsup).toBeDefined()
    expect(pkg.devDependencies.typescript).toBeDefined()
    expect(pkg.bin['my-tool']).toBe('dist/index.js')
  })

  it('writes src/index.ts with Commander program', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    const file = findFile('src/index.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('import { Command } from "commander"')
    expect(file!.content).toContain('.name("my-tool")')
    expect(file!.content).toContain('program.parse()')
  })

  it('writes tsconfig.json', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    const file = findFile('tsconfig.json')
    expect(file).toBeDefined()

    const tsconfig = JSON.parse(file!.content)
    expect(tsconfig.compilerOptions.target).toBe('ES2022')
    expect(tsconfig.compilerOptions.module).toBe('Node16')
    expect(tsconfig.compilerOptions.strict).toBe(true)
    expect(tsconfig.include).toEqual(['src'])
  })

  it('writes tsup.config.ts with ESM format', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    const file = findFile('tsup.config.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('defineConfig')
    expect(file!.content).toContain('"esm"')
  })

  it('writes README.md with project name', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    const file = findFile('README.md')
    expect(file).toBeDefined()
    expect(file!.content).toContain('# my-tool')
    expect(file!.content).toContain('Commander.js')
  })

  it('runs install when noInstall is not set', async () => {
    await generateCliTool('my-tool', {})

    expect(mockExeca).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({ cwd: 'my-tool' }),
    )
  })

  it('skips install when noInstall is true', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    expect(mockExeca).not.toHaveBeenCalled()
  })

  it('uses specified package manager for install', async () => {
    await generateCliTool('my-tool', { packageManager: 'pnpm' })

    expect(mockExeca).toHaveBeenCalledWith(
      'pnpm',
      ['install'],
      expect.objectContaining({ cwd: 'my-tool' }),
    )
  })

  it('generated src/index.ts has example greet command', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    const file = findFile('src/index.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('.command("greet")')
    expect(file!.content).toContain('.argument("<name>"')
    expect(file!.content).toContain('Hello,')
  })

  it('defaults to npm when no package manager specified', async () => {
    await generateCliTool('my-tool', {})

    expect(mockExeca).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({ cwd: 'my-tool' }),
    )
  })

  it('prints summary card after generation', async () => {
    await generateCliTool('my-tool', { noInstall: true })

    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(output).toContain('CLI Tool')
    expect(output).toContain('my-tool')
  })
})
