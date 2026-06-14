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

import { runDirectExecution, runFromLock } from '../../src/commands/scaffold.js'

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
  mockResolveConfig,
  mockLoadPreset,
  mockBuildLock,
  mockWriteLockFile,
  mockReadLockFile,
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
  mockResolveConfig: vi.fn(),
  mockLoadPreset: vi.fn(),
  mockBuildLock: vi.fn(),
  mockWriteLockFile: vi.fn(),
  mockReadLockFile: vi.fn(),
}))

vi.mock('../../src/context/lock.js', () => ({
  buildLock: mockBuildLock,
  writeLockFile: mockWriteLockFile,
  readLockFile: mockReadLockFile,
  LOCK_FILENAME: 'tinkerise.lock',
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
  TinkeriseError: class TinkeriseError extends Error {
    constructor(opts: { message: string }) {
      super(opts.message)
    }
  },
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
    mockBuildLock.mockReturnValue({ framework: 'next' })
    mockWriteLockFile.mockResolvedValue(undefined)
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

  describe('lock file', () => {
    it('writes tinkerise.lock after a successful scaffold', async () => {
      const cmd = createMockCommand()
      await runDirectExecution('web', 'next', 'my-app', cmd, {})

      expect(mockBuildLock).toHaveBeenCalledWith(
        expect.objectContaining({ framework: 'next', packageManager: 'npm' }),
      )
      expect(mockWriteLockFile).toHaveBeenCalled()
    })

    it('completes the scaffold even if the lock write fails', async () => {
      mockWriteLockFile.mockRejectedValueOnce(new Error('disk full'))

      const cmd = createMockCommand()
      await runDirectExecution('web', 'next', 'my-app', cmd, {})

      expect(mockTinkeriseSummaryCard).toHaveBeenCalled()
    })
  })

  describe('from-lock reproduction', () => {
    function lockFor(framework: string, flags: Record<string, string | boolean> = {}) {
      return {
        schemaVersion: 1,
        framework,
        category: 'web',
        flags,
        enhancements: [],
        packageManager: 'npm',
        createdWith: '0.0.0',
      }
    }

    it('reproduces a project from the lock flags', async () => {
      mockReadLockFile.mockResolvedValue(lockFor('next', { typescript: true, tailwind: true }))

      await runFromLock('reproduced-app', {})

      expect(mockExecuteScaffolder).toHaveBeenCalledWith(
        expect.objectContaining({
          scaffolderName: 'next',
          projectName: 'reproduced-app',
          userFlags: { typescript: true, tailwind: true },
        }),
      )
    })

    it('throws when no lock is present', async () => {
      mockReadLockFile.mockResolvedValue(null)

      await expect(runFromLock('app', {})).rejects.toThrow(/tinkerise\.lock/i)
      expect(mockExecuteScaffolder).not.toHaveBeenCalled()
    })

    it('throws for a lock that predates variant capture', async () => {
      mockReadLockFile.mockResolvedValue(lockFor('vite'))

      await expect(runFromLock('app', {})).rejects.toThrow(/vite/i)
      expect(mockExecuteScaffolder).not.toHaveBeenCalled()
    })

    it('reproduces a vite project from a captured variant without prompting', async () => {
      mockResolveViteTemplate.mockReturnValue('react-ts')
      mockReadLockFile.mockResolvedValue({ ...lockFor('vite'), variant: { template: 'react', typescript: true } })

      await runFromLock('repro', {})

      expect(mockSelectViteTemplate).not.toHaveBeenCalled()
      expect(mockResolveViteTemplate).toHaveBeenCalledWith('react', true)
      expect(mockExecuteScaffolder).toHaveBeenCalledWith(
        expect.objectContaining({ scaffolderName: 'vite', extraArgs: expect.arrayContaining(['--template', 'react-ts']) }),
      )
    })

    it('reproduces a t3 project from captured components without prompting', async () => {
      mockReadLockFile.mockResolvedValue({ ...lockFor('t3'), variant: { components: ['trpc'] } })

      await runFromLock('repro', {})

      expect(mockSelectT3Components).not.toHaveBeenCalled()
      expect(mockExecuteScaffolder).toHaveBeenCalledWith(
        expect.objectContaining({ scaffolderName: 't3', extraArgs: expect.arrayContaining(['--trpc', '--CI']) }),
      )
    })

    it('throws when no project name is provided', async () => {
      await expect(runFromLock(undefined, {})).rejects.toThrow(/name/i)
    })
  })

  describe('lock variant capture', () => {
    it('captures the vite template variant', async () => {
      mockSelectViteTemplate.mockResolvedValue('react')
      mockResolveViteTemplate.mockReturnValue('react-ts')

      await runDirectExecution('web', 'vite', 'my-app', createMockCommand(), { typescript: true })

      expect(mockBuildLock).toHaveBeenCalledWith(
        expect.objectContaining({ framework: 'vite', variant: { template: 'react', typescript: true } }),
      )
    })

    it('captures the selected t3 components', async () => {
      mockSelectT3Components.mockResolvedValue(['trpc', 'prisma'])

      await runDirectExecution('web', 't3', 'my-app', createMockCommand(), {})

      expect(mockBuildLock).toHaveBeenCalledWith(
        expect.objectContaining({ framework: 't3', variant: { components: ['trpc', 'prisma'] } }),
      )
    })
  })
})
