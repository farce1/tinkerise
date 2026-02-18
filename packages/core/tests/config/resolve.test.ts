import { describe, expect, it, vi } from 'vitest'
import { resolveConfig } from '../../src/config/resolve'
import type { TinkeriseUserConfig } from '@tinkerise/shared'

// Mock the config loaders so we can control inputs deterministically
vi.mock('../../src/config/global', () => ({
  loadGlobalConfig: vi.fn(),
}))

vi.mock('../../src/config/project', () => ({
  loadProjectConfig: vi.fn(),
}))

// Import mocked modules
const { loadGlobalConfig } = await import('../../src/config/global')
const { loadProjectConfig } = await import('../../src/config/project')

const mockLoadGlobal = vi.mocked(loadGlobalConfig)
const mockLoadProject = vi.mocked(loadProjectConfig)

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

  it('CLI flags override everything', async () => {
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
})
