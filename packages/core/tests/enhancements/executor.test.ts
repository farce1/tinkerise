import type { EnhancementExecutorOptions } from '../../src/enhancements/executor.js'
import type {
  DetectionResult,
  EnhancementModule,
  InstallResult,
  ProjectContext,
} from '../../src/enhancements/types.js'
import { readFile, writeFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runEnhancements } from '../../src/enhancements/executor.js'

// Suppress console.log from tinkeriseLog during tests
vi.mock('../../src/executor/framing.js', () => ({
  tinkeriseLog: vi.fn(),
  tinkeriseBlankLine: vi.fn(),
}))

// Mock readFile/writeFile for conflict detection tests
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('existing content'),
  writeFile: vi.fn().mockResolvedValue(undefined),
}))

const mockReadFile = vi.mocked(readFile)
const mockWriteFile = vi.mocked(writeFile)

/** Default project context for testing */
const ctx: ProjectContext = {
  rootDir: '/tmp/test-project',
  packageManager: 'npm',
  framework: null,
  packageJson: {},
  installedDeps: {},
  freshScaffold: false,
  verbose: false,
}

/** Create a mock EnhancementModule with sensible defaults */
function mockModule(overrides: Partial<EnhancementModule> = {}): EnhancementModule {
  return {
    id: overrides.id ?? 'test-mod',
    name: overrides.name ?? overrides.id ?? 'Test Module',
    description: overrides.description ?? 'A test module',
    dependsOn: overrides.dependsOn ?? [],
    detect: overrides.detect ?? (async (): Promise<DetectionResult> => ({
      installed: false,
      configFiles: [],
      partial: false,
    })),
    install: overrides.install ?? (async (): Promise<InstallResult> => ({
      success: true,
      filesModified: [],
      packagesAdded: [],
      warnings: [],
    })),
  }
}

/** Create default executor options */
function makeOpts(
  modules: EnhancementModule[],
  overrides: Partial<EnhancementExecutorOptions> = {},
): EnhancementExecutorOptions {
  return {
    modules,
    context: ctx,
    onConflict: overrides.onConflict ?? (async () => 'replace' as const),
    onDependencyApproval: overrides.onDependencyApproval ?? (async () => true),
    interactive: overrides.interactive ?? true,
  }
}

describe('runEnhancements()', () => {
  beforeEach(() => {
    mockReadFile.mockReset().mockResolvedValue('existing content' as any)
    mockWriteFile.mockReset().mockResolvedValue(undefined as any)
  })

  it('installs a single module with no conflicts', async () => {
    const mod = mockModule({ id: 'eslint' })
    const result = await runEnhancements(makeOpts([mod]))

    expect(result.installed).toEqual(['eslint'])
    expect(result.skipped).toEqual([])
    expect(result.failed).toEqual([])
    expect(result.notRun).toEqual([])
  })

  it('runs modules in dependency order (dependent after dependency)', async () => {
    const installOrder: string[] = []
    const eslint = mockModule({
      id: 'eslint',
      install: async () => {
        installOrder.push('eslint')
        return { success: true, filesModified: [], packagesAdded: [], warnings: [] }
      },
    })
    const prettier = mockModule({
      id: 'prettier',
      dependsOn: ['eslint'],
      install: async () => {
        installOrder.push('prettier')
        return { success: true, filesModified: [], packagesAdded: [], warnings: [] }
      },
    })

    // Pass in reverse order to verify sorting
    const result = await runEnhancements(makeOpts([prettier, eslint]))

    expect(installOrder).toEqual(['eslint', 'prettier'])
    expect(result.installed).toEqual(['eslint', 'prettier'])
  })

  it('skips module when conflict detected and user chooses skip', async () => {
    // First read: existing content (before install). Second read: new content (after install).
    mockReadFile
      .mockResolvedValueOnce('existing content' as any)
      .mockResolvedValueOnce('new proposed content' as any)

    const mod = mockModule({
      id: 'eslint',
      detect: async () => ({
        installed: true,
        configFiles: ['/tmp/test-project/.eslintrc.json'],
        partial: false,
      }),
    })

    const opts = makeOpts([mod], {
      onConflict: async () => 'skip' as const,
    })

    const result = await runEnhancements(opts)

    expect(result.installed).toEqual([])
    expect(result.skipped).toEqual(['eslint'])
    // Verify original content was restored
    expect(mockWriteFile).toHaveBeenCalled()
  })

  it('installs module when conflict detected and user chooses replace', async () => {
    // First read: existing content. Second read: new content after install.
    mockReadFile
      .mockResolvedValueOnce('existing content' as any)
      .mockResolvedValueOnce('new proposed content' as any)

    const mod = mockModule({
      id: 'eslint',
      detect: async () => ({
        installed: true,
        configFiles: ['/tmp/test-project/.eslintrc.json'],
        partial: false,
      }),
    })

    const opts = makeOpts([mod], {
      onConflict: async () => 'replace' as const,
    })

    const result = await runEnhancements(opts)

    expect(result.installed).toEqual(['eslint'])
    expect(result.skipped).toEqual([])
  })

  it('continues after failure and attempts remaining modules', async () => {
    const failing = mockModule({
      id: 'eslint',
      install: async () => {
        throw new Error('Install failed')
      },
    })
    const after = mockModule({ id: 'prettier' })

    const result = await runEnhancements(makeOpts([failing, after]))

    expect(result.failed).toEqual([
      { id: 'eslint', error: 'Install failed' },
    ])
    // prettier should be attempted and succeed (not marked as notRun)
    expect(result.installed).toEqual(['prettier'])
    expect(result.notRun).toEqual([])
  })

  it('fails module in non-interactive mode when conflict detected but continues', async () => {
    const mod = mockModule({
      id: 'eslint',
      detect: async () => ({
        installed: true,
        configFiles: ['/tmp/.eslintrc.json'],
        partial: false,
      }),
    })
    const after = mockModule({ id: 'prettier' })

    const opts = makeOpts([mod, after], { interactive: false })
    const result = await runEnhancements(opts)

    expect(result.failed).toEqual([
      { id: 'eslint', error: 'Conflict detected in non-interactive mode' },
    ])
    // prettier should still be attempted (not marked as notRun)
    expect(result.installed).toEqual(['prettier'])
    expect(result.notRun).toEqual([])
  })

  it('installs module when missing dependency approval is granted', async () => {
    const mod = mockModule({
      id: 'prettier',
      dependsOn: ['eslint'], // eslint not in current batch
    })

    const approvalCalled: Array<{ id: string, deps: string[] }> = []
    const opts = makeOpts([mod], {
      onDependencyApproval: async (id, deps) => {
        approvalCalled.push({ id, deps })
        return true
      },
    })

    const result = await runEnhancements(opts)

    expect(result.installed).toEqual(['prettier'])
    expect(approvalCalled).toEqual([{ id: 'prettier', deps: ['eslint'] }])
  })

  it('skips module when missing dependency approval is denied', async () => {
    const mod = mockModule({
      id: 'prettier',
      dependsOn: ['eslint'], // eslint not in current batch
    })

    const opts = makeOpts([mod], {
      onDependencyApproval: async () => false,
    })

    const result = await runEnhancements(opts)

    expect(result.installed).toEqual([])
    expect(result.skipped).toEqual(['prettier'])
  })

  it('populates results map for successfully installed modules', async () => {
    const installResult = { success: true, filesModified: ['eslint.config.js'], packagesAdded: ['eslint@^9.0.0'], warnings: [] }
    const mod = mockModule({
      id: 'eslint',
      install: async () => installResult,
    })
    const result = await runEnhancements(makeOpts([mod]))

    expect(result.results).toBeInstanceOf(Map)
    expect(result.results.get('eslint')).toEqual(installResult)
  })

  it('marks all modules as failed on cyclic dependency', async () => {
    const a = mockModule({ id: 'a', dependsOn: ['b'] })
    const b = mockModule({ id: 'b', dependsOn: ['a'] })

    const result = await runEnhancements(makeOpts([a, b]))

    expect(result.installed).toEqual([])
    expect(result.failed).toHaveLength(2)
    expect(result.failed[0].id).toBe('a')
    expect(result.failed[1].id).toBe('b')
    expect(result.failed[0].error).toContain('Cyclic dependency')
  })
})
