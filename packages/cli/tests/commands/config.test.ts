/**
 * Tests for the tinkerise config command.
 *
 * Verifies:
 * - config list loads and displays global config values
 * - config get returns correct value for valid keys
 * - config get rejects invalid keys
 * - config set calls setGlobalConfigValue correctly
 * - config set converts typescript string to boolean
 * - config set rejects invalid package manager values
 * - generateProjectConfig produces valid TS with defineConfig
 * - generateProjectConfig omits undefined keys
 */

import { Command } from 'commander'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateProjectConfig, registerConfigCommand } from '../../src/commands/config.js'

// vi.hoisted mock fns
const {
  mockLoadGlobalConfig,
  mockSaveGlobalConfig,
  mockSetGlobalConfigValue,
  mockGetGlobalConfigValue,
  mockGetConfigPath,
  mockLoadProjectConfig,
  mockConfigFilename,
} = vi.hoisted(() => ({
  mockLoadGlobalConfig: vi.fn(),
  mockSaveGlobalConfig: vi.fn(),
  mockSetGlobalConfigValue: vi.fn(),
  mockGetGlobalConfigValue: vi.fn(),
  mockGetConfigPath: vi.fn().mockReturnValue('/home/user/.config/tinkerise/config.json'),
  mockLoadProjectConfig: vi.fn(),
  mockConfigFilename: 'tinkerise.config.ts',
}))

const {
  mockPLogInfo,
  mockPLogError,
  mockPLogSuccess,
  mockPSelect,
  mockPConfirm,
  mockPCancel,
  mockPIsCancel,
} = vi.hoisted(() => ({
  mockPLogInfo: vi.fn(),
  mockPLogError: vi.fn(),
  mockPLogSuccess: vi.fn(),
  mockPSelect: vi.fn(),
  mockPConfirm: vi.fn(),
  mockPCancel: vi.fn(),
  mockPIsCancel: vi.fn().mockReturnValue(false),
}))

const mockProcessExit = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())

vi.mock('@tinkerise/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tinkerise/core')>()
  return {
    ...actual,
    loadGlobalConfig: mockLoadGlobalConfig,
    saveGlobalConfig: mockSaveGlobalConfig,
    setGlobalConfigValue: mockSetGlobalConfigValue,
    getGlobalConfigValue: mockGetGlobalConfigValue,
    getConfigPath: mockGetConfigPath,
    loadProjectConfig: mockLoadProjectConfig,
    CONFIG_FILENAME: mockConfigFilename,
  }
})

vi.mock('@clack/prompts', () => ({
  log: {
    info: mockPLogInfo,
    error: mockPLogError,
    success: mockPLogSuccess,
  },
  select: mockPSelect,
  confirm: mockPConfirm,
  cancel: mockPCancel,
  isCancel: mockPIsCancel,
}))

vi.mock('node:fs/promises', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile,
}))

// Stub process.exit to throw so we can catch it
vi.stubGlobal('process', {
  ...process,
  exit: mockProcessExit,
  cwd: () => '/test/project',
  env: process.env,
})

/**
 * Create a Commander program with the config command registered and parse args.
 */
async function runConfigCommand(args: string[]): Promise<void> {
  const program = new Command()
  program.exitOverride() // Throw on parse errors rather than calling process.exit
  registerConfigCommand(program)
  await program.parseAsync(['node', 'tinkerise', ...args])
}

describe('config list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls loadGlobalConfig and displays values', async () => {
    mockLoadGlobalConfig.mockResolvedValue({
      packageManager: 'pnpm',
      typescript: true,
      defaultCategory: 'web',
    })

    await runConfigCommand(['config', 'list'])

    expect(mockLoadGlobalConfig).toHaveBeenCalled()
    // Should display config path
    expect(mockPLogInfo).toHaveBeenCalledWith(expect.stringContaining('Global config:'))
    // Should display all 3 values
    expect(mockPLogInfo).toHaveBeenCalledWith('packageManager: pnpm')
    expect(mockPLogInfo).toHaveBeenCalledWith('typescript: true')
    expect(mockPLogInfo).toHaveBeenCalledWith('defaultCategory: web')
  })

  it('shows "(not set)" for missing keys', async () => {
    mockLoadGlobalConfig.mockResolvedValue({
      packageManager: 'npm',
    })

    await runConfigCommand(['config', 'list'])

    expect(mockPLogInfo).toHaveBeenCalledWith('packageManager: npm')
    expect(mockPLogInfo).toHaveBeenCalledWith('typescript: (not set)')
    expect(mockPLogInfo).toHaveBeenCalledWith('defaultCategory: (not set)')
  })

  it('shows message when no global config exists', async () => {
    mockLoadGlobalConfig.mockResolvedValue(null)

    await runConfigCommand(['config', 'list'])

    expect(mockPLogInfo).toHaveBeenCalledWith(expect.stringContaining('No global config found'))
  })
})

describe('config get', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct value for packageManager', async () => {
    mockGetGlobalConfigValue.mockResolvedValue('pnpm')

    await runConfigCommand(['config', 'get', 'packageManager'])

    expect(mockGetGlobalConfigValue).toHaveBeenCalledWith('packageManager')
    expect(mockPLogInfo).toHaveBeenCalledWith('pnpm')
  })

  it('returns "(not set)" when key has no value', async () => {
    mockGetGlobalConfigValue.mockResolvedValue(undefined)

    await runConfigCommand(['config', 'get', 'typescript'])

    expect(mockPLogInfo).toHaveBeenCalledWith('(not set)')
  })

  it('throws InvalidConfigKeyError for invalid key', async () => {
    await expect(
      runConfigCommand(['config', 'get', 'invalidKey']),
    ).rejects.toThrow('Unknown config key')
  })
})

describe('config set', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetGlobalConfigValue.mockResolvedValue(undefined)
  })

  it('calls setGlobalConfigValue for packageManager', async () => {
    await runConfigCommand(['config', 'set', 'packageManager', 'pnpm'])

    expect(mockSetGlobalConfigValue).toHaveBeenCalledWith('packageManager', 'pnpm')
    expect(mockPLogSuccess).toHaveBeenCalledWith(expect.stringContaining('Set packageManager = pnpm'))
  })

  it('converts typescript string "true" to boolean', async () => {
    await runConfigCommand(['config', 'set', 'typescript', 'true'])

    expect(mockSetGlobalConfigValue).toHaveBeenCalledWith('typescript', true)
  })

  it('converts typescript string "false" to boolean', async () => {
    await runConfigCommand(['config', 'set', 'typescript', 'false'])

    expect(mockSetGlobalConfigValue).toHaveBeenCalledWith('typescript', false)
  })

  it('throws ConfigValidationError for invalid package manager', async () => {
    await expect(
      runConfigCommand(['config', 'set', 'packageManager', 'invalid']),
    ).rejects.toThrow('Invalid value \'invalid\' for packageManager')
  })

  it('throws ConfigValidationError for invalid typescript value', async () => {
    await expect(
      runConfigCommand(['config', 'set', 'typescript', 'yes']),
    ).rejects.toThrow('Invalid value \'yes\' for typescript')
  })

  it('throws ConfigValidationError for invalid category', async () => {
    await expect(
      runConfigCommand(['config', 'set', 'defaultCategory', 'desktop']),
    ).rejects.toThrow('Invalid value \'desktop\' for defaultCategory')
  })

  it('writes project config file when --project is used', async () => {
    mockLoadProjectConfig.mockResolvedValue({ packageManager: 'npm' })
    mockWriteFile.mockResolvedValue(undefined)

    await runConfigCommand(['config', 'set', 'packageManager', 'pnpm', '--project'])

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('tinkerise.config.ts'),
      expect.stringContaining('packageManager: \'pnpm\''),
      'utf-8',
    )
    expect(mockPLogSuccess).toHaveBeenCalledWith(expect.stringContaining('Set packageManager = pnpm'))
  })
})

describe('generateProjectConfig', () => {
  it('produces valid TS with defineConfig', () => {
    const result = generateProjectConfig({
      packageManager: 'pnpm',
      typescript: true,
      defaultCategory: 'web',
    })

    expect(result).toContain('import { defineConfig } from \'@tinkerise/shared\'')
    expect(result).toContain('export default defineConfig({')
    expect(result).toContain('packageManager: \'pnpm\',')
    expect(result).toContain('typescript: true,')
    expect(result).toContain('defaultCategory: \'web\',')
    expect(result).toContain('})')
  })

  it('omits undefined keys', () => {
    const result = generateProjectConfig({
      packageManager: 'npm',
    })

    expect(result).toContain('packageManager: \'npm\',')
    expect(result).not.toContain('typescript')
    expect(result).not.toContain('defaultCategory')
  })

  it('produces minimal config when all keys are undefined', () => {
    const result = generateProjectConfig({})

    expect(result).toContain('import { defineConfig } from \'@tinkerise/shared\'')
    expect(result).toContain('export default defineConfig({')
    expect(result).toContain('})')
    // No key lines between { and }
    const lines = result.split('\n')
    const openIdx = lines.findIndex(l => l.includes('defineConfig({'))
    const closeIdx = lines.findIndex(l => l === '})')
    expect(closeIdx).toBe(openIdx + 1)
  })
})
