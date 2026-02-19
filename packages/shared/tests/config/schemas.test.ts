import type { TinkeriseUserConfig } from '../../src/index'
import { describe, expect, it } from 'vitest'
import {
  defineConfig,
  PresetDataSchema,
  TinkeriseUserConfigSchema,
} from '../../src/index'

describe('tinkeriseUserConfigSchema', () => {
  it('parses a valid full config', () => {
    const config = TinkeriseUserConfigSchema.parse({
      packageManager: 'pnpm',
      typescript: true,
      defaultCategory: 'web',
    })

    expect(config.packageManager).toBe('pnpm')
    expect(config.typescript).toBe(true)
    expect(config.defaultCategory).toBe('web')
  })

  it('parses a valid partial config (single field)', () => {
    const config = TinkeriseUserConfigSchema.parse({ typescript: false })

    expect(config.typescript).toBe(false)
    expect(config.packageManager).toBeUndefined()
    expect(config.defaultCategory).toBeUndefined()
  })

  it('parses an empty object (all fields optional)', () => {
    const config = TinkeriseUserConfigSchema.parse({})
    expect(config).toEqual({})
  })

  it('rejects invalid packageManager value', () => {
    expect(() =>
      TinkeriseUserConfigSchema.parse({ packageManager: 'deno' }),
    ).toThrow()
  })

  it('rejects invalid defaultCategory value', () => {
    expect(() =>
      TinkeriseUserConfigSchema.parse({ defaultCategory: 'desktop' }),
    ).toThrow()
  })

  it('strips extra unknown fields', () => {
    const config = TinkeriseUserConfigSchema.parse({
      packageManager: 'bun',
      unknownField: 'should be stripped',
    })

    expect(config.packageManager).toBe('bun')
    expect((config as Record<string, unknown>).unknownField).toBeUndefined()
  })
})

describe('presetDataSchema', () => {
  const validPreset = {
    version: 1 as const,
    name: 'my-preset',
    description: 'A test preset',
    scaffold: {
      framework: 'next',
      category: 'web',
      flags: { typescript: true, tailwind: 'yes' },
    },
    enhancements: ['eslint', 'prettier'],
    config: { packageManager: 'pnpm' as const },
  }

  it('parses a valid preset', () => {
    const preset = PresetDataSchema.parse(validPreset)

    expect(preset.version).toBe(1)
    expect(preset.name).toBe('my-preset')
    expect(preset.scaffold.framework).toBe('next')
    expect(preset.scaffold.flags.typescript).toBe(true)
    expect(preset.enhancements).toEqual(['eslint', 'prettier'])
    expect(preset.config.packageManager).toBe('pnpm')
  })

  it('rejects wrong version number', () => {
    expect(() =>
      PresetDataSchema.parse({ ...validPreset, version: 2 }),
    ).toThrow()
  })

  it('parses preset without optional description', () => {
    const { description: _, ...noDesc } = validPreset
    const preset = PresetDataSchema.parse(noDesc)
    expect(preset.description).toBeUndefined()
  })

  it('parses preset with empty enhancements array', () => {
    const preset = PresetDataSchema.parse({
      ...validPreset,
      enhancements: [],
    })
    expect(preset.enhancements).toEqual([])
  })

  it('rejects preset with invalid config inside', () => {
    expect(() =>
      PresetDataSchema.parse({
        ...validPreset,
        config: { packageManager: 'deno' },
      }),
    ).toThrow()
  })
})

describe('defineConfig()', () => {
  it('returns the same object passed in (identity function)', () => {
    const input: TinkeriseUserConfig = { packageManager: 'bun', typescript: true }
    const result = defineConfig(input)
    expect(result).toBe(input)
  })

  it('accepts empty config', () => {
    const result = defineConfig({})
    expect(result).toEqual({})
  })

  it('provides type narrowing for all config keys', () => {
    const config = defineConfig({
      packageManager: 'yarn',
      typescript: false,
      defaultCategory: 'backend',
    })

    expect(config.packageManager).toBe('yarn')
    expect(config.typescript).toBe(false)
    expect(config.defaultCategory).toBe('backend')
  })
})
