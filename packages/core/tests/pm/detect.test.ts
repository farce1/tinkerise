import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock verify module to control binary-exists behavior
vi.mock('../../src/pm/verify.js', () => ({
  verifyPmBinary: vi.fn(),
}))

const { verifyPmBinary } = await import('../../src/pm/verify.js')
const {
  detectFromLockfile,
  detectFromPackageJson,
  detectPackageManager,
} = await import('../../src/pm/detect')

const mockedVerify = vi.mocked(verifyPmBinary)

let tempDir: string

beforeEach(async () => {
  tempDir = join(tmpdir(), `tinkerise-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(tempDir, { recursive: true })
  mockedVerify.mockReset()
  mockedVerify.mockResolvedValue(true) // Default: binary exists
})

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true })
})

describe('detectFromLockfile()', () => {
  it('returns pnpm when pnpm-lock.yaml exists', async () => {
    await writeFile(join(tempDir, 'pnpm-lock.yaml'), '')
    expect(await detectFromLockfile(tempDir)).toBe('pnpm')
  })

  it('returns bun when bun.lockb exists', async () => {
    await writeFile(join(tempDir, 'bun.lockb'), '')
    expect(await detectFromLockfile(tempDir)).toBe('bun')
  })

  it('returns bun when bun.lock exists (not bun.lockb)', async () => {
    await writeFile(join(tempDir, 'bun.lock'), '')
    expect(await detectFromLockfile(tempDir)).toBe('bun')
  })

  it('returns yarn when yarn.lock exists', async () => {
    await writeFile(join(tempDir, 'yarn.lock'), '')
    expect(await detectFromLockfile(tempDir)).toBe('yarn')
  })

  it('returns npm when package-lock.json exists', async () => {
    await writeFile(join(tempDir, 'package-lock.json'), '')
    expect(await detectFromLockfile(tempDir)).toBe('npm')
  })

  it('returns null when no lockfile exists', async () => {
    expect(await detectFromLockfile(tempDir)).toBeNull()
  })

  it('returns highest-precedence PM when multiple lockfiles exist (pnpm > bun > yarn > npm)', async () => {
    // Create all lockfiles — pnpm should win
    await writeFile(join(tempDir, 'pnpm-lock.yaml'), '')
    await writeFile(join(tempDir, 'bun.lockb'), '')
    await writeFile(join(tempDir, 'yarn.lock'), '')
    await writeFile(join(tempDir, 'package-lock.json'), '')

    expect(await detectFromLockfile(tempDir)).toBe('pnpm')
  })

  it('returns bun over yarn and npm when multiple lockfiles exist', async () => {
    await writeFile(join(tempDir, 'bun.lockb'), '')
    await writeFile(join(tempDir, 'yarn.lock'), '')
    await writeFile(join(tempDir, 'package-lock.json'), '')

    expect(await detectFromLockfile(tempDir)).toBe('bun')
  })
})

describe('detectFromPackageJson()', () => {
  it('returns pnpm for packageManager: "pnpm@8.15.0"', async () => {
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ packageManager: 'pnpm@8.15.0' }))
    expect(await detectFromPackageJson(tempDir)).toBe('pnpm')
  })

  it('returns npm for packageManager: "npm@10.2.0"', async () => {
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ packageManager: 'npm@10.2.0' }))
    expect(await detectFromPackageJson(tempDir)).toBe('npm')
  })

  it('returns bun for packageManager: "bun@1.0.0"', async () => {
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ packageManager: 'bun@1.0.0' }))
    expect(await detectFromPackageJson(tempDir)).toBe('bun')
  })

  it('returns yarn for packageManager: "yarn@4.0.0"', async () => {
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.0.0' }))
    expect(await detectFromPackageJson(tempDir)).toBe('yarn')
  })

  it('returns null when no package.json exists', async () => {
    expect(await detectFromPackageJson(tempDir)).toBeNull()
  })

  it('returns null when package.json has no packageManager field', async () => {
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ name: 'test' }))
    expect(await detectFromPackageJson(tempDir)).toBeNull()
  })

  it('returns null when packageManager value is not a valid PM name', async () => {
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ packageManager: 'unknown@1.0.0' }))
    expect(await detectFromPackageJson(tempDir)).toBeNull()
  })

  it('returns null for invalid JSON', async () => {
    await writeFile(join(tempDir, 'package.json'), '{not valid json')
    expect(await detectFromPackageJson(tempDir)).toBeNull()
  })
})

describe('detectPackageManager() — full pipeline', () => {
  it('flag takes precedence over lockfile', async () => {
    await writeFile(join(tempDir, 'pnpm-lock.yaml'), '')
    const result = await detectPackageManager(tempDir, 'bun')
    expect(result).toEqual({ pm: 'bun', source: 'flag' })
  })

  it('lockfile takes precedence over packageManager field', async () => {
    await writeFile(join(tempDir, 'pnpm-lock.yaml'), '')
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ packageManager: 'npm@10.0.0' }))

    const result = await detectPackageManager(tempDir)
    expect(result).toEqual({ pm: 'pnpm', source: 'lockfile' })
  })

  it('falls back to packageManager field when no lockfile', async () => {
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.0.0' }))

    const result = await detectPackageManager(tempDir)
    expect(result).toEqual({ pm: 'yarn', source: 'packageManager-field' })
  })

  it('falls back to default npm when nothing found', async () => {
    const result = await detectPackageManager(tempDir)
    expect(result).toEqual({ pm: 'npm', source: 'default' })
  })

  it('returns binary-missing when lockfile PM binary not installed', async () => {
    await writeFile(join(tempDir, 'pnpm-lock.yaml'), '')
    mockedVerify.mockResolvedValue(false) // Binary not found

    const result = await detectPackageManager(tempDir)
    expect(result).toEqual({ pm: 'pnpm', source: 'binary-missing' })
  })

  it('returns binary-missing when packageManager field PM binary not installed', async () => {
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.0.0' }))
    mockedVerify.mockResolvedValue(false)

    const result = await detectPackageManager(tempDir)
    expect(result).toEqual({ pm: 'yarn', source: 'binary-missing' })
  })

  it('invalid flag value is ignored (falls through to detection)', async () => {
    const result = await detectPackageManager(tempDir, 'invalid-pm')
    expect(result).toEqual({ pm: 'npm', source: 'default' })
  })

  it('undefined flag value is ignored', async () => {
    const result = await detectPackageManager(tempDir, undefined)
    expect(result).toEqual({ pm: 'npm', source: 'default' })
  })
})
