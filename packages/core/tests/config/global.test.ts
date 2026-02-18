import { readFile, rm, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getConfigDir,
  getConfigPath,
  getGlobalConfigValue,
  loadGlobalConfig,
  saveGlobalConfig,
  setGlobalConfigValue,
} from '../../src/config/global'

let tmpDir: string

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `tinkerise-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(tmpDir, { recursive: true })
  vi.stubEnv('XDG_CONFIG_HOME', tmpDir)
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(tmpDir, { recursive: true, force: true })
})

describe('getConfigDir()', () => {
  it('returns XDG_CONFIG_HOME/tinkerise when env is set', () => {
    expect(getConfigDir()).toBe(path.join(tmpDir, 'tinkerise'))
  })

  it('returns ~/.config/tinkerise when XDG_CONFIG_HOME is unset', () => {
    vi.stubEnv('XDG_CONFIG_HOME', '')
    expect(getConfigDir()).toBe(path.join(os.homedir(), '.config', 'tinkerise'))
  })
})

describe('getConfigPath()', () => {
  it('returns config.json inside config dir', () => {
    expect(getConfigPath()).toBe(path.join(tmpDir, 'tinkerise', 'config.json'))
  })
})

describe('saveGlobalConfig()', () => {
  it('writes valid JSON file', async () => {
    await saveGlobalConfig({ packageManager: 'pnpm', typescript: true })

    const raw = await readFile(getConfigPath(), 'utf-8')
    const data = JSON.parse(raw)
    expect(data.packageManager).toBe('pnpm')
    expect(data.typescript).toBe(true)
  })

  it('creates directory if not exists', async () => {
    // Remove the temp dir to confirm saveGlobalConfig creates it
    await rm(tmpDir, { recursive: true, force: true })

    await saveGlobalConfig({ defaultCategory: 'web' })

    const raw = await readFile(getConfigPath(), 'utf-8')
    expect(JSON.parse(raw).defaultCategory).toBe('web')
  })

  it('writes pretty-printed JSON with trailing newline', async () => {
    await saveGlobalConfig({ typescript: false })

    const raw = await readFile(getConfigPath(), 'utf-8')
    expect(raw).toContain('\n')
    expect(raw.endsWith('\n')).toBe(true)
    // 2-space indentation check
    expect(raw).toContain('  "typescript"')
  })
})

describe('loadGlobalConfig()', () => {
  it('reads saved config correctly', async () => {
    await saveGlobalConfig({ packageManager: 'yarn', defaultCategory: 'backend' })

    const config = await loadGlobalConfig()
    expect(config).toEqual({ packageManager: 'yarn', defaultCategory: 'backend' })
  })

  it('returns null when file does not exist', async () => {
    const config = await loadGlobalConfig()
    expect(config).toBeNull()
  })

  it('returns null on invalid JSON', async () => {
    const configDir = getConfigDir()
    await mkdir(configDir, { recursive: true })
    await writeFile(getConfigPath(), 'not-json{{{', 'utf-8')

    const config = await loadGlobalConfig()
    expect(config).toBeNull()
  })

  it('returns null on invalid config values', async () => {
    const configDir = getConfigDir()
    await mkdir(configDir, { recursive: true })
    await writeFile(getConfigPath(), JSON.stringify({ packageManager: 'deno' }), 'utf-8')

    const config = await loadGlobalConfig()
    expect(config).toBeNull()
  })
})

describe('setGlobalConfigValue()', () => {
  it('updates a single key', async () => {
    await saveGlobalConfig({ packageManager: 'npm' })

    await setGlobalConfigValue('typescript', true)

    const config = await loadGlobalConfig()
    expect(config?.packageManager).toBe('npm')
    expect(config?.typescript).toBe(true)
  })

  it('creates config if none exists', async () => {
    await setGlobalConfigValue('defaultCategory', 'mobile')

    const config = await loadGlobalConfig()
    expect(config?.defaultCategory).toBe('mobile')
  })
})

describe('getGlobalConfigValue()', () => {
  it('returns value for existing key', async () => {
    await saveGlobalConfig({ packageManager: 'bun' })

    const value = await getGlobalConfigValue('packageManager')
    expect(value).toBe('bun')
  })

  it('returns undefined for missing key', async () => {
    await saveGlobalConfig({ packageManager: 'npm' })

    const value = await getGlobalConfigValue('typescript')
    expect(value).toBeUndefined()
  })

  it('returns undefined when no config file exists', async () => {
    const value = await getGlobalConfigValue('packageManager')
    expect(value).toBeUndefined()
  })
})
