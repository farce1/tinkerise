/**
 * Tests for the tinkerise cli command.
 *
 * Verifies:
 * - registerCliToolCommand adds a 'cli' command to the program
 * - The command has the expected argument and options
 * - generateCliTool is called with correct args
 * - --no-install is properly inverted by Commander
 * - --package-manager is passed through
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Command } from 'commander'

// vi.hoisted mock fns
const { mockGenerateCliTool } = vi.hoisted(() => ({
  mockGenerateCliTool: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tinkerise/core', () => ({
  generateCliTool: mockGenerateCliTool,
}))

import { registerCliToolCommand } from '../../src/commands/cli-tool.js'

describe('registerCliToolCommand', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    program.exitOverride() // Prevent process.exit
    registerCliToolCommand(program)
  })

  it('adds a cli command to the program', () => {
    const cliCmd = program.commands.find(c => c.name() === 'cli')
    expect(cliCmd).toBeDefined()
  })

  it('cli command has a required name argument', () => {
    const cliCmd = program.commands.find(c => c.name() === 'cli')!
    const args = cliCmd.registeredArguments
    expect(args).toHaveLength(1)
    expect(args[0]!.name()).toBe('name')
    expect(args[0]!.required).toBe(true)
  })

  it('cli command has --package-manager option', () => {
    const cliCmd = program.commands.find(c => c.name() === 'cli')!
    const pmOpt = cliCmd.options.find(
      o => o.long === '--package-manager',
    )
    expect(pmOpt).toBeDefined()
  })

  it('cli command has --no-install option', () => {
    const cliCmd = program.commands.find(c => c.name() === 'cli')!
    const noInstallOpt = cliCmd.options.find(
      o => o.long === '--no-install',
    )
    expect(noInstallOpt).toBeDefined()
  })

  it('calls generateCliTool with name and defaults', async () => {
    await program.parseAsync(['node', 'test', 'cli', 'my-tool'])

    expect(mockGenerateCliTool).toHaveBeenCalledWith('my-tool', {
      packageManager: undefined,
      noInstall: false,
    })
  })

  it('passes --package-manager to generateCliTool', async () => {
    await program.parseAsync([
      'node', 'test', 'cli', 'my-tool',
      '--package-manager', 'pnpm',
    ])

    expect(mockGenerateCliTool).toHaveBeenCalledWith('my-tool', {
      packageManager: 'pnpm',
      noInstall: false,
    })
  })

  it('passes --no-install as noInstall: true', async () => {
    await program.parseAsync([
      'node', 'test', 'cli', 'my-tool',
      '--no-install',
    ])

    expect(mockGenerateCliTool).toHaveBeenCalledWith('my-tool', {
      packageManager: undefined,
      noInstall: true,
    })
  })

  it('errors when name argument is missing', async () => {
    await expect(
      program.parseAsync(['node', 'test', 'cli']),
    ).rejects.toThrow()
  })
})
