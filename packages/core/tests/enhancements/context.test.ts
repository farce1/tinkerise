import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock node:fs/promises for package.json reads
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
}))

// Mock PM detection
vi.mock('../../src/pm/detect.js', () => ({
  detectPackageManager: vi.fn(),
}))

// Mock framework detection
vi.mock('../../src/enhancements/framework-detect.js', () => ({
  detectFramework: vi.fn(),
}))

const { readFile } = await import('node:fs/promises')
const { detectPackageManager } = await import('../../src/pm/detect.js')
const { detectFramework } = await import(
  '../../src/enhancements/framework-detect.js',
)
const { buildProjectContext } = await import(
  '../../src/enhancements/context.js',
)

const mockedReadFile = vi.mocked(readFile)
const mockedDetectPM = vi.mocked(detectPackageManager)
const mockedDetectFW = vi.mocked(detectFramework)

/** Standard package.json with React */
const samplePkg = {
  name: 'test-project',
  dependencies: {
    'react': '^18.0.0',
    'react-dom': '^18.0.0',
  },
  devDependencies: {
    typescript: '^5.0.0',
    vitest: '^1.0.0',
  },
}

beforeEach(() => {
  vi.resetAllMocks()

  // Default mocks: successful package.json read, npm detected, react detected
  mockedReadFile.mockResolvedValue(JSON.stringify(samplePkg))
  mockedDetectPM.mockResolvedValue({ pm: 'npm', source: 'default' })
  mockedDetectFW.mockResolvedValue({ framework: 'react', ambiguous: [] })
})

describe('buildProjectContext()', () => {
  const rootDir = '/test/project'

  it('builds context with all fields from package.json', async () => {
    const ctx = await buildProjectContext({ rootDir })

    expect(ctx.rootDir).toBe(rootDir)
    expect(ctx.packageManager).toBe('npm')
    expect(ctx.framework).toBe('react')
    expect(ctx.packageJson).toEqual(samplePkg)
    expect(ctx.freshScaffold).toBe(false)
    expect(ctx.verbose).toBe(false)
  })

  it('merges dependencies + devDependencies into installedDeps', async () => {
    const ctx = await buildProjectContext({ rootDir })

    expect(ctx.installedDeps).toEqual({
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      'typescript': '^5.0.0',
      'vitest': '^1.0.0',
    })
  })

  it('uses provided packageManager override, skips detection', async () => {
    const ctx = await buildProjectContext({
      rootDir,
      packageManager: 'pnpm',
    })

    expect(ctx.packageManager).toBe('pnpm')
    expect(mockedDetectPM).not.toHaveBeenCalled()
  })

  it('uses provided framework override, skips detection', async () => {
    const ctx = await buildProjectContext({
      rootDir,
      framework: 'next',
    })

    expect(ctx.framework).toBe('next')
    expect(mockedDetectFW).not.toHaveBeenCalled()
  })

  it('freshScaffold defaults to false', async () => {
    const ctx = await buildProjectContext({ rootDir })
    expect(ctx.freshScaffold).toBe(false)
  })

  it('freshScaffold can be set to true', async () => {
    const ctx = await buildProjectContext({
      rootDir,
      freshScaffold: true,
    })
    expect(ctx.freshScaffold).toBe(true)
  })

  it('verbose defaults to false', async () => {
    const ctx = await buildProjectContext({ rootDir })
    expect(ctx.verbose).toBe(false)
  })

  it('verbose can be set to true', async () => {
    const ctx = await buildProjectContext({
      rootDir,
      verbose: true,
    })
    expect(ctx.verbose).toBe(true)
  })

  it('throws error when package.json is missing (ENOENT)', async () => {
    const err = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException
    err.code = 'ENOENT'
    mockedReadFile.mockRejectedValue(err)

    await expect(buildProjectContext({ rootDir })).rejects.toThrow(
      /No package\.json found/,
    )
  })

  it('rethrows non-ENOENT errors from readFile', async () => {
    const err = new Error('EACCES: permission denied') as NodeJS.ErrnoException
    err.code = 'EACCES'
    mockedReadFile.mockRejectedValue(err)

    await expect(buildProjectContext({ rootDir })).rejects.toThrow('EACCES')
  })

  it('handles package.json with no dependencies fields gracefully', async () => {
    const minimalPkg = { name: 'empty-project' }
    mockedReadFile.mockResolvedValue(JSON.stringify(minimalPkg))
    mockedDetectFW.mockResolvedValue({ framework: null, ambiguous: [] })

    const ctx = await buildProjectContext({ rootDir })

    expect(ctx.installedDeps).toEqual({})
    expect(ctx.packageJson).toEqual(minimalPkg)
  })

  it('calls onAmbiguousFramework when detectFramework returns ambiguous array', async () => {
    mockedDetectFW.mockResolvedValue({
      framework: null,
      ambiguous: ['vue', 'react'],
    })
    const onAmbiguous = vi.fn().mockResolvedValue('vue')

    const ctx = await buildProjectContext({
      rootDir,
      onAmbiguousFramework: onAmbiguous,
    })

    expect(onAmbiguous).toHaveBeenCalledWith(['vue', 'react'])
    expect(ctx.framework).toBe('vue')
  })

  it('sets framework to null when ambiguous and no onAmbiguousFramework callback', async () => {
    mockedDetectFW.mockResolvedValue({
      framework: null,
      ambiguous: ['vue', 'react'],
    })

    const ctx = await buildProjectContext({ rootDir })

    expect(ctx.framework).toBeNull()
  })

  it('passes installedDeps to detectFramework', async () => {
    await buildProjectContext({ rootDir })

    expect(mockedDetectFW).toHaveBeenCalledWith(
      rootDir,
      {
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        'typescript': '^5.0.0',
        'vitest': '^1.0.0',
      },
      samplePkg,
    )
  })

  it('passes rootDir to detectPackageManager', async () => {
    await buildProjectContext({ rootDir })

    expect(mockedDetectPM).toHaveBeenCalledWith(rootDir)
  })
})
