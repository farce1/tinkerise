/**
 * Tests for the tinkerise mcp command.
 *
 * Verifies:
 * - registerMcpCommand adds an 'mcp' command to the program
 * - The command has the expected argument and options
 * - generateMcpServer is called with correct args
 * - --no-install is properly inverted by Commander
 * - --package-manager is passed through
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Command } from 'commander'

// vi.hoisted mock fns
const { mockGenerateMcpServer } = vi.hoisted(() => ({
  mockGenerateMcpServer: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tinkerise/core', () => ({
  generateMcpServer: mockGenerateMcpServer,
}))

import { registerMcpCommand } from '../../src/commands/mcp.js'

describe('registerMcpCommand', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    program.exitOverride() // Prevent process.exit
    registerMcpCommand(program)
  })

  it('adds an mcp command to the program', () => {
    const mcpCmd = program.commands.find(c => c.name() === 'mcp')
    expect(mcpCmd).toBeDefined()
  })

  it('mcp command has a required name argument', () => {
    const mcpCmd = program.commands.find(c => c.name() === 'mcp')!
    // Commander stores args as registeredArguments
    const args = mcpCmd.registeredArguments
    expect(args).toHaveLength(1)
    expect(args[0]!.name()).toBe('name')
    expect(args[0]!.required).toBe(true)
  })

  it('mcp command has --package-manager option', () => {
    const mcpCmd = program.commands.find(c => c.name() === 'mcp')!
    const pmOpt = mcpCmd.options.find(
      o => o.long === '--package-manager',
    )
    expect(pmOpt).toBeDefined()
  })

  it('mcp command has --no-install option', () => {
    const mcpCmd = program.commands.find(c => c.name() === 'mcp')!
    const noInstallOpt = mcpCmd.options.find(
      o => o.long === '--no-install',
    )
    expect(noInstallOpt).toBeDefined()
  })

  it('calls generateMcpServer with name and defaults', async () => {
    await program.parseAsync(['node', 'test', 'mcp', 'my-server'])

    expect(mockGenerateMcpServer).toHaveBeenCalledWith('my-server', {
      packageManager: undefined,
      noInstall: false,
    })
  })

  it('passes --package-manager to generateMcpServer', async () => {
    await program.parseAsync([
      'node', 'test', 'mcp', 'my-server',
      '--package-manager', 'pnpm',
    ])

    expect(mockGenerateMcpServer).toHaveBeenCalledWith('my-server', {
      packageManager: 'pnpm',
      noInstall: false,
    })
  })

  it('passes --no-install as noInstall: true', async () => {
    await program.parseAsync([
      'node', 'test', 'mcp', 'my-server',
      '--no-install',
    ])

    expect(mockGenerateMcpServer).toHaveBeenCalledWith('my-server', {
      packageManager: undefined,
      noInstall: true,
    })
  })

  it('errors when name argument is missing', async () => {
    await expect(
      program.parseAsync(['node', 'test', 'mcp']),
    ).rejects.toThrow()
  })
})
