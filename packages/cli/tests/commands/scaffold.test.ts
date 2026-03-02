/**
 * Tests for scaffold command handlers.
 *
 * Integration-style tests with mocked dependencies verifying:
 * - Interactive flow calls showBanner and runPromptFlow
 * - Direct execution skips prompts when all args provided
 * - CI guard exits with code 1 when args missing in CI
 * - PM detection source handling (default, binary-missing, lockfile)
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
  mockLogSuccess,
  mockLogWarn,
  mockLogError,
  mockLogInfo,
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
  mockLogSuccess: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
  mockLogInfo: vi.fn(),
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

vi.mock('@tinkerise/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tinkerise/core')>()
  return {
    ...actual,
    detectPackageManager: mockDetectPackageManager,
    executeScaffolder: mockExecuteScaffolder,
    tinkeriseSummaryCard: mockTinkeriseSummaryCard,
    resolveConfig: mockResolveConfig,
    loadPreset: mockLoadPreset,
    get isCI() { return mockIsCI.value },
  }
})

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
    success: mockLogSuccess,
    warn: mockLogWarn,
    error: mockLogError,
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

describe('runInteractiveFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateProjectName.mockReturnValue(undefined)
    mockIsCI.value = false
    mockResolveConfig.mockResolvedValue({})
    mockLoadPreset.mockResolvedValue(null)
    mockRunPromptFlow.mockResolvedValue({
      framework: 'next',
      options: ['typescript'],
      name: 'my-app',
    })
    mockDetectPackageManager.mockResolvedValue({
      pm: 'npm',
      source: 'lockfile',
    })
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({ typescript: true })
  })

  afterEach(() => {
    mockIsCI.value = false
  })

  it('calls showBanner and runPromptFlow when not in CI', async () => {
    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, {})

    expect(mockShowBanner).toHaveBeenCalledOnce()
    expect(mockRunPromptFlow).toHaveBeenCalledOnce()
  })

  it('calls executeScaffolder with correct args', async () => {
    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, {})

    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        scaffolderName: 'next',
        projectName: 'my-app',
      }),
    )
  })

  it('calls ensureNonInteractive in CI', async () => {
    mockIsCI.value = true
    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, {})

    expect(mockEnsureNonInteractive).toHaveBeenCalledWith(cmd)
  })
})

describe('runCategoryFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateProjectName.mockReturnValue(undefined)
    mockIsCI.value = false
    mockResolveConfig.mockResolvedValue({})
    mockLoadPreset.mockResolvedValue(null)
    mockRunPromptFlow.mockResolvedValue({
      framework: 'next',
      options: ['typescript'],
      name: 'my-app',
    })
    mockDetectPackageManager.mockResolvedValue({
      pm: 'npm',
      source: 'lockfile',
    })
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
  })

  afterEach(() => {
    mockIsCI.value = false
  })

  it('throws InvalidCategoryError for invalid category', async () => {
    const cmd = createMockCommand()
    await expect(
      runCategoryFlow('invalid', cmd, {}),
    ).rejects.toThrow('Unknown category')
  })

  it('calls ensureNonInteractive in CI', async () => {
    mockIsCI.value = true
    const cmd = createMockCommand()
    await runCategoryFlow('web', cmd, {})

    expect(mockEnsureNonInteractive).toHaveBeenCalledWith(cmd, 'web')
  })

  it('passes filterCategory to runPromptFlow', async () => {
    const cmd = createMockCommand()
    await runCategoryFlow('web', cmd, {})

    expect(mockRunPromptFlow).toHaveBeenCalledWith(
      expect.objectContaining({ filterCategory: 'web' }),
    )
  })
})

describe('runDirectExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockResolveConfig.mockResolvedValue({})
    mockLoadPreset.mockResolvedValue(null)
    mockDetectPackageManager.mockResolvedValue({
      pm: 'npm',
      source: 'lockfile',
    })
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockPromptProjectName.mockResolvedValue('my-app')
    mockValidateProjectName.mockReturnValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
  })

  afterEach(() => {
    mockIsCI.value = false
  })

  it('skips all prompts when all args provided', async () => {
    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    expect(mockRunPromptFlow).not.toHaveBeenCalled()
    expect(mockPromptProjectName).not.toHaveBeenCalled()
    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({
        scaffolderName: 'next',
        projectName: 'my-app',
      }),
    )
  })

  it('prompts for project name when name not provided', async () => {
    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', undefined, cmd, {})

    expect(mockPromptProjectName).toHaveBeenCalledWith('next')
  })

  it('calls ensureNonInteractive in CI when name missing', async () => {
    mockIsCI.value = true
    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', undefined, cmd, {})

    expect(mockEnsureNonInteractive).toHaveBeenCalledWith(
      cmd,
      'web',
      'next',
      undefined,
    )
  })

  it('calls executeScaffolder with correct framework', async () => {
    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    expect(mockExecuteScaffolder).toHaveBeenCalledWith(
      expect.objectContaining({ scaffolderName: 'next' }),
    )
  })

  it('builds preselected options from CLI flags', async () => {
    mockBuildPreselectedOptions.mockReturnValue(['typescript'])
    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    expect(mockBuildPreselectedOptions).toHaveBeenCalledWith(cmd)
  })

  it('rejects invalid direct project names before execution', async () => {
    mockValidateProjectName.mockReturnValue('Invalid project name')
    const cmd = createMockCommand()

    await expect(
      runDirectExecution('web', 'next', '../bad', cmd, {}),
    ).rejects.toThrow('Invalid value')
    expect(mockExecuteScaffolder).not.toHaveBeenCalled()
  })
})

describe('pM detection integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateProjectName.mockReturnValue(undefined)
    mockIsCI.value = false
    mockResolveConfig.mockResolvedValue({})
    mockLoadPreset.mockResolvedValue(null)
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
  })

  afterEach(() => {
    mockIsCI.value = false
  })

  it('prompts for PM when source is default', async () => {
    mockDetectPackageManager.mockResolvedValue({
      pm: 'npm',
      source: 'default',
    })
    mockPromptPackageManager.mockResolvedValue('pnpm')

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    expect(mockPromptPackageManager).toHaveBeenCalled()
    // Should NOT show a warning for default source
    expect(mockLogWarn).not.toHaveBeenCalled()
  })

  it('warns and prompts for PM when source is binary-missing', async () => {
    mockDetectPackageManager.mockResolvedValue({
      pm: 'pnpm',
      source: 'binary-missing',
    })
    mockPromptPackageManager.mockResolvedValue('npm')

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    // Should show a yellow warning naming the detected PM
    expect(mockLogWarn).toHaveBeenCalled()
    const warnMsg = mockLogWarn.mock.calls[0]![0] as string
    expect(warnMsg).toContain('pnpm')

    // Then prompt for PM
    expect(mockPromptPackageManager).toHaveBeenCalled()
  })

  it('does not prompt for PM when source is lockfile', async () => {
    mockDetectPackageManager.mockResolvedValue({
      pm: 'bun',
      source: 'lockfile',
    })

    const cmd = createMockCommand()
    await runDirectExecution('web', 'next', 'my-app', cmd, {})

    expect(mockPromptPackageManager).not.toHaveBeenCalled()
  })
})

describe('defaultCategory config wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateProjectName.mockReturnValue(undefined)
    mockIsCI.value = false
    mockLoadPreset.mockResolvedValue(null)
    mockRunPromptFlow.mockResolvedValue({
      framework: 'next',
      options: ['typescript'],
      name: 'my-app',
    })
    mockDetectPackageManager.mockResolvedValue({
      pm: 'npm',
      source: 'lockfile',
    })
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({ typescript: true })
  })

  afterEach(() => {
    mockIsCI.value = false
  })

  it('passes defaultCategory as filterCategory to runPromptFlow', async () => {
    mockResolveConfig.mockResolvedValue({ defaultCategory: 'web' })

    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, {})

    expect(mockRunPromptFlow).toHaveBeenCalledWith(
      expect.objectContaining({ filterCategory: 'web' }),
    )
  })

  it('falls back to unfiltered list with warning for invalid defaultCategory', async () => {
    mockResolveConfig.mockResolvedValue({ defaultCategory: 'desktop' as any })

    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, {})

    expect(mockRunPromptFlow).toHaveBeenCalledWith(
      expect.objectContaining({ filterCategory: undefined }),
    )
    expect(mockLogWarn).toHaveBeenCalled()
    const warnMsg = mockLogWarn.mock.calls[0]![0] as string
    expect(warnMsg).toContain('Invalid defaultCategory')
    expect(warnMsg).toContain('desktop')
  })

  it('preset category overrides defaultCategory', async () => {
    mockResolveConfig.mockResolvedValue({ defaultCategory: 'backend' })
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'web-stack',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: [],
      config: {},
    })

    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, { preset: 'web-stack' })

    // Preset category 'web' should override config defaultCategory 'backend'
    expect(mockRunPromptFlow).toHaveBeenCalledWith(
      expect.objectContaining({ filterCategory: 'web' }),
    )
  })

  it('does not pass filterCategory when no defaultCategory in config', async () => {
    mockResolveConfig.mockResolvedValue({})

    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, {})

    expect(mockRunPromptFlow).toHaveBeenCalledWith(
      expect.objectContaining({ filterCategory: undefined }),
    )
    expect(mockLogWarn).not.toHaveBeenCalled()
  })
})
