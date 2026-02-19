/**
 * Tests for the update command.
 *
 * Tests all 4 install-method branches: homebrew, npm-global, npx, unknown.
 * Mocks detectInstallMethod, execFileSync, and @clack/prompts logging.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Command } from 'commander'

// Hoist mocks
const mockDetectInstallMethod = vi.hoisted(() => vi.fn())
const mockExecFileSync = vi.hoisted(() => vi.fn())
const mockPLog = vi.hoisted(() => ({
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('../../src/utils/install-method.js', () => ({
  detectInstallMethod: mockDetectInstallMethod,
}))

vi.mock('node:child_process', () => ({
  execFileSync: mockExecFileSync,
}))

vi.mock('@clack/prompts', () => ({
  log: mockPLog,
}))

import { registerUpdateCommand } from '../../src/commands/update.js'

describe('registerUpdateCommand', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    program.exitOverride() // Prevent Commander from calling process.exit
    registerUpdateCommand(program)
  })

  async function runUpdate() {
    await program.parseAsync(['node', 'test', 'update'])
  }

  describe('homebrew branch', () => {
    beforeEach(() => {
      mockDetectInstallMethod.mockReturnValue('homebrew')
    })

    it('calls execFileSync with brew upgrade tinkerise', async () => {
      await runUpdate()

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'brew',
        ['upgrade', 'tinkerise'],
        { stdio: 'inherit' },
      )
    })

    it('logs info about Homebrew detection', async () => {
      await runUpdate()

      expect(mockPLog.info).toHaveBeenCalledWith(
        expect.stringContaining('Homebrew'),
      )
    })

    it('logs success after update', async () => {
      await runUpdate()

      expect(mockPLog.success).toHaveBeenCalledWith(
        expect.stringContaining('Homebrew'),
      )
    })
  })

  describe('npm-global branch', () => {
    beforeEach(() => {
      mockDetectInstallMethod.mockReturnValue('npm-global')
    })

    it('calls execFileSync with npm update -g tinkerise', async () => {
      await runUpdate()

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'npm',
        ['update', '-g', 'tinkerise'],
        { stdio: 'inherit' },
      )
    })

    it('logs info about npm global detection', async () => {
      await runUpdate()

      expect(mockPLog.info).toHaveBeenCalledWith(
        expect.stringContaining('npm'),
      )
    })

    it('logs success after update', async () => {
      await runUpdate()

      expect(mockPLog.success).toHaveBeenCalledWith(
        expect.stringContaining('npm'),
      )
    })
  })

  describe('npx branch', () => {
    beforeEach(() => {
      mockDetectInstallMethod.mockReturnValue('npx')
    })

    it('does NOT call execFileSync', async () => {
      await runUpdate()

      expect(mockExecFileSync).not.toHaveBeenCalled()
    })

    it('logs info about npx always fetching latest', async () => {
      await runUpdate()

      expect(mockPLog.info).toHaveBeenCalledWith(
        expect.stringContaining('npx'),
      )
    })

    it('mentions tinkerise@latest in output', async () => {
      await runUpdate()

      const allInfoCalls = mockPLog.info.mock.calls.map((c: unknown[]) => c[0]).join(' ')
      expect(allInfoCalls).toContain('tinkerise@latest')
    })
  })

  describe('unknown branch', () => {
    beforeEach(() => {
      mockDetectInstallMethod.mockReturnValue('unknown')
    })

    it('does NOT call execFileSync', async () => {
      await runUpdate()

      expect(mockExecFileSync).not.toHaveBeenCalled()
    })

    it('logs warning about detection failure', async () => {
      await runUpdate()

      expect(mockPLog.warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not detect'),
      )
    })

    it('logs manual update instructions mentioning npm', async () => {
      await runUpdate()

      const allInfoCalls = mockPLog.info.mock.calls.map((c: unknown[]) => c[0]).join(' ')
      expect(allInfoCalls).toContain('npm')
    })

    it('logs manual update instructions mentioning Homebrew', async () => {
      await runUpdate()

      const allInfoCalls = mockPLog.info.mock.calls.map((c: unknown[]) => c[0]).join(' ')
      expect(allInfoCalls).toContain('Homebrew')
    })
  })

  describe('error handling', () => {
    it('propagates error when execFileSync throws during Homebrew update', async () => {
      mockDetectInstallMethod.mockReturnValue('homebrew')
      mockExecFileSync.mockImplementation(() => {
        throw new Error('brew not found')
      })

      await expect(runUpdate()).rejects.toThrow('brew not found')
    })

    it('propagates error when execFileSync throws during npm update', async () => {
      mockDetectInstallMethod.mockReturnValue('npm-global')
      mockExecFileSync.mockImplementation(() => {
        throw new Error('npm failed')
      })

      await expect(runUpdate()).rejects.toThrow('npm failed')
    })
  })
})
