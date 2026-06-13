import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  DoctorEnvelopeV1Schema,
  ErrorPayloadSchema,
  ListEnvelopeV1Schema,
  makeEnvelope,
  PresetListEnvelopeV1Schema,
  PresetShowEnvelopeV1Schema,
  ScaffoldPlanEnvelopeV1Schema,
} from '../../src/index'

describe('errorPayloadSchema', () => {
  it('parses a valid error payload', () => {
    const payload = ErrorPayloadSchema.parse({
      code: 'PRESET_NOT_FOUND',
      message: 'preset xyz not found',
    })

    expect(payload.code).toBe('PRESET_NOT_FOUND')
    expect(payload.message).toBe('preset xyz not found')
  })

  it('rejects a payload missing message', () => {
    expect(() => ErrorPayloadSchema.parse({ code: 'X' })).toThrow()
  })

  it('rejects a payload missing code', () => {
    expect(() => ErrorPayloadSchema.parse({ message: 'x' })).toThrow()
  })
})

describe('makeEnvelope', () => {
  const schema = makeEnvelope('list', z.object({ x: z.number() }))

  it('accepts the success variant with matching command literal and schemaVersion', () => {
    const result = schema.parse({
      schemaVersion: 1,
      command: 'list',
      data: { x: 1 },
    })

    expect(result).toEqual({ schemaVersion: 1, command: 'list', data: { x: 1 } })
  })

  it('accepts the error variant', () => {
    const result = schema.parse({
      schemaVersion: 1,
      command: 'list',
      error: { code: 'X', message: 'y' },
    })

    expect('error' in result && result.error.code).toBe('X')
  })

  it('rejects the wrong schemaVersion (literal mismatch)', () => {
    const result = schema.safeParse({
      schemaVersion: 2,
      command: 'list',
      data: { x: 1 },
    })

    expect(result.success).toBe(false)
  })

  it('rejects the wrong command literal', () => {
    const result = schema.safeParse({
      schemaVersion: 1,
      command: 'doctor',
      data: { x: 1 },
    })

    expect(result.success).toBe(false)
  })

  it('rejects mixed data + error (mutual exclusion per D-05)', () => {
    const result = schema.safeParse({
      schemaVersion: 1,
      command: 'list',
      data: { x: 1 },
      error: { code: 'X', message: 'y' },
    })

    expect(result.success).toBe(false)
  })

  it('supports overriding schemaVersion', () => {
    const v2Schema = makeEnvelope('list', z.object({ x: z.number() }), 2)

    expect(v2Schema.safeParse({ schemaVersion: 2, command: 'list', data: { x: 1 } }).success).toBe(true)
    expect(v2Schema.safeParse({ schemaVersion: 1, command: 'list', data: { x: 1 } }).success).toBe(false)
  })
})

describe('listEnvelopeV1Schema', () => {
  it('parses a fully-populated payload', () => {
    const result = ListEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'list',
      data: {
        scaffolders: [
          {
            name: 'next',
            category: 'web',
            displayName: 'Next.js',
            description: 'React framework',
            packageName: 'create-next-app',
            prereqOk: true,
            supportedFlags: ['--typescript', '--app'],
          },
        ],
        templates: [
          {
            id: 'cli',
            command: 'tinkerise cli',
            displayName: 'CLI Tool',
            description: 'Scaffold a CLI',
          },
        ],
        enhancements: [
          { id: 'eslint', name: 'ESLint', description: 'Linting' },
        ],
      },
    })

    expect('data' in result && result.data.scaffolders[0]?.name).toBe('next')
  })

  it('accepts empty collections (D-21)', () => {
    const result = ListEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'list',
      data: { scaffolders: [], templates: [], enhancements: [] },
    })

    expect('data' in result && result.data.scaffolders).toEqual([])
  })

  it('accepts scaffolder entries with omitted optional displayName and description (D-22)', () => {
    const result = ListEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'list',
      data: {
        scaffolders: [
          {
            name: 'minimal',
            category: 'utility',
            packageName: 'create-minimal',
            prereqOk: false,
            supportedFlags: [],
          },
        ],
        templates: [],
        enhancements: [],
      },
    })

    const entry = 'data' in result ? result.data.scaffolders[0] : undefined
    expect(entry?.displayName).toBeUndefined()
    expect(entry?.description).toBeUndefined()
  })

  it('accepts the error variant', () => {
    const result = ListEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'list',
      error: { code: 'LIST_FAILED', message: 'boom' },
    })

    expect('error' in result && result.error.code).toBe('LIST_FAILED')
  })

  it('rejects wrong schemaVersion', () => {
    expect(ListEnvelopeV1Schema.safeParse({
      schemaVersion: 2,
      command: 'list',
      data: { scaffolders: [], templates: [], enhancements: [] },
    }).success).toBe(false)
  })

  it('rejects wrong command literal', () => {
    expect(ListEnvelopeV1Schema.safeParse({
      schemaVersion: 1,
      command: 'doctor',
      data: { scaffolders: [], templates: [], enhancements: [] },
    }).success).toBe(false)
  })
})

describe('doctorEnvelopeV1Schema', () => {
  it('parses a payload with mixed passing and failing checks', () => {
    const result = DoctorEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'doctor',
      data: {
        checks: [
          {
            tool: 'Node.js',
            command: 'node',
            category: 'Runtimes',
            required: true,
            versionRange: '>=20.11.0',
            ok: true,
            version: '20.x',
          },
          {
            tool: 'Rust',
            command: 'rustc',
            category: 'Scaffolder Tools',
            required: false,
            ok: false,
            error: 'rustc not found',
            installInstructions: 'curl https://sh.rustup.rs ...',
          },
        ],
        summary: {
          total: 2,
          passed: 1,
          failed: 1,
          requiredFailed: 0,
          optionalFailed: 1,
        },
      },
    })

    expect('data' in result && result.data.summary.optionalFailed).toBe(1)
  })

  it('accepts an empty checks array with zeroed summary (D-21)', () => {
    const result = DoctorEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'doctor',
      data: {
        checks: [],
        summary: { total: 0, passed: 0, failed: 0, requiredFailed: 0, optionalFailed: 0 },
      },
    })

    expect('data' in result && result.data.checks).toEqual([])
  })

  it('rejects a summary missing optionalFailed (D-24 — both required)', () => {
    const result = DoctorEnvelopeV1Schema.safeParse({
      schemaVersion: 1,
      command: 'doctor',
      data: {
        checks: [],
        summary: { total: 0, passed: 0, failed: 0, requiredFailed: 0 },
      },
    })

    expect(result.success).toBe(false)
  })

  it('rejects a summary missing requiredFailed (D-24 — both required)', () => {
    const result = DoctorEnvelopeV1Schema.safeParse({
      schemaVersion: 1,
      command: 'doctor',
      data: {
        checks: [],
        summary: { total: 0, passed: 0, failed: 0, optionalFailed: 0 },
      },
    })

    expect(result.success).toBe(false)
  })

  it('accepts the error variant', () => {
    const result = DoctorEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'doctor',
      error: { code: 'DOCTOR_BOOT_FAILED', message: 'cannot load checks' },
    })

    expect('error' in result && result.error.code).toBe('DOCTOR_BOOT_FAILED')
  })

  it('rejects wrong command literal', () => {
    expect(DoctorEnvelopeV1Schema.safeParse({
      schemaVersion: 1,
      command: 'list',
      data: { checks: [], summary: { total: 0, passed: 0, failed: 0, requiredFailed: 0, optionalFailed: 0 } },
    }).success).toBe(false)
  })
})

describe('presetListEnvelopeV1Schema', () => {
  it('accepts empty local and npm arrays (D-21)', () => {
    const result = PresetListEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'preset.list',
      data: { local: [], npm: [] },
    })

    expect('data' in result && result.data.local).toEqual([])
  })

  it('parses a populated payload with omitted optional description (D-22)', () => {
    const result = PresetListEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'preset.list',
      data: {
        local: [
          { name: 'with-desc', description: 'a preset' },
          { name: 'no-desc' },
        ],
        npm: [{ package: 'tinkerise-preset-foo' }],
      },
    })

    const localEntries = 'data' in result ? result.data.local : []
    expect(localEntries[0]?.description).toBe('a preset')
    expect(localEntries[1]?.description).toBeUndefined()
  })

  it('accepts the error variant', () => {
    const result = PresetListEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'preset.list',
      error: { code: 'PRESET_LIST_FAILED', message: 'fs error' },
    })

    expect('error' in result && result.error.code).toBe('PRESET_LIST_FAILED')
  })

  it('rejects wrong command literal', () => {
    expect(PresetListEnvelopeV1Schema.safeParse({
      schemaVersion: 1,
      command: 'preset',
      data: { local: [], npm: [] },
    }).success).toBe(false)
  })

  it('rejects wrong schemaVersion', () => {
    expect(PresetListEnvelopeV1Schema.safeParse({
      schemaVersion: 0,
      command: 'preset.list',
      data: { local: [], npm: [] },
    }).success).toBe(false)
  })
})

describe('presetShowEnvelopeV1Schema', () => {
  it('parses a local preset with full filePath', () => {
    const result = PresetShowEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'preset.show',
      data: {
        name: 'my-preset',
        description: 'team preset',
        source: 'local',
        filePath: '/Users/me/.tinkerise/presets/my-preset.json',
        scaffold: {
          framework: 'next',
          category: 'web',
          flags: { typescript: true, packageManager: 'pnpm' },
        },
        enhancements: ['eslint', 'prettier'],
        config: { packageManager: 'pnpm', typescript: true },
      },
    })

    expect('data' in result && result.data.source).toBe('local')
  })

  it('parses an npm preset with omitted filePath (D-22)', () => {
    const result = PresetShowEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'preset.show',
      data: {
        name: 'pkg-preset',
        source: 'npm',
        scaffold: {
          framework: 'astro',
          category: 'web',
          flags: {},
        },
        enhancements: [],
        config: {},
      },
    })

    const data = 'data' in result ? result.data : undefined
    expect(data?.source).toBe('npm')
    expect(data?.filePath).toBeUndefined()
    expect(data?.enhancements).toEqual([])
  })

  it('accepts the error variant', () => {
    const result = PresetShowEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'preset.show',
      error: { code: 'PRESET_NOT_FOUND', message: 'foo not found' },
    })

    expect('error' in result && result.error.code).toBe('PRESET_NOT_FOUND')
  })

  it('rejects unknown source value', () => {
    expect(PresetShowEnvelopeV1Schema.safeParse({
      schemaVersion: 1,
      command: 'preset.show',
      data: {
        name: 'x',
        source: 'git',
        scaffold: { framework: 'next', category: 'web', flags: {} },
        enhancements: [],
        config: {},
      },
    }).success).toBe(false)
  })

  it('rejects wrong command literal', () => {
    expect(PresetShowEnvelopeV1Schema.safeParse({
      schemaVersion: 1,
      command: 'preset.list',
      data: {
        name: 'x',
        source: 'local',
        scaffold: { framework: 'next', category: 'web', flags: {} },
        enhancements: [],
        config: {},
      },
    }).success).toBe(false)
  })
})

describe('scaffoldPlanEnvelopeV1Schema', () => {
  const fullData = {
    scaffolderName: 'next',
    command: 'npx',
    args: ['create-next-app@latest', 'my-app', '--typescript'],
    resolvedFlags: [{ unified: 'typescript', native: ['--typescript'] }],
    versionUsed: null,
    upstreamVersion: '15.0.0',
    prerequisites: [{ command: 'node', versionRange: '>=20.11.0' }],
  }

  it('parses a fully-populated plan payload', () => {
    const result = ScaffoldPlanEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'scaffold.plan',
      data: fullData,
    })

    expect('data' in result && result.data.command).toBe('npx')
    expect('data' in result && result.data.resolvedFlags[0]?.native).toEqual(['--typescript'])
  })

  it('accepts empty flags/prereqs and null versions (D-21)', () => {
    const result = ScaffoldPlanEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'scaffold.plan',
      data: {
        scaffolderName: 'go',
        command: 'go-blueprint',
        args: ['create', 'my-app'],
        resolvedFlags: [],
        versionUsed: null,
        upstreamVersion: null,
        prerequisites: [],
      },
    })

    expect('data' in result && result.data.resolvedFlags).toEqual([])
  })

  it('accepts a prerequisite with omitted versionRange (D-22)', () => {
    const result = ScaffoldPlanEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'scaffold.plan',
      data: { ...fullData, prerequisites: [{ command: 'node' }] },
    })

    const data = 'data' in result ? result.data : undefined
    expect(data?.prerequisites[0]?.versionRange).toBeUndefined()
  })

  it('accepts the error variant', () => {
    const result = ScaffoldPlanEnvelopeV1Schema.parse({
      schemaVersion: 1,
      command: 'scaffold.plan',
      error: { code: 'SCAFFOLDER_NOT_FOUND', message: 'no such scaffolder' },
    })

    expect('error' in result && result.error.code).toBe('SCAFFOLDER_NOT_FOUND')
  })

  it('rejects wrong command literal', () => {
    expect(ScaffoldPlanEnvelopeV1Schema.safeParse({
      schemaVersion: 1,
      command: 'scaffold',
      data: fullData,
    }).success).toBe(false)
  })

  it('rejects wrong schemaVersion', () => {
    expect(ScaffoldPlanEnvelopeV1Schema.safeParse({
      schemaVersion: 2,
      command: 'scaffold.plan',
      data: fullData,
    }).success).toBe(false)
  })
})
