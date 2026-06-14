/**
 * Tests for config and preset integration in scaffold command.
 *
 * Verifies the override chain:
 * - Config PM fallback when no lockfile and no CLI flag
 * - Lockfile always overrides config for packageManager
 * - CLI flag overrides config for packageManager
 * - Config typescript pre-selection in buildUserFlags
 * - CLI typescript overrides config typescript
 * - Preset framework pre-fills framework prompt
 * - Preset scaffold flags merge into preselected options
 * - Verbose mode shows config override messages
 */

import type { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  runCategoryFlow,
  runDirectExecution,
  runInteractiveFlow,
} from '../../src/commands/scaffold.js'

// vi.hoisted for mock fns used in vi.mock factories
const {
  mockShowBanner,
  mockRunPromptFlow,
  mockPromptPackageManager,
  mockPromptProjectName,
  mockValidateProjectName,
  mockDetectPackageManager,
  mockExecuteScaffolder,
  mockTinkeriseSummaryCard,
  mockIsCI,
  mockEnsureNonInteractive,
  mockBuildPreselectedOptions,
  mockMergePromptAndFlags,
  mockSelectViteTemplate,
  mockResolveViteTemplate,
  mockSelectT3Components,
  mockLogInfo,
  mockLogWarn,
  mockResolveConfig,
  mockLoadPreset,
} = vi.hoisted(() => ({
  mockShowBanner: vi.fn(),
  mockRunPromptFlow: vi.fn(),
  mockPromptPackageManager: vi.fn(),
  mockPromptProjectName: vi.fn(),
  mockValidateProjectName: vi.fn(() => undefined),
  mockDetectPackageManager: vi.fn(),
  mockExecuteScaffolder: vi.fn(),
  mockTinkeriseSummaryCard: vi.fn(),
  mockIsCI: { value: false },
  mockEnsureNonInteractive: vi.fn(),
  mockBuildPreselectedOptions: vi.fn(),
  mockMergePromptAndFlags: vi.fn(),
  mockSelectViteTemplate: vi.fn(),
  mockResolveViteTemplate: vi.fn(),
  mockSelectT3Components: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockResolveConfig: vi.fn(),
  mockLoadPreset: vi.fn(),
}))

vi.mock('../../src/utils/banner.js', () => ({
  showBanner: mockShowBanner,
}))

vi.mock('../../src/prompts/flow.js', () => ({
  runPromptFlow: mockRunPromptFlow,
}))

vi.mock('../../src/prompts/pm-select.js', () => ({
  promptPackageManager: mockPromptPackageManager,
}))

vi.mock('../../src/prompts/project-name.js', () => ({
  promptProjectName: mockPromptProjectName,
  validateProjectName: mockValidateProjectName,
}))

vi.mock('@tinkerise/core', () => ({
  detectPackageManager: mockDetectPackageManager,
  executeScaffolder: mockExecuteScaffolder,
  tinkeriseSummaryCard: mockTinkeriseSummaryCard,
  resolveConfig: mockResolveConfig,
  loadPreset: mockLoadPreset,
  get isCI() { return mockIsCI.value },
}))

vi.mock('../../src/context/lock.js', () => ({
  buildLock: vi.fn(() => ({})),
  writeLockFile: vi.fn(),
  LOCK_FILENAME: 'tinkerise.lock',
}))

vi.mock('../../src/prompts/variant-select.js', () => ({
  selectViteTemplate: mockSelectViteTemplate,
  resolveViteTemplate: mockResolveViteTemplate,
  selectT3Components: mockSelectT3Components,
}))

vi.mock('../../src/utils/interactive.js', () => ({
  ensureNonInteractive: mockEnsureNonInteractive,
  buildPreselectedOptions: mockBuildPreselectedOptions,
  mergePromptAndFlags: mockMergePromptAndFlags,
}))

vi.mock('@clack/prompts', () => ({
  log: {
    success: vi.fn(),
    warn: mockLogWarn,
    error: vi.fn(),
    info: mockLogInfo,
  },
}))

vi.mock('picocolors', () => ({
  default: {
    green: (s: string) => s,
    bold: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
  },
}))

function createMockCommand(
  optionSources: Record<string, string> = {},
  optionValues: Record<string, unknown> = {},
): Command {
  return {
    getOptionValueSource: vi.fn((name: string) => optionSources[name] ?? undefined),
    opts: vi.fn(() => optionValues),
  } as unknown as Command
}

describe('config PM fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
    mockLoadPreset.mockResolvedValue(null)
  })

  afterEach(() => {
    mockIsCI.value = false
  })

  it('uses config packageManager when detectPackageManager returns default', async () => {
    mockResolveConfig.mockResolvedValue({ packageManager: 'pnpm' })
    mockDetectPackageManager.mockResolvedValue({ pm: 'npm', source: 'default' })

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    // Config PM should be used -- no prompt
    expect(mockPromptPackageManager).not.toHaveBeenCalled()
    // Should show informational message
    expect(mockLogInfo).toHaveBeenCalled()
    const infoMsg = mockLogInfo.mock.calls[0]![0] as string
    expect(infoMsg).toContain('pnpm')
    expect(infoMsg).toContain('from config')
    // pnpm should be passed as PM to executeScaffolder
    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        userFlags: expect.objectContaining({ 'package-manager': 'pnpm' }),
      }),
    )
  })

  it('prompts for PM when source is default and no config PM', async () => {
    mockResolveConfig.mockResolvedValue({})
    mockDetectPackageManager.mockResolvedValue({ pm: 'npm', source: 'default' })
    mockPromptPackageManager.mockResolvedValue('yarn')

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    expect(mockPromptPackageManager).toHaveBeenCalled()
  })
})

describe('lockfile overrides config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
    mockLoadPreset.mockResolvedValue(null)
  })

  it('uses lockfile PM even when config has a different packageManager', async () => {
    mockResolveConfig.mockResolvedValue({ packageManager: 'pnpm' })
    mockDetectPackageManager.mockResolvedValue({ pm: 'npm', source: 'lockfile' })

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    // Lockfile wins -- no prompt, no config override
    expect(mockPromptPackageManager).not.toHaveBeenCalled()
    // Should NOT show "Using X (from config)" message
    expect(mockLogInfo).not.toHaveBeenCalled()
    // npm (from lockfile) should be used, not pnpm (from config)
    // npm is the default so it's not in package-manager flag
    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        userFlags: expect.not.objectContaining({ 'package-manager': 'pnpm' }),
      }),
    )
  })
})

describe('cLI flag overrides config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
    mockLoadPreset.mockResolvedValue(null)
  })

  it('uses CLI flag PM even when config has a different packageManager', async () => {
    mockResolveConfig.mockResolvedValue({ packageManager: 'pnpm' })
    mockDetectPackageManager.mockResolvedValue({ pm: 'yarn', source: 'flag' })

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, { packageManager: 'yarn' })

    // CLI flag wins
    expect(mockPromptPackageManager).not.toHaveBeenCalled()
    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        userFlags: expect.objectContaining({ 'package-manager': 'yarn' }),
      }),
    )
  })

  it('shows override message only in verbose mode', async () => {
    mockResolveConfig.mockResolvedValue({ packageManager: 'pnpm' })
    mockDetectPackageManager.mockResolvedValue({ pm: 'yarn', source: 'flag' })

    const cmd = createMockCommand()

    // Without verbose -- no override message
    await runDirectExecution('web', 'next', 'my-app', cmd, { packageManager: 'yarn' })
    expect(mockLogInfo).not.toHaveBeenCalled()

    vi.clearAllMocks()
    mockResolveConfig.mockResolvedValue({ packageManager: 'pnpm' })
    mockDetectPackageManager.mockResolvedValue({ pm: 'yarn', source: 'flag' })
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
    mockLoadPreset.mockResolvedValue(null)

    // With verbose -- shows override message
    await runDirectExecution('web', 'next', 'my-app', cmd, { packageManager: 'yarn', verbose: true })
    expect(mockLogInfo).toHaveBeenCalled()
    const infoMsg = mockLogInfo.mock.calls[0]![0] as string
    expect(infoMsg).toContain('Overriding config')
    expect(infoMsg).toContain('pnpm')
    expect(infoMsg).toContain('yarn')
  })
})

describe('config typescript pre-selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockDetectPackageManager.mockResolvedValue({ pm: 'npm', source: 'lockfile' })
    mockLoadPreset.mockResolvedValue(null)
  })

  it('adds typescript flag when config has typescript: true and no CLI flag', async () => {
    mockResolveConfig.mockResolvedValue({ typescript: true })
    // mergePromptAndFlags returns empty (no prompt-selected options)
    mockMergePromptAndFlags.mockReturnValue({})

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    // typescript should be in userFlags from config pre-selection
    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        userFlags: expect.objectContaining({ typescript: true }),
      }),
    )
  })

  it('cLI --typescript overrides config typescript: false', async () => {
    mockResolveConfig.mockResolvedValue({ typescript: false })
    mockMergePromptAndFlags.mockReturnValue({})

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, { typescript: true })

    // CLI flag wins
    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        userFlags: expect.objectContaining({ typescript: true }),
      }),
    )
  })
})

describe('preset framework pre-fill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockResolveConfig.mockResolvedValue({})
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
    mockDetectPackageManager.mockResolvedValue({ pm: 'npm', source: 'lockfile' })
  })

  it('passes preset framework to runPromptFlow in interactive mode', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'my-stack',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: [],
      config: {},
    })
    mockRunPromptFlow.mockResolvedValue({
      framework: 'next',
      options: [],
      name: 'my-app',
    })

    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, { preset: 'my-stack' })

    expect(mockRunPromptFlow).toHaveBeenCalledWith(
      expect.objectContaining({ framework: 'next' }),
    )
  })

  it('passes preset framework in category flow when categories match', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'web-stack',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: [],
      config: {},
    })
    mockRunPromptFlow.mockResolvedValue({
      framework: 'next',
      options: [],
      name: 'my-app',
    })

    const cmd = createMockCommand()
    await runCategoryFlow('web', cmd, { preset: 'web-stack' })

    expect(mockRunPromptFlow).toHaveBeenCalledWith(
      expect.objectContaining({ framework: 'next' }),
    )
  })

  it('ignores preset framework in category flow when categories do not match', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'web-stack',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: [],
      config: {},
    })
    mockRunPromptFlow.mockResolvedValue({
      framework: 'express',
      options: [],
      name: 'my-api',
    })

    const cmd = createMockCommand()
    await runCategoryFlow('backend', cmd, { preset: 'web-stack' })

    // Should NOT pass 'next' as framework since category mismatch (Pitfall 2)
    expect(mockRunPromptFlow).toHaveBeenCalledWith(
      expect.objectContaining({ framework: undefined }),
    )
  })
})

describe('preset scaffold flags merge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockResolveConfig.mockResolvedValue({})
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockDetectPackageManager.mockResolvedValue({ pm: 'npm', source: 'lockfile' })
    // Make mergePromptAndFlags convert the options array to a record (mirrors real behavior)
    mockMergePromptAndFlags.mockImplementation((options: string[]) => {
      const record: Record<string, boolean> = {}
      for (const opt of options) {
        record[opt] = true
      }
      return record
    })
  })

  it('merges preset scaffold flags into preselected options', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'ts-stack',
      scaffold: { framework: 'next', category: 'web', flags: { typescript: true, tailwind: true } },
      enhancements: [],
      config: {},
    })
    // buildPreselectedOptions returns empty (no CLI flags)
    mockBuildPreselectedOptions.mockReturnValue([])

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, { preset: 'ts-stack' })

    // Preset flags should be merged as preselected options
    // The executePipeline call receives merged preselected options
    // which include typescript and tailwind from preset
    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        userFlags: expect.objectContaining({ typescript: true, tailwind: true }),
      }),
    )
  })

  it('cLI preselected options are preserved alongside preset flags', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'ts-stack',
      scaffold: { framework: 'next', category: 'web', flags: { tailwind: true } },
      enhancements: [],
      config: {},
    })
    // CLI has --typescript flag
    mockBuildPreselectedOptions.mockReturnValue(['typescript'])

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, { preset: 'ts-stack' })

    // Both typescript (CLI) and tailwind (preset) should be in userFlags
    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        userFlags: expect.objectContaining({ typescript: true, tailwind: true }),
      }),
    )
  })
})

describe('resolveConfig is called in all entry modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockResolveConfig.mockResolvedValue({})
    mockLoadPreset.mockResolvedValue(null)
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
    mockDetectPackageManager.mockResolvedValue({ pm: 'npm', source: 'lockfile' })
    mockRunPromptFlow.mockResolvedValue({
      framework: 'next',
      options: [],
      name: 'my-app',
    })
  })

  it('calls resolveConfig in interactive flow without project config loading', async () => {
    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, {})
    expect(mockResolveConfig).toHaveBeenCalledOnce()
    expect(mockResolveConfig).toHaveBeenCalledWith({
      presetName: undefined,
      includeProjectConfig: false,
    })
  })

  it('calls resolveConfig in category flow without project config loading', async () => {
    const cmd = createMockCommand()
    await runCategoryFlow('web', cmd, {})
    expect(mockResolveConfig).toHaveBeenCalledOnce()
    expect(mockResolveConfig).toHaveBeenCalledWith({
      presetName: undefined,
      includeProjectConfig: false,
    })
  })

  it('calls resolveConfig in direct execution without project config loading', async () => {
    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})
    expect(mockResolveConfig).toHaveBeenCalledOnce()
    expect(mockResolveConfig).toHaveBeenCalledWith({
      presetName: undefined,
      includeProjectConfig: false,
    })
  })
})
