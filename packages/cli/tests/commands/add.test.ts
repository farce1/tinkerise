import { describe, expect, it, vi, beforeEach } from 'vitest'

// Hoist mocks
const mockBuildProjectContext = vi.hoisted(() => vi.fn())
const mockRunEnhancements = vi.hoisted(() => vi.fn())
const mockShowEnhancementSummary = vi.hoisted(() => vi.fn())
const mockShowPerEnhancementSummary = vi.hoisted(() => vi.fn())
const mockEnhancementRegistry = vi.hoisted(() => new Map())
const mockAllEnhancementModules = vi.hoisted(() => [
  { id: 'eslint', name: 'ESLint', description: 'Lint', dependsOn: [], detect: vi.fn(), install: vi.fn() },
  { id: 'prettier', name: 'Prettier', description: 'Format', dependsOn: [], detect: vi.fn(), install: vi.fn() },
  { id: 'husky', name: 'Husky', description: 'Hooks', dependsOn: [], detect: vi.fn(), install: vi.fn() },
  { id: 'ci', name: 'CI', description: 'CI', dependsOn: [], detect: vi.fn(), install: vi.fn() },
])
const mockIsCI = vi.hoisted(() => ({ value: false }))
const mockEnhancementNextSteps = vi.hoisted(() => ({
  eslint: ['Run lint'],
  prettier: ['Run format'],
  husky: ['Make a commit'],
  ci: ['Push to GitHub'],
}))

const mockShowEnhancementPicker = vi.hoisted(() => vi.fn())
const mockGetSessionContext = vi.hoisted(() => vi.fn())

const mockProcessExit = vi.hoisted(() => vi.fn())
const mockPLogError = vi.hoisted(() => vi.fn())
const mockPLogInfo = vi.hoisted(() => vi.fn())

vi.mock('@tinkerise/core', () => ({
  buildProjectContext: mockBuildProjectContext,
  runEnhancements: mockRunEnhancements,
  showEnhancementSummary: mockShowEnhancementSummary,
  showPerEnhancementSummary: mockShowPerEnhancementSummary,
  enhancementRegistry: mockEnhancementRegistry,
  allEnhancementModules: mockAllEnhancementModules,
  get isCI() { return mockIsCI.value },
  ENHANCEMENT_NEXT_STEPS: mockEnhancementNextSteps,
}))

vi.mock('@clack/prompts', () => ({
  log: { error: mockPLogError, info: mockPLogInfo },
  select: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
}))

vi.mock('../../src/context/session.js', () => ({
  getSessionContext: mockGetSessionContext,
}))

vi.mock('../../src/prompts/enhancement-select.js', () => ({
  showEnhancementPicker: mockShowEnhancementPicker,
}))

import { runAddCommand } from '../../src/commands/add.js'

describe('runAddCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default session context
    mockGetSessionContext.mockReturnValue({})

    // Default project context
    mockBuildProjectContext.mockResolvedValue({
      rootDir: '/tmp/test-project',
      packageManager: 'npm',
      framework: null,
      packageJson: { type: 'module' },
      installedDeps: {},
      freshScaffold: false,
      verbose: false,
    })

    // Default: run returns empty summary
    mockRunEnhancements.mockResolvedValue({
      installed: [],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map(),
    })

    // Reset registry
    mockEnhancementRegistry.clear()
    for (const mod of mockAllEnhancementModules) {
      mockEnhancementRegistry.set(mod.id, mod)
    }

    // Default: not CI
    mockIsCI.value = false

    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(mockProcessExit as never)
  })

  it('launches picker when no args provided (interactive)', async () => {
    const eslintMod = mockAllEnhancementModules[0]
    mockShowEnhancementPicker.mockResolvedValue([eslintMod])
    mockRunEnhancements.mockResolvedValue({
      installed: ['eslint'],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map([['eslint', { success: true, filesModified: [], packagesAdded: [], warnings: [] }]]),
    })

    await runAddCommand([], {})

    expect(mockShowEnhancementPicker).toHaveBeenCalled()
    expect(mockRunEnhancements).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: [eslintMod],
      }),
    )
  })

  it('resolves named enhancements from registry', async () => {
    mockRunEnhancements.mockResolvedValue({
      installed: ['eslint', 'prettier'],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map(),
    })

    await runAddCommand(['eslint', 'prettier'], {})

    expect(mockShowEnhancementPicker).not.toHaveBeenCalled()
    expect(mockRunEnhancements).toHaveBeenCalledWith(
      expect.objectContaining({
        modules: expect.arrayContaining([
          expect.objectContaining({ id: 'eslint' }),
          expect.objectContaining({ id: 'prettier' }),
        ]),
      }),
    )
  })

  it('exits with error for unknown enhancement name', async () => {
    mockEnhancementRegistry.delete('unknown')

    await runAddCommand(['unknown'], {})

    expect(mockProcessExit).toHaveBeenCalledWith(1)
  })

  it('shows per-enhancement summary for installed modules', async () => {
    const installResult = {
      success: true,
      filesModified: ['eslint.config.js'],
      packagesAdded: ['eslint@^9.0.0'],
      warnings: [],
    }

    mockRunEnhancements.mockResolvedValue({
      installed: ['eslint'],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map([['eslint', installResult]]),
    })

    await runAddCommand(['eslint'], {})

    expect(mockShowPerEnhancementSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'eslint',
        moduleName: 'ESLint',
        result: installResult,
      }),
    )
  })

  it('shows overall summary after per-enhancement cards', async () => {
    const summary = {
      installed: ['eslint'],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map(),
    }
    mockRunEnhancements.mockResolvedValue(summary)

    await runAddCommand(['eslint'], {})

    expect(mockShowEnhancementSummary).toHaveBeenCalledWith(summary)
  })

  it('CI mode exits when no args', async () => {
    mockIsCI.value = true

    await runAddCommand([], {})

    expect(mockProcessExit).toHaveBeenCalledWith(1)
  })

  it('passes verbose option to buildProjectContext', async () => {
    mockRunEnhancements.mockResolvedValue({
      installed: [],
      skipped: [],
      failed: [],
      notRun: [],
      results: new Map(),
    })

    await runAddCommand(['eslint'], { verbose: true })

    expect(mockBuildProjectContext).toHaveBeenCalledWith(
      expect.objectContaining({ verbose: true }),
    )
  })
})
