/**
 * Tests for variant prompt wiring and monorepo routing in scaffold command.
 *
 * Verifies:
 * - Vite framework triggers template selection
 * - Vite --template flag bypasses prompt
 * - Vite --template react --typescript maps to react-ts
 * - T3 framework triggers component selection
 * - T3 component selection adds --CI flag
 * - Summary card is called instead of simple success message
 */

import type { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runDirectExecution } from '../../src/commands/scaffold.js'

// vi.hoisted for mock fns used in vi.mock factories
const {
  mockShowBanner,
  mockRunPromptFlow,
  mockPromptPackageManager,
  mockPromptProjectName,
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
  mockResolveConfig,
  mockLoadPreset,
} = vi.hoisted(() => ({
  mockShowBanner: vi.fn(),
  mockRunPromptFlow: vi.fn(),
  mockPromptPackageManager: vi.fn(),
  mockPromptProjectName: vi.fn(),
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
}))

vi.mock('@tinkerise/core', () => ({
  detectPackageManager: mockDetectPackageManager,
  executeScaffolder: mockExecuteScaffolder,
  tinkeriseSummaryCard: mockTinkeriseSummaryCard,
  resolveConfig: mockResolveConfig,
  loadPreset: mockLoadPreset,
  get isCI() { return mockIsCI.value },
}))

vi.mock('../../src/utils/interactive.js', () => ({
  ensureNonInteractive: mockEnsureNonInteractive,
  buildPreselectedOptions: mockBuildPreselectedOptions,
  mergePromptAndFlags: mockMergePromptAndFlags,
}))

vi.mock('../../src/prompts/variant-select.js', () => ({
  selectViteTemplate: mockSelectViteTemplate,
  resolveViteTemplate: mockResolveViteTemplate,
  selectT3Components: mockSelectT3Components,
}))

vi.mock('@clack/prompts', () => ({
  log: {
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
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

describe('variant prompt wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCI.value = false
    mockResolveConfig.mockResolvedValue({})
    mockLoadPreset.mockResolvedValue(null)
    mockDetectPackageManager.mockResolvedValue({ pm: 'npm', source: 'lockfile' })
    mockExecuteScaffolder.mockResolvedValue(undefined)
    mockBuildPreselectedOptions.mockReturnValue([])
    mockMergePromptAndFlags.mockReturnValue({})
  })

  afterEach(() => {
    mockIsCI.value = false
  })

  describe('vite variant selection', () => {
    it('triggers template selection for vite framework', async () => {
      mockSelectViteTemplate.mockResolvedValue('react')
      mockResolveViteTemplate.mockReturnValue('react')

      const cmd = createMockCommand()
      await runDirectExecution('web', 'vite', 'my-app', cmd, {})

      expect(mockSelectViteTemplate).toHaveBeenCalled()
      expect(mockResolveViteTemplate).toHaveBeenCalledWith('react', false)
    })

    it('passes --template flag to bypass prompt', async () => {
      mockSelectViteTemplate.mockResolvedValue('vue')
      mockResolveViteTemplate.mockReturnValue('vue')

      const cmd = createMockCommand()
      await runDirectExecution('web', 'vite', 'my-app', cmd, { template: 'vue' })

      expect(mockSelectViteTemplate).toHaveBeenCalledWith('vue')
    })

    it('maps --template react --typescript to react-ts', async () => {
      mockSelectViteTemplate.mockResolvedValue('react')
      mockResolveViteTemplate.mockReturnValue('react-ts')

      const cmd = createMockCommand()
      await runDirectExecution('web', 'vite', 'my-app', cmd, { template: 'react', typescript: true })

      expect(mockResolveViteTemplate).toHaveBeenCalledWith('react', true)
      expect(mockExecuteScaffolder).toHaveBeenCalledWith(
        expect.objectContaining({
          extraArgs: ['--template', 'react-ts', '--no-interactive'],
        }),
      )
    })

    it('removes typescript from userFlags for vite (handled via template)', async () => {
      mockSelectViteTemplate.mockResolvedValue('react')
      mockResolveViteTemplate.mockReturnValue('react-ts')
      mockMergePromptAndFlags.mockReturnValue({ typescript: true })

      const cmd = createMockCommand()
      await runDirectExecution('web', 'vite', 'my-app', cmd, { typescript: true })

      const calledFlags = mockExecuteScaffolder.mock.calls[0][0].userFlags
      expect(calledFlags).not.toHaveProperty('typescript')
    })
  })

  describe('t3 variant selection', () => {
    it('triggers component selection for t3 framework', async () => {
      mockSelectT3Components.mockResolvedValue(['trpc', 'prisma'])

      const cmd = createMockCommand()
      await runDirectExecution('web', 't3', 'my-app', cmd, {})

      expect(mockSelectT3Components).toHaveBeenCalled()
    })

    it('adds --CI flag when components selected', async () => {
      mockSelectT3Components.mockResolvedValue(['trpc'])

      const cmd = createMockCommand()
      await runDirectExecution('web', 't3', 'my-app', cmd, {})

      expect(mockExecuteScaffolder).toHaveBeenCalledWith(
        expect.objectContaining({
          extraArgs: expect.arrayContaining(['--trpc', '--CI']),
        }),
      )
    })
  })

  describe('summary card', () => {
    it('calls tinkeriseSummaryCard instead of simple success message', async () => {
      const cmd = createMockCommand()
      await runDirectExecution('web', 'next', 'my-app', cmd, {})

      expect(mockTinkeriseSummaryCard).toHaveBeenCalledWith('next', 'my-app', expect.any(Array))
    })
  })
})
