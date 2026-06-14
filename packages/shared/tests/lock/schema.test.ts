import { describe, expect, it } from 'vitest'
import { LOCK_SCHEMA_VERSION, TinkeriseLockSchema } from '../../src/lock/schema.js'

const validLock = {
  schemaVersion: LOCK_SCHEMA_VERSION,
  framework: 'next',
  category: 'web',
  flags: { typescript: true, template: 'react-ts' },
  enhancements: [{ id: 'eslint', version: '9.0.0' }, { id: 'prettier', version: null }],
  packageManager: 'pnpm',
  createdWith: '0.2.4',
}

describe('tinkeriseLockSchema', () => {
  it('accepts a complete valid lock', () => {
    const parsed = TinkeriseLockSchema.safeParse(validLock)
    expect(parsed.success).toBe(true)
  })

  it('accepts an empty enhancements list', () => {
    const parsed = TinkeriseLockSchema.safeParse({ ...validLock, enhancements: [] })
    expect(parsed.success).toBe(true)
  })

  it('rejects an unknown category', () => {
    const parsed = TinkeriseLockSchema.safeParse({ ...validLock, category: 'desktop' })
    expect(parsed.success).toBe(false)
  })

  it('rejects a mismatched schemaVersion', () => {
    const parsed = TinkeriseLockSchema.safeParse({ ...validLock, schemaVersion: 2 })
    expect(parsed.success).toBe(false)
  })

  it('rejects a missing required field', () => {
    const { packageManager: _omitted, ...withoutPm } = validLock
    const parsed = TinkeriseLockSchema.safeParse(withoutPm)
    expect(parsed.success).toBe(false)
  })

  it('rejects an enhancement missing its id', () => {
    const parsed = TinkeriseLockSchema.safeParse({
      ...validLock,
      enhancements: [{ version: '1.0.0' }],
    })
    expect(parsed.success).toBe(false)
  })

  it('accepts a Vite template variant', () => {
    const parsed = TinkeriseLockSchema.safeParse({
      ...validLock,
      variant: { template: 'react', typescript: true },
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts a T3 components variant', () => {
    const parsed = TinkeriseLockSchema.safeParse({
      ...validLock,
      variant: { components: ['trpc', 'prisma'] },
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts a lock without a variant (backward compatible)', () => {
    const { variant: _v, ...withoutVariant } = { ...validLock, variant: undefined }
    expect(TinkeriseLockSchema.safeParse(withoutVariant).success).toBe(true)
  })

  it('rejects a malformed variant', () => {
    const parsed = TinkeriseLockSchema.safeParse({
      ...validLock,
      variant: { components: 'trpc' },
    })
    expect(parsed.success).toBe(false)
  })
})
