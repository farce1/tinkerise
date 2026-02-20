import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONFIG_FILENAME, loadProjectConfig } from '../../src/config/project'

let tmpDir: string

beforeEach(async () => {
  tmpDir = path.join(
    os.tmpdir(),
    `tinkerise-project-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  await mkdir(tmpDir, { recursive: true })
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

describe('cONFIG_FILENAME', () => {
  it('is tinkerise.config.ts', () => {
    expect(CONFIG_FILENAME).toBe('tinkerise.config.ts')
  })
})

describe('loadProjectConfig()', () => {
  it('loads a valid tinkerise.config.ts with all fields', async () => {
    const configContent = `
export default {
  packageManager: 'pnpm',
  typescript: true,
  defaultCategory: 'web',
}
`
    await writeFile(path.join(tmpDir, CONFIG_FILENAME), configContent, 'utf-8')

    const config = await loadProjectConfig(tmpDir)

    expect(config).toEqual({
      packageManager: 'pnpm',
      typescript: true,
      defaultCategory: 'web',
    })
  })

  it('loads a config with partial values', async () => {
    const configContent = `
export default {
  packageManager: 'yarn',
}
`
    await writeFile(path.join(tmpDir, CONFIG_FILENAME), configContent, 'utf-8')

    const config = await loadProjectConfig(tmpDir)

    expect(config).toEqual({ packageManager: 'yarn' })
  })

  it('returns null when file does not exist', async () => {
    const config = await loadProjectConfig(tmpDir)

    expect(config).toBeNull()
  })

  it('returns null for nonexistent directory', async () => {
    const config = await loadProjectConfig(path.join(tmpDir, 'nonexistent'))

    expect(config).toBeNull()
  })

  it('returns null when file has no default export', async () => {
    const configContent = `
export const config = { packageManager: 'pnpm' }
`
    await writeFile(path.join(tmpDir, CONFIG_FILENAME), configContent, 'utf-8')

    const config = await loadProjectConfig(tmpDir)

    expect(config).toBeNull()
  })

  it('returns null on invalid config values', async () => {
    const configContent = `
export default {
  packageManager: 'deno',
}
`
    await writeFile(path.join(tmpDir, CONFIG_FILENAME), configContent, 'utf-8')

    const config = await loadProjectConfig(tmpDir)

    expect(config).toBeNull()
  })

  it('returns null on non-object default export', async () => {
    const configContent = `
export default 'not an object'
`
    await writeFile(path.join(tmpDir, CONFIG_FILENAME), configContent, 'utf-8')

    const config = await loadProjectConfig(tmpDir)

    expect(config).toBeNull()
  })
})
