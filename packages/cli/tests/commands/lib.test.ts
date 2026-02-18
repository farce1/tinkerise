/**
 * Tests for the tinkerise lib command.
 *
 * Verifies:
 * - registerLibCommand adds a 'lib' command to the program
 * - The command has the expected argument and options
 * - generateLib is called with correct args
 * - --no-install is properly inverted by Commander
 * - --package-manager is passed through
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Command } from 'commander'

// vi.hoisted mock fns
const { mockGenerateLib } = vi.hoisted(() => ({
  mockGenerateLib: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tinkerise/core', () => ({
  generateLib: mockGenerateLib,
}))

import { registerLibCommand } from '../../src/commands/lib.js'

describe('registerLibCommand', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    program.exitOverride() // Prevent process.exit
    registerLibCommand(program)
  })

  it('adds a lib command to the program', () => {
    const libCmd = program.commands.find(c => c.name() === 'lib')
    expect(libCmd).toBeDefined()
  })

  it('lib command has a required name argument', () => {
    const libCmd = program.commands.find(c => c.name() === 'lib')!
    const args = libCmd.registeredArguments
    expect(args).toHaveLength(1)
    expect(args[0]!.name()).toBe('name')
    expect(args[0]!.required).toBe(true)
  })

  it('lib command has --package-manager option', () => {
    const libCmd = program.commands.find(c => c.name() === 'lib')!
    const pmOpt = libCmd.options.find(
      o => o.long === '--package-manager',
    )
    expect(pmOpt).toBeDefined()
  })

  it('lib command has --no-install option', () => {
    const libCmd = program.commands.find(c => c.name() === 'lib')!
    const noInstallOpt = libCmd.options.find(
      o => o.long === '--no-install',
    )
    expect(noInstallOpt).toBeDefined()
  })

  it('calls generateLib with name and defaults', async () => {
    await program.parseAsync(['node', 'test', 'lib', 'my-lib'])

    expect(mockGenerateLib).toHaveBeenCalledWith('my-lib', {
      packageManager: undefined,
      noInstall: false,
    })
  })

  it('passes --package-manager to generateLib', async () => {
    await program.parseAsync([
      'node', 'test', 'lib', 'my-lib',
      '--package-manager', 'yarn',
    ])

    expect(mockGenerateLib).toHaveBeenCalledWith('my-lib', {
      packageManager: 'yarn',
      noInstall: false,
    })
  })

  it('passes --no-install as noInstall: true', async () => {
    await program.parseAsync([
      'node', 'test', 'lib', 'my-lib',
      '--no-install',
    ])

    expect(mockGenerateLib).toHaveBeenCalledWith('my-lib', {
      packageManager: undefined,
      noInstall: true,
    })
  })

  it('errors when name argument is missing', async () => {
    await expect(
      program.parseAsync(['node', 'test', 'lib']),
    ).rejects.toThrow()
  })
})
