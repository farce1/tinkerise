import type { TinkeriseUserConfig } from '@tinkerise/shared'
import { describe, expect, it, vi } from 'vitest'
import { resolveConfig } from '../../src/config/resolve'

// Mock the config loaders so we can control inputs deterministically
vi.mock('../../src/config/global', () => ({
  loadGlobalConfig: vi.fn(),
}))

vi.mock('../../src/config/project', () => ({
  loadProjectConfig: vi.fn(),
}))

vi.mock('../../src/config/preset', () => ({
  loadPreset: vi.fn(),
}))

// Import mocked modules
const { loadGlobalConfig } = await import('../../src/config/global')
const { loadProjectConfig } = await import('../../src/config/project')
const { loadPreset } = await import('../../src/config/preset')

const mockLoadGlobal = vi.mocked(loadGlobalConfig)
const mockLoadProject = vi.mocked(loadProjectConfig)
const mockLoadPreset = vi.mocked(loadPreset)

describe('resolveConfig()', () => {
  it('returns empty object when no config sources exist', async () => {
    mockLoadGlobal.mockResolvedValue(null)
    mockLoadProject.mockResolvedValue(null)

    const result = await resolveConfig()

    expect(result).toEqual({})
  })

  it('returns global config when only global exists', async () => {
    mockLoadGlobal.mockResolvedValue({ packageManager: 'npm', typescript: false })
    mockLoadProject.mockResolvedValue(null)

    const result = await resolveConfig()

    expect(result).toEqual({ packageManager: 'npm', typescript: false })
  })

  it('project config overrides global config', async () => {
    mockLoadGlobal.mockResolvedValue({ packageManager: 'npm', typescript: false })
    mockLoadProject.mockResolvedValue({ packageManager: 'pnpm' })

    const result = await resolveConfig()

    expect(result).toEqual({ packageManager: 'pnpm', typescript: false })
  })

  it('cLI flags override everything', async () => {
    mockLoadGlobal.mockResolvedValue({
      packageManager: 'npm',
      typescript: false,
      defaultCategory: 'web',
    })
    mockLoadProject.mockResolvedValue({
      packageManager: 'pnpm',
      typescript: true,
    })

    const cliFlags: Partial<TinkeriseUserConfig> = { packageManager: 'bun' }

    const result = await resolveConfig({ cliFlags })

    expect(result).toEqual({
      packageManager: 'bun',
      typescript: true,
      defaultCategory: 'web',
    })
  })

  it('merges all three layers correctly', async () => {
    mockLoadGlobal.mockResolvedValue({
      packageManager: 'npm',
      defaultCategory: 'web',
    })
    mockLoadProject.mockResolvedValue({
      typescript: true,
      defaultCategory: 'backend',
    })

    const cliFlags: Partial<TinkeriseUserConfig> = { defaultCategory: 'mobile' }

    const result = await resolveConfig({ cliFlags })

    expect(result).toEqual({
      packageManager: 'npm',
      typescript: true,
      defaultCategory: 'mobile',
    })
  })

  it('passes projectDir option to loadProjectConfig', async () => {
    mockLoadGlobal.mockResolvedValue(null)
    mockLoadProject.mockResolvedValue(null)

    await resolveConfig({ projectDir: '/custom/path' })

    expect(mockLoadProject).toHaveBeenCalledWith('/custom/path')
  })

  it('uses process.cwd() when projectDir not specified', async () => {
    mockLoadGlobal.mockResolvedValue(null)
    mockLoadProject.mockResolvedValue(null)

    await resolveConfig()

    expect(mockLoadProject).toHaveBeenCalledWith(process.cwd())
  })

  it('handles only CLI flags with no config files', async () => {
    mockLoadGlobal.mockResolvedValue(null)
    mockLoadProject.mockResolvedValue(null)

    const result = await resolveConfig({
      cliFlags: { typescript: true, packageManager: 'yarn' },
    })

    expect(result).toEqual({ typescript: true, packageManager: 'yarn' })
  })

  it('preset config is lowest priority (global overrides preset)', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'test-preset',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: [],
      config: { packageManager: 'npm', typescript: true },
    })
    mockLoadGlobal.mockResolvedValue({ packageManager: 'pnpm' })
    mockLoadProject.mockResolvedValue(null)

    const result = await resolveConfig({ presetName: 'test-preset' })

    // Global overrides preset's packageManager, preset's typescript survives
    expect(result).toEqual({ packageManager: 'pnpm', typescript: true })
  })

  it('cLI flags override all including preset', async () => {
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'test-preset',
      scaffold: { framework: 'vite', category: 'web', flags: {} },
      enhancements: [],
      config: { packageManager: 'npm', typescript: false, defaultCategory: 'web' },
    })
    mockLoadGlobal.mockResolvedValue({ packageManager: 'pnpm' })
    mockLoadProject.mockResolvedValue({ typescript: true })

    const cliFlags: Partial<TinkeriseUserConfig> = { packageManager: 'bun' }

    const result = await resolveConfig({ presetName: 'test-preset', cliFlags })

    // CLI > project > global > preset
    expect(result).toEqual({
      packageManager: 'bun',
      typescript: true,
      defaultCategory: 'web',
    })
  })

  it('skips project config when includeProjectConfig is false', async () => {
    mockLoadProject.mockClear()
    mockLoadPreset.mockResolvedValue({
      version: 1,
      name: 'test-preset',
      scaffold: { framework: 'next', category: 'web', flags: {} },
      enhancements: [],
      config: { typescript: false },
    })
    mockLoadGlobal.mockResolvedValue({ packageManager: 'pnpm' })

    const result = await resolveConfig({
      presetName: 'test-preset',
      includeProjectConfig: false,
      cliFlags: { typescript: true },
    })

    expect(mockLoadProject).not.toHaveBeenCalled()
    expect(result).toEqual({ packageManager: 'pnpm', typescript: true })
  })

  it('preset name that does not exist is silently ignored', async () => {
    mockLoadPreset.mockResolvedValue(null)
    mockLoadGlobal.mockResolvedValue({ packageManager: 'npm' })
    mockLoadProject.mockResolvedValue(null)

    const result = await resolveConfig({ presetName: 'nonexistent' })

    // Should behave as if no preset was provided
    expect(result).toEqual({ packageManager: 'npm' })
    expect(mockLoadPreset).toHaveBeenCalledWith('nonexistent')
  })
})
