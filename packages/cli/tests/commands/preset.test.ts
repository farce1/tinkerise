/**
 * Tests for the tinkerise preset command.
 *
 * Verifies:
 * - preset save <name> calls savePreset with correct data
 * - preset save without name shows error
 * - preset use <name> calls loadPreset and displays preset info
 * - preset use nonexistent shows error
 * - preset list calls both listPresets and discoverNpmPresets
 * - preset list shows "(none)" when no presets exist
 * - preset delete <name> calls deletePreset
 * - preset delete nonexistent shows "not found" error
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

// vi.hoisted mock fns
const {
  mockSavePreset,
  mockLoadPreset,
  mockListPresets,
  mockDeletePreset,
  mockDiscoverNpmPresets,
  mockLoadNpmPreset,
  mockLoadProjectConfig,
  mockGetPresetsDir,
} = vi.hoisted(() => ({
  mockSavePreset: vi.fn(),
  mockLoadPreset: vi.fn(),
  mockListPresets: vi.fn(),
  mockDeletePreset: vi.fn(),
  mockDiscoverNpmPresets: vi.fn(),
  mockLoadNpmPreset: vi.fn(),
  mockLoadProjectConfig: vi.fn(),
  mockGetPresetsDir: vi.fn().mockReturnValue('/home/user/.config/tinkerise/presets'),
}))

const {
  mockPLogInfo,
  mockPLogError,
  mockPLogSuccess,
  mockPText,
  mockPSelect,
  mockPCancel,
  mockPIsCancel,
} = vi.hoisted(() => ({
  mockPLogInfo: vi.fn(),
  mockPLogError: vi.fn(),
  mockPLogSuccess: vi.fn(),
  mockPText: vi.fn(),
  mockPSelect: vi.fn(),
  mockPCancel: vi.fn(),
  mockPIsCancel: vi.fn().mockReturnValue(false),
}))

const mockProcessExit = vi.hoisted(() => vi.fn())

vi.mock('@tinkerise/core', () => ({
  savePreset: mockSavePreset,
  loadPreset: mockLoadPreset,
  listPresets: mockListPresets,
  deletePreset: mockDeletePreset,
  discoverNpmPresets: mockDiscoverNpmPresets,
  loadNpmPreset: mockLoadNpmPreset,
  loadProjectConfig: mockLoadProjectConfig,
  getPresetsDir: mockGetPresetsDir,
}))

vi.mock('@clack/prompts', () => ({
  log: {
    info: mockPLogInfo,
    error: mockPLogError,
    success: mockPLogSuccess,
  },
  text: mockPText,
  select: mockPSelect,
  cancel: mockPCancel,
  isCancel: mockPIsCancel,
}))

vi.mock('picocolors', () => ({
  default: {
    red: (s: string) => s,
    bold: (s: string) => s,
  },
}))

// Stub process.exit to throw so we can catch it
vi.stubGlobal('process', {
  ...process,
  exit: mockProcessExit,
  cwd: () => '/test/project',
  env: process.env,
})

import { Command } from 'commander'
import { registerPresetCommand } from '../../src/commands/preset.js'

/**
 * Create a Commander program with the preset command registered and parse args.
 */
async function runPresetCommand(args: string[]): Promise<void> {
  const program = new Command()
  program.exitOverride()
  registerPresetCommand(program)
  await program.parseAsync(['node', 'tinkerise', ...args])
}

describe('preset save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProcessExit.mockImplementation(() => { throw new Error('process.exit') })
    mockSavePreset.mockResolvedValue(undefined)
    mockLoadProjectConfig.mockResolvedValue(null)
  })

  it('calls savePreset with correct name and data', async () => {
    await runPresetCommand([
      'preset', 'save', 'my-stack',
      '--framework', 'next',
      '--category', 'web',
      '--description', 'My stack preset',
    ])

    expect(mockSavePreset).toHaveBeenCalledWith({
      version: 1,
      name: 'my-stack',
      description: 'My stack preset',
      scaffold: {
        framework: 'next',
        category: 'web',
        flags: {},
      },
      enhancements: [],
      config: {},
    })
    expect(mockPLogSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Preset "my-stack" saved'),
    )
  })

  it('includes project config in preset when available', async () => {
    mockLoadProjectConfig.mockResolvedValue({ packageManager: 'pnpm', typescript: true })

    await runPresetCommand([
      'preset', 'save', 'my-stack',
      '--framework', 'vite',
      '--category', 'web',
    ])

    expect(mockSavePreset).toHaveBeenCalledWith(
      expect.objectContaining({
        config: { packageManager: 'pnpm', typescript: true },
      }),
    )
  })

  it('shows error when name argument is missing', async () => {
    await expect(async () => {
      await runPresetCommand(['preset', 'save'])
    }).rejects.toThrow()
  })
})

describe('preset use', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProcessExit.mockImplementation(() => { throw new Error('process.exit') })
  })

  it('calls loadPreset and displays preset info', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'my-stack',
      description: 'A great stack',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: ['eslint', 'prettier'],
      config: { packageManager: 'pnpm' },
    })

    await runPresetCommand(['preset', 'use', 'my-stack'])

    expect(mockLoadPreset).toHaveBeenCalledWith('my-stack')
    expect(mockPLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Applying preset "my-stack"'),
    )
    expect(mockPLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Framework: next'),
    )
    expect(mockPLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Enhancements: eslint, prettier'),
    )
    expect(mockPLogSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Preset "my-stack" applied'),
    )
  })

  it('shows error when preset not found', async () => {
    mockLoadPreset.mockResolvedValue(null)
    mockLoadNpmPreset.mockResolvedValue(null)
    mockListPresets.mockResolvedValue([])
    mockDiscoverNpmPresets.mockResolvedValue([])

    await expect(async () => {
      await runPresetCommand(['preset', 'use', 'nonexistent'])
    }).rejects.toThrow('process.exit')

    expect(mockPLogError).toHaveBeenCalledWith(
      expect.stringContaining('Preset "nonexistent" not found'),
    )
    expect(mockProcessExit).toHaveBeenCalledWith(1)
  })

  it('falls back to npm preset when local not found', async () => {
    mockLoadPreset.mockResolvedValue(null)
    mockLoadNpmPreset.mockResolvedValue({
      version: 1,
      name: 'saas',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: [],
      config: {},
    })

    await runPresetCommand(['preset', 'use', 'saas'])

    expect(mockLoadPreset).toHaveBeenCalledWith('saas')
    expect(mockLoadNpmPreset).toHaveBeenCalledWith('tinkerise-preset-saas')
    expect(mockPLogSuccess).toHaveBeenCalled()
  })
})

describe('preset list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls both listPresets and discoverNpmPresets', async () => {
    mockListPresets.mockResolvedValue(['my-stack'])
    mockDiscoverNpmPresets.mockResolvedValue(['tinkerise-preset-saas'])
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'my-stack',
      description: 'Local stack',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: [],
      config: {},
    })

    await runPresetCommand(['preset', 'list'])

    expect(mockListPresets).toHaveBeenCalled()
    expect(mockDiscoverNpmPresets).toHaveBeenCalledWith('/test/project')
    expect(mockPLogInfo).toHaveBeenCalledWith(expect.stringContaining('Local presets:'))
    expect(mockPLogInfo).toHaveBeenCalledWith(expect.stringContaining('npm presets:'))
    expect(mockPLogInfo).toHaveBeenCalledWith(expect.stringContaining('my-stack'))
    expect(mockPLogInfo).toHaveBeenCalledWith(expect.stringContaining('tinkerise-preset-saas'))
  })

  it('shows "(none)" when no presets exist', async () => {
    mockListPresets.mockResolvedValue([])
    mockDiscoverNpmPresets.mockResolvedValue([])

    await runPresetCommand(['preset', 'list'])

    // Should show (none) for both sections
    const noneCallCount = mockPLogInfo.mock.calls
      .filter((call: unknown[]) => String(call[0]).includes('(none)'))
      .length
    expect(noneCallCount).toBe(2)
  })
})

describe('preset delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProcessExit.mockImplementation(() => { throw new Error('process.exit') })
  })

  it('calls deletePreset and shows success', async () => {
    mockDeletePreset.mockResolvedValue(true)

    await runPresetCommand(['preset', 'delete', 'my-stack'])

    expect(mockDeletePreset).toHaveBeenCalledWith('my-stack')
    expect(mockPLogSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Preset "my-stack" deleted'),
    )
  })

  it('shows "not found" error for nonexistent preset', async () => {
    mockDeletePreset.mockResolvedValue(false)

    await runPresetCommand(['preset', 'delete', 'nonexistent'])

    expect(mockDeletePreset).toHaveBeenCalledWith('nonexistent')
    expect(mockPLogError).toHaveBeenCalledWith(
      expect.stringContaining('Preset "nonexistent" not found'),
    )
  })
})
