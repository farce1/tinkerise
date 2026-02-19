/**
 * Tests for the tinkerise preset command.
 *
 * Verifies:
 * - preset save <name> calls savePreset with correct data
 * - preset save detects and captures installed enhancements
 * - preset save with no enhancements detected produces empty array
 * - preset save without name shows error
 * - preset use <name> calls loadPreset and displays preset info
 * - preset use with enhancements calls runEnhancements
 * - preset use with unknown enhancement IDs warns and continues
 * - preset use with no enhancements skips enhancement pipeline
 * - preset use nonexistent shows error
 * - preset list calls both listPresets and discoverNpmPresets
 * - preset list shows "(none)" when no presets exist
 * - preset delete <name> calls deletePreset
 * - preset delete nonexistent shows "not found" error
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

// vi.hoisted mock fns for @tinkerise/core
const {
  mockSavePreset,
  mockLoadPreset,
  mockListPresets,
  mockDeletePreset,
  mockDiscoverNpmPresets,
  mockLoadNpmPreset,
  mockLoadProjectConfig,
  mockGetPresetsDir,
  mockBuildProjectContext,
  mockRunEnhancements,
  mockShowEnhancementSummary,
  mockShowPerEnhancementSummary,
  mockEnhancementRegistry,
  mockAllEnhancementModules,
  mockEnhancementNextSteps,
  mockIsCI,
} = vi.hoisted(() => {
  const eslintMod = {
    id: 'eslint',
    name: 'ESLint',
    description: 'Lint',
    dependsOn: [],
    detect: vi.fn().mockResolvedValue({ installed: false, configFiles: [], partial: false }),
    install: vi.fn().mockResolvedValue({ success: true, filesModified: [], packagesAdded: [], warnings: [] }),
  }
  const prettierMod = {
    id: 'prettier',
    name: 'Prettier',
    description: 'Format',
    dependsOn: [],
    detect: vi.fn().mockResolvedValue({ installed: false, configFiles: [], partial: false }),
    install: vi.fn().mockResolvedValue({ success: true, filesModified: [], packagesAdded: [], warnings: [] }),
  }

  const registry = new Map()
  registry.set('eslint', eslintMod)
  registry.set('prettier', prettierMod)

  return {
    mockSavePreset: vi.fn(),
    mockLoadPreset: vi.fn(),
    mockListPresets: vi.fn(),
    mockDeletePreset: vi.fn(),
    mockDiscoverNpmPresets: vi.fn(),
    mockLoadNpmPreset: vi.fn(),
    mockLoadProjectConfig: vi.fn(),
    mockGetPresetsDir: vi.fn().mockReturnValue('/home/user/.config/tinkerise/presets'),
    mockBuildProjectContext: vi.fn().mockResolvedValue({
      rootDir: '/test/project',
      packageManager: 'npm',
      framework: null,
      packageJson: {},
      installedDeps: {},
      freshScaffold: false,
      verbose: false,
    }),
    mockRunEnhancements: vi.fn().mockResolvedValue({
      installed: [],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map(),
    }),
    mockShowEnhancementSummary: vi.fn(),
    mockShowPerEnhancementSummary: vi.fn(),
    mockEnhancementRegistry: registry,
    mockAllEnhancementModules: [eslintMod, prettierMod],
    mockEnhancementNextSteps: { eslint: ['Run lint'], prettier: ['Run format'] },
    mockIsCI: { value: false },
  }
})

const {
  mockPLogInfo,
  mockPLogError,
  mockPLogSuccess,
  mockPLogWarn,
  mockPText,
  mockPSelect,
  mockPConfirm,
  mockPCancel,
  mockPIsCancel,
} = vi.hoisted(() => ({
  mockPLogInfo: vi.fn(),
  mockPLogError: vi.fn(),
  mockPLogSuccess: vi.fn(),
  mockPLogWarn: vi.fn(),
  mockPText: vi.fn(),
  mockPSelect: vi.fn(),
  mockPConfirm: vi.fn(),
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
  buildProjectContext: mockBuildProjectContext,
  allEnhancementModules: mockAllEnhancementModules,
  get isCI() { return mockIsCI.value },
  runEnhancements: mockRunEnhancements,
  showEnhancementSummary: mockShowEnhancementSummary,
  showPerEnhancementSummary: mockShowPerEnhancementSummary,
  enhancementRegistry: mockEnhancementRegistry,
  ENHANCEMENT_NEXT_STEPS: mockEnhancementNextSteps,
}))

vi.mock('@clack/prompts', () => ({
  log: {
    info: mockPLogInfo,
    error: mockPLogError,
    success: mockPLogSuccess,
    warn: mockPLogWarn,
  },
  text: mockPText,
  select: mockPSelect,
  confirm: mockPConfirm,
  cancel: mockPCancel,
  isCancel: mockPIsCancel,
}))

vi.mock('picocolors', () => ({
  default: {
    red: (s: string) => s,
    bold: (s: string) => s,
    yellow: (s: string) => s,
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
    mockBuildProjectContext.mockResolvedValue({
      rootDir: '/test/project',
      packageManager: 'npm',
      framework: null,
      packageJson: {},
      installedDeps: {},
      freshScaffold: false,
      verbose: false,
    })
    // Default: no enhancements detected
    for (const mod of mockAllEnhancementModules) {
      mod.detect.mockResolvedValue({ installed: false, configFiles: [], partial: false })
    }
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

  it('detects and captures installed enhancements', async () => {
    // eslint detected as installed, prettier not installed
    mockAllEnhancementModules[0].detect.mockResolvedValue({
      installed: true,
      configFiles: ['eslint.config.js'],
      partial: false,
    })
    mockAllEnhancementModules[1].detect.mockResolvedValue({
      installed: false,
      configFiles: [],
      partial: false,
    })

    await runPresetCommand([
      'preset', 'save', 'my-stack',
      '--framework', 'next',
      '--category', 'web',
    ])

    expect(mockSavePreset).toHaveBeenCalledWith(
      expect.objectContaining({
        enhancements: ['eslint'],
      }),
    )
    // Should log detected enhancements
    expect(mockPLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Enhancements: eslint'),
    )
  })

  it('produces empty enhancements array when none detected', async () => {
    // Both modules return installed: false (default)
    await runPresetCommand([
      'preset', 'save', 'my-stack',
      '--framework', 'next',
      '--category', 'web',
    ])

    expect(mockSavePreset).toHaveBeenCalledWith(
      expect.objectContaining({
        enhancements: [],
      }),
    )
  })
})

describe('preset use', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProcessExit.mockImplementation(() => { throw new Error('process.exit') })
    mockBuildProjectContext.mockResolvedValue({
      rootDir: '/test/project',
      packageManager: 'npm',
      framework: null,
      packageJson: {},
      installedDeps: {},
      freshScaffold: false,
      verbose: false,
    })
    mockRunEnhancements.mockResolvedValue({
      installed: [],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map(),
    })
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

    mockRunEnhancements.mockResolvedValue({
      installed: ['eslint', 'prettier'],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map(),
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

  it('calls runEnhancements when preset has enhancements', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'full-stack',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: ['eslint', 'prettier'],
      config: {},
    })

    mockRunEnhancements.mockResolvedValue({
      installed: ['eslint', 'prettier'],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map([
        ['eslint', { success: true, filesModified: ['eslint.config.js'], packagesAdded: [], warnings: [] }],
        ['prettier', { success: true, filesModified: ['.prettierrc'], packagesAdded: [], warnings: [] }],
      ]),
    })

    await runPresetCommand(['preset', 'use', 'full-stack'])

    expect(mockBuildProjectContext).toHaveBeenCalledWith(
      expect.objectContaining({ rootDir: '/test/project' }),
    )
    expect(mockRunEnhancements).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: expect.arrayContaining([
          expect.objectContaining({ id: 'eslint' }),
          expect.objectContaining({ id: 'prettier' }),
        ]),
      }),
    )
    expect(mockShowEnhancementSummary).toHaveBeenCalled()
  })

  it('warns about unknown enhancement IDs and continues with known ones', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'future-stack',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: ['eslint', 'unknown-thing'],
      config: {},
    })

    mockRunEnhancements.mockResolvedValue({
      installed: ['eslint'],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map([
        ['eslint', { success: true, filesModified: [], packagesAdded: [], warnings: [] }],
      ]),
    })

    await runPresetCommand(['preset', 'use', 'future-stack'])

    // Should warn about unknown enhancement
    expect(mockPLogWarn).toHaveBeenCalledWith(
      expect.stringContaining('unknown-thing'),
    )
    // Should still call runEnhancements with only eslint
    expect(mockRunEnhancements).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [expect.objectContaining({ id: 'eslint' })],
      }),
    )
  })

  it('skips enhancement pipeline when preset has no enhancements', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'minimal',
      scaffold: { framework: 'vite', category: 'web', flags: {} },
      enhancements: [],
      config: {},
    })

    await runPresetCommand(['preset', 'use', 'minimal'])

    expect(mockRunEnhancements).not.toHaveBeenCalled()
    expect(mockBuildProjectContext).not.toHaveBeenCalled()
    expect(mockPLogSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Preset "minimal" applied'),
    )
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
