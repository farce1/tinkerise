import { readFile, rm, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PresetData } from '@tinkerise/shared'
import {
  deletePreset,
  getPresetsDir,
  listPresets,
  loadPreset,
  savePreset,
} from '../../src/config/preset'

let tmpDir: string

const validPreset: PresetData = {
  version: 1,
  name: 'my-react-starter',
  description: 'React + TypeScript + Tailwind',
  scaffold: {
    framework: 'vite',
    category: 'web',
    flags: { typescript: true, tailwind: 'yes' },
  },
  enhancements: ['eslint', 'prettier', 'husky'],
  config: { packageManager: 'pnpm', typescript: true },
}

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `tinkerise-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(tmpDir, { recursive: true })
  vi.stubEnv('XDG_CONFIG_HOME', tmpDir)
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(tmpDir, { recursive: true, force: true })
})

describe('savePreset()', () => {
  it('writes valid JSON to correct path', async () => {
    await savePreset(validPreset)

    const filePath = path.join(getPresetsDir(), 'my-react-starter.json')
    const raw = await readFile(filePath, 'utf-8')
    const data = JSON.parse(raw)
    expect(data.name).toBe('my-react-starter')
    expect(data.version).toBe(1)
    expect(data.scaffold.framework).toBe('vite')
    expect(data.enhancements).toEqual(['eslint', 'prettier', 'husky'])
  })

  it('rejects invalid preset data (bad version number)', async () => {
    const invalid = { ...validPreset, version: 2 }
    await expect(savePreset(invalid as unknown as PresetData)).rejects.toThrow()
  })
})

describe('loadPreset()', () => {
  it('reads back saved preset correctly', async () => {
    await savePreset(validPreset)

    const loaded = await loadPreset('my-react-starter')
    expect(loaded).toEqual(validPreset)
  })

  it('returns null for nonexistent preset', async () => {
    const result = await loadPreset('does-not-exist')
    expect(result).toBeNull()
  })

  it('returns null for invalid JSON file', async () => {
    const presetsDir = getPresetsDir()
    await mkdir(presetsDir, { recursive: true })
    await writeFile(path.join(presetsDir, 'bad.json'), 'not-json{{{', 'utf-8')

    const result = await loadPreset('bad')
    expect(result).toBeNull()
  })
})

describe('listPresets()', () => {
  it('returns saved preset names', async () => {
    await savePreset(validPreset)
    await savePreset({ ...validPreset, name: 'another-preset' })

    const names = await listPresets()
    expect(names).toContain('my-react-starter')
    expect(names).toContain('another-preset')
    expect(names).toHaveLength(2)
  })

  it('returns empty array when no presets exist', async () => {
    const names = await listPresets()
    expect(names).toEqual([])
  })
})

describe('deletePreset()', () => {
  it('removes preset file and returns true', async () => {
    await savePreset(validPreset)

    const result = await deletePreset('my-react-starter')
    expect(result).toBe(true)

    // Verify file is gone
    const loaded = await loadPreset('my-react-starter')
    expect(loaded).toBeNull()
  })

  it('returns false for nonexistent preset', async () => {
    const result = await deletePreset('nonexistent')
    expect(result).toBe(false)
  })
})
