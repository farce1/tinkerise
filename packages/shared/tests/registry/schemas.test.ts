import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import {
  defineScaffolder,
  FlagMappingSchema,
  IntegrationStrategySchema,
  PrerequisiteSchema,
  ScaffolderEntrySchema,
  VersionedFlagMapSchema,
} from '../../src/index'

/** Minimal valid scaffolder entry for reuse in tests */
function validEntry(overrides: Record<string, unknown> = {}) {
  return {
    name: 'test-scaffolder',
    category: 'web' as const,
    command: 'npx',
    packageName: 'create-test',
    integration: { type: 'delegate' as const, command: 'create-test' },
    ...overrides,
  }
}

describe('scaffolderEntrySchema', () => {
  it('parses a valid complete entry', () => {
    const entry = ScaffolderEntrySchema.parse({
      name: 'next',
      category: 'web',
      command: 'npx',
      packageName: 'create-next-app',
      integration: { type: 'delegate', command: 'create-next-app' },
      prerequisites: [{ command: 'node', versionRange: '>=18.17.0' }],
      flags: [{ unified: 'typescript', native: '--typescript' }],
      versionedFlags: [{ versionRange: '>=15.0.0', flags: [{ unified: 'typescript', native: '--ts' }] }],
      passthroughArgs: true,
    })

    expect(entry.name).toBe('next')
    expect(entry.category).toBe('web')
    expect(entry.prerequisites).toHaveLength(1)
    expect(entry.flags).toHaveLength(1)
    expect(entry.versionedFlags).toHaveLength(1)
  })

  it('parses a minimal entry with defaults applied', () => {
    const entry = ScaffolderEntrySchema.parse(validEntry())

    expect(entry.prerequisites).toEqual([])
    expect(entry.flags).toEqual([])
    expect(entry.passthroughArgs).toBe(true)
    expect(entry.versionedFlags).toBeUndefined()
  })

  it('rejects missing required fields', () => {
    expect(() => ScaffolderEntrySchema.parse({})).toThrow()
    expect(() => ScaffolderEntrySchema.parse({ name: 'x' })).toThrow()
  })

  it('rejects invalid category value', () => {
    expect(() => ScaffolderEntrySchema.parse(validEntry({ category: 'invalid' }))).toThrow()
  })

  it('rejects invalid integration type discriminator', () => {
    expect(() => ScaffolderEntrySchema.parse(
      validEntry({ integration: { type: 'unknown', command: 'x' } }),
    )).toThrow()
  })
})

describe('flagMappingSchema', () => {
  it('parses valid flag mapping with all fields', () => {
    const flag = FlagMappingSchema.parse({
      unified: 'typescript',
      native: '--typescript',
      nativeDisable: '--no-typescript',
      valueMap: { pnpm: 'pnpm', yarn: 'yarn' },
    })

    expect(flag.unified).toBe('typescript')
    expect(flag.nativeDisable).toBe('--no-typescript')
    expect(flag.valueMap).toEqual({ pnpm: 'pnpm', yarn: 'yarn' })
  })

  it('parses minimal flag mapping (unified + native only)', () => {
    const flag = FlagMappingSchema.parse({ unified: 'ts', native: '--ts' })

    expect(flag.unified).toBe('ts')
    expect(flag.native).toBe('--ts')
    expect(flag.nativeDisable).toBeUndefined()
    expect(flag.valueMap).toBeUndefined()
  })

  it('rejects missing unified or native', () => {
    expect(() => FlagMappingSchema.parse({ unified: 'ts' })).toThrow()
    expect(() => FlagMappingSchema.parse({ native: '--ts' })).toThrow()
  })
})

describe('prerequisiteSchema', () => {
  it('parses complete prerequisite with installInstructions', () => {
    const prereq = PrerequisiteSchema.parse({
      command: 'node',
      versionFlag: '--version',
      versionRange: '>=20.11.0',
      installInstructions: { darwin: 'brew install node' },
    })

    expect(prereq.command).toBe('node')
    expect(prereq.installInstructions?.darwin).toBe('brew install node')
  })

  it('applies default versionFlag', () => {
    const prereq = PrerequisiteSchema.parse({ command: 'go' })
    expect(prereq.versionFlag).toBe('--version')
  })

  it('parses without optional fields', () => {
    const prereq = PrerequisiteSchema.parse({ command: 'python3' })
    expect(prereq.versionRange).toBeUndefined()
    expect(prereq.installInstructions).toBeUndefined()
  })
})

describe('integrationStrategySchema', () => {
  it('parses delegate variant', () => {
    const strategy = IntegrationStrategySchema.parse({ type: 'delegate', command: 'create-next-app' })
    expect(strategy.type).toBe('delegate')
  })

  it('parses wrap variant', () => {
    const strategy = IntegrationStrategySchema.parse({ type: 'wrap', command: 'create-vite' })
    expect(strategy.type).toBe('wrap')
  })

  it('parses template variant', () => {
    const strategy = IntegrationStrategySchema.parse({ type: 'template', templateDir: './templates/mcp' })
    expect(strategy.type).toBe('template')
  })

  it('rejects unknown type discriminator', () => {
    expect(() => IntegrationStrategySchema.parse({ type: 'unknown', command: 'x' })).toThrow()
  })
})

describe('versionedFlagMapSchema', () => {
  it('parses valid versioned flag map', () => {
    const vfm = VersionedFlagMapSchema.parse({
      versionRange: '>=15.0.0',
      flags: [{ unified: 'typescript', native: '--ts' }],
    })

    expect(vfm.versionRange).toBe('>=15.0.0')
    expect(vfm.flags).toHaveLength(1)
  })
})

describe('defineScaffolder()', () => {
  it('returns validated entry for valid input', () => {
    const entry = defineScaffolder(validEntry())
    expect(entry.name).toBe('test-scaffolder')
  })

  it('throws ZodError for invalid input', () => {
    expect(() => defineScaffolder({} as never)).toThrow(ZodError)
  })

  it('applies defaults (prerequisites, flags, passthroughArgs)', () => {
    const entry = defineScaffolder(validEntry())
    expect(entry.prerequisites).toEqual([])
    expect(entry.flags).toEqual([])
    expect(entry.passthroughArgs).toBe(true)
  })
})
