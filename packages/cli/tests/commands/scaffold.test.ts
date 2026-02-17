/**
 * Tests for scaffold command handlers.
 *
 * Integration-style tests with mocked dependencies verifying:
 * - Interactive flow calls showBanner and runPromptFlow
 * - Direct execution skips prompts when all args provided
 * - CI guard exits with code 1 when args missing in CI
 * - PM detection source handling (default, binary-missing, lockfile)
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { Command } from 'commander'

// vi.hoisted for mock fns used in vi.mock factories
const {
  mockShowBanner,
  mockRunPromptFlow,
  mockPromptPackageManager,
  mockPromptProjectName,
  mockDetectPackageManager,
  mockExecuteScaffolder,
  mockIsCI,
  mockEnsureNonInteractive,
  mockBuildPreselectedOptions,
  mockMergePromptAndFlags,
  mockLogSuccess,
  mockLogWarn,
  mockLogError,
} = vi.hoisted(() => ({
  mockShowBanner: vi.fn(),
  mockRunPromptFlow: vi.fn(),
  mockPromptPackageManager: vi.fn(),
  mockPromptProjectName: vi.fn(),
  mockDetectPackageManager: vi.fn(),
  mockExecuteScaffolder: vi.fn(),
  mockIsCI: { value: false },
  mockEnsureNonInteractive: vi.fn(),
  mockBuildPreselectedOptions: vi.fn(),
  mockMergePromptAndFlags: vi.fn(),
  mockLogSuccess: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
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
}))

vi.mock('@tinkerise/core', () => ({
  detectPackageManager: mockDetectPackageManager,
  executeScaffolder: mockExecuteScaffolder,
  get isCI() { return mockIsCI.value },
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

import {
  runInteractiveFlow,
  runCategoryFlow,
  runDirectExecution,
} from '../../src/commands/scaffold.js'

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
    mockIsCI.value = false
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

    expect(mockExecuteScaffolder).toHaveBeenCalledWith({
      scaffolderName: 'next',
      projectName: 'my-app',
      userFlags: expect.any(Object),
    })
  })

  it('calls ensureNonInteractive in CI', async () => {
    mockIsCI.value = true
    const cmd = createMockCommand()
    await runInteractiveFlow(cmd, {})

    expect(mockEnsureNonInteractive).toHaveBeenCalledWith(cmd)
  })
})

describe('runCategoryFlow', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
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
    exitSpy.mockRestore()
    mockIsCI.value = false
  })

  it('exits with code 1 for invalid category', async () => {
    const cmd = createMockCommand()
    await expect(
      runCategoryFlow('invalid', cmd, {}),
    ).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(1)
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
    mockDetectPackageManager.mockResolvedValue({
      pm: 'npm',
      source: 'lockfile',
    })
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockPromptProjectName.mockResolvedValue('my-app')
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
    expect(mockExecuteScaffolder).toHaveBeenCalledWith({
      scaffolderName: 'next',
      projectName: 'my-app',
      userFlags: expect.any(Object),
    })
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
      cmd, 'web', 'next', undefined,
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
})

describe('PM detection integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
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
