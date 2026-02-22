/**
 * Tests for MCP server template generator.
 *
 * Verifies:
 * - generateMcpServer creates project directory
 * - generateMcpServer writes package.json with correct name and MCP SDK dependency
 * - generateMcpServer writes src/index.ts with McpServer import
 * - generateMcpServer writes tsconfig.json and tsup.config.ts
 * - generateMcpServer runs install when noInstall is not set
 * - generateMcpServer skips install when noInstall is true
 * - generateMcpServer uses specified package manager for install
 * - Generated src/index.ts uses v1 SDK import paths
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { generateMcpServer } from '../../src/templates/mcp.js'

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

describe('generateMcpServer', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  /** Helper: get all writeFile calls as { filename, content } pairs */
  function getWrittenFiles(): Array<{ path: string, content: string }> {
    return mockWriteFile.mock.calls.map((call: [string, string, string]) => ({
      path: call[0],
      content: call[1],
    }))
  }

  /** Helper: find a written file by partial path match */
  function findFile(partialPath: string): { path: string, content: string } | undefined {
    const normalizedPartialPath = partialPath.replace(/\\/g, '/')
    return getWrittenFiles().find((f) => {
      const normalizedPath = f.path.replace(/\\/g, '/')
      return normalizedPath.includes(normalizedPartialPath)
    })
  }

  it('creates project directory', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    // mkdir called for project dir (first call is the top-level mkdir)
    expect(mockMkdir).toHaveBeenCalledWith('my-server', { recursive: true })
  })

  it('writes package.json with correct name and MCP SDK dependency', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    const file = findFile('package.json')
    expect(file).toBeDefined()

    const pkg = JSON.parse(file!.content)
    expect(pkg.name).toBe('my-server')
    expect(pkg.version).toBe('0.0.1')
    expect(pkg.type).toBe('module')
    expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBe('^1.26.0')
    expect(pkg.dependencies.zod).toBe('^3.24.0')
    expect(pkg.devDependencies.tsup).toBeDefined()
    expect(pkg.devDependencies.typescript).toBeDefined()
    expect(pkg.bin['my-server']).toBe('dist/index.js')
  })

  it('writes src/index.ts with McpServer import', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    const file = findFile('src/index.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('McpServer')
    expect(file!.content).toContain('StdioServerTransport')
    expect(file!.content).toContain('import { z } from "zod"')
    expect(file!.content).toContain('"my-server"')
  })

  it('writes tsconfig.json', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    const file = findFile('tsconfig.json')
    expect(file).toBeDefined()

    const tsconfig = JSON.parse(file!.content)
    expect(tsconfig.compilerOptions.target).toBe('ES2022')
    expect(tsconfig.compilerOptions.module).toBe('Node16')
    expect(tsconfig.compilerOptions.strict).toBe(true)
    expect(tsconfig.include).toEqual(['src'])
  })

  it('writes tsup.config.ts with ESM format', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    const file = findFile('tsup.config.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('defineConfig')
    expect(file!.content).toContain('"esm"')
  })

  it('writes README.md with project name', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    const file = findFile('README.md')
    expect(file).toBeDefined()
    expect(file!.content).toContain('# my-server')
    expect(file!.content).toContain('MCP Inspector')
  })

  it('runs install when noInstall is not set', async () => {
    await generateMcpServer('my-server', {})

    expect(mockExeca).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({ cwd: 'my-server' }),
    )
  })

  it('skips install when noInstall is true', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    expect(mockExeca).not.toHaveBeenCalled()
  })

  it('uses specified package manager for install', async () => {
    await generateMcpServer('my-server', { packageManager: 'pnpm' })

    expect(mockExeca).toHaveBeenCalledWith(
      'pnpm',
      ['install'],
      expect.objectContaining({ cwd: 'my-server' }),
    )
  })

  it('uses bun package manager when specified', async () => {
    await generateMcpServer('my-server', { packageManager: 'bun' })

    expect(mockExeca).toHaveBeenCalledWith(
      'bun',
      ['install'],
      expect.objectContaining({ cwd: 'my-server' }),
    )
  })

  it('generated src/index.ts uses v1 SDK import paths', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    const file = findFile('src/index.ts')
    expect(file).toBeDefined()
    // v1 import paths: @modelcontextprotocol/sdk/server/mcp.js
    expect(file!.content).toContain('@modelcontextprotocol/sdk/server/mcp.js')
    expect(file!.content).toContain('@modelcontextprotocol/sdk/server/stdio.js')
  })

  it('generated src/index.ts includes example tool with Zod schema', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    const file = findFile('src/index.ts')
    expect(file).toBeDefined()
    expect(file!.content).toContain('server.tool(')
    expect(file!.content).toContain('z.string()')
    expect(file!.content).toContain('"hello"')
  })

  it('defaults to npm when no package manager specified', async () => {
    await generateMcpServer('my-server', {})

    expect(mockExeca).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({ cwd: 'my-server' }),
    )
  })

  it('prints summary card after generation', async () => {
    await generateMcpServer('my-server', { noInstall: true })

    const output = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(output).toContain('MCP Server')
    expect(output).toContain('my-server')
  })
})
