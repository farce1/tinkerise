/**
 * Tests for npm library template generator.
 *
 * Verifies:
 * - generateLib creates project directory
 * - generateLib writes package.json with dual exports (types/import/require)
 * - generateLib writes tsup.config.ts with format: ["esm", "cjs"]
 * - generateLib writes vitest.config.ts
 * - generateLib writes src/index.ts with example export
 * - generateLib runs install when noInstall is not set
 * - generateLib skips install when noInstall is true
 * - package.json types field comes first in exports
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

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

import { generateLib } from '../../src/templates/lib.js'

describe('generateLib', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  /** Helper: get all writeFile calls as { path, content } pairs */
  function getWrittenFiles(): Array<{ path: string; content: string }> {
    return mockWriteFile.mock.calls.map((call: [string, string, string]) => ({
      path: call[0],
      content: call[1],
    }))
  }

  /** Helper: find a written file by partial path match */
  function findFile(partialPath: string): { path: string; content: string } | undefined {
    return getWrittenFiles().find(f => f.path.includes(partialPath))
  }

  it('creates project directory', async () => {
    await generateLib('my-lib', { noInstall: true })

    expect(mockMkdir).toHaveBeenCalledWith('my-lib', { recursive: true })
  })

  it('writes package.json with dual exports (types/import/require)', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('package.json')
    expect(file).toBeDefined()

    const pkg = JSON.parse(file!.content)
    expect(pkg.name).toBe('my-lib')
    expect(pkg.version).toBe('0.0.1')
    expect(pkg.type).toBe('module')
    expect(pkg.exports['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
      require: './dist/index.cjs',
    })
    expect(pkg.main).toBe('./dist/index.cjs')
    expect(pkg.module).toBe('./dist/index.js')
    expect(pkg.types).toBe('./dist/index.d.ts')
    expect(pkg.files).toEqual(['dist'])
  })

  it('package.json types field comes first in exports', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('package.json')
    expect(file).toBeDefined()

    // Parse the raw JSON to check key order in exports["."]
    const content = file!.content
    const exportsMatch = content.match(/"\.": \{([^}]+)\}/)
    expect(exportsMatch).toBeDefined()
    const exportsContent = exportsMatch![1]!
    const typesIdx = exportsContent.indexOf('"types"')
    const importIdx = exportsContent.indexOf('"import"')
    const requireIdx = exportsContent.indexOf('"require"')
    expect(typesIdx).toBeLessThan(importIdx)
    expect(typesIdx).toBeLessThan(requireIdx)
  })

  it('writes tsup.config.ts with format: ["esm", "cjs"]', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('tsup.config.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('defineConfig')
    expect(file!.content).toContain('"esm"')
    expect(file!.content).toContain('"cjs"')
    expect(file!.content).toContain('sourcemap: true')
  })

  it('writes vitest.config.ts', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('vitest.config.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('defineConfig')
    expect(file!.content).toContain('vitest/config')
    expect(file!.content).toContain('test')
    expect(file!.content).toContain('include')
  })

  it('writes tsconfig.json with declarationMap and sourceMap', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('tsconfig.json')
    expect(file).toBeDefined()

    const tsconfig = JSON.parse(file!.content)
    expect(tsconfig.compilerOptions.target).toBe('ES2022')
    expect(tsconfig.compilerOptions.module).toBe('Node16')
    expect(tsconfig.compilerOptions.strict).toBe(true)
    expect(tsconfig.compilerOptions.declarationMap).toBe(true)
    expect(tsconfig.compilerOptions.sourceMap).toBe(true)
    expect(tsconfig.include).toEqual(['src'])
  })

  it('writes src/index.ts with example export', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('src/index.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('export function hello')
    expect(file!.content).toContain('Hello,')
    expect(file!.content).toContain('my-lib')
  })

  it('writes README.md with project name and publishing checklist', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('README.md')
    expect(file).toBeDefined()
    expect(file!.content).toContain('# my-lib')
    expect(file!.content).toContain('npm install my-lib')
    expect(file!.content).toContain('Publishing')
  })

  it('runs install when noInstall is not set', async () => {
    await generateLib('my-lib', {})

    expect(mockExeca).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({ cwd: 'my-lib' }),
    )
  })

  it('skips install when noInstall is true', async () => {
    await generateLib('my-lib', { noInstall: true })

    expect(mockExeca).not.toHaveBeenCalled()
  })

  it('uses specified package manager for install', async () => {
    await generateLib('my-lib', { packageManager: 'yarn' })

    expect(mockExeca).toHaveBeenCalledWith(
      'yarn',
      ['install'],
      expect.objectContaining({ cwd: 'my-lib' }),
    )
  })

  it('package.json has prepublishOnly script', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('package.json')
    expect(file).toBeDefined()

    const pkg = JSON.parse(file!.content)
    expect(pkg.scripts.prepublishOnly).toBe('npm run build')
  })

  it('package.json has vitest devDependency', async () => {
    await generateLib('my-lib', { noInstall: true })

    const file = findFile('package.json')
    expect(file).toBeDefined()

    const pkg = JSON.parse(file!.content)
    expect(pkg.devDependencies.vitest).toBe('^3.1.0')
  })

  it('defaults to npm when no package manager specified', async () => {
    await generateLib('my-lib', {})

    expect(mockExeca).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({ cwd: 'my-lib' }),
    )
  })

  it('prints summary card after generation', async () => {
    await generateLib('my-lib', { noInstall: true })

    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(output).toContain('npm Library')
    expect(output).toContain('my-lib')
  })
})
