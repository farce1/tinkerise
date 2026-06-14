import { describe, expect, it } from 'vitest'
import { TRUST_STORE_VERSION, TrustedSourceSchema, TrustStoreSchema } from '../../src/sources/schema.js'

const validStore = {
  version: TRUST_STORE_VERSION,
  sources: [
    { id: 'npm:tinkerise-scaffolder-foo', trustedAt: '2026-06-14T10:00:00.000Z' },
    { id: 'github:org/repo', trustedAt: '2026-06-14T10:01:00.000Z' },
  ],
}

describe('trustStoreSchema', () => {
  it('accepts a valid store', () => {
    expect(TrustStoreSchema.safeParse(validStore).success).toBe(true)
  })

  it('accepts an empty source list', () => {
    expect(TrustStoreSchema.safeParse({ version: TRUST_STORE_VERSION, sources: [] }).success).toBe(true)
  })

  it('rejects a mismatched version', () => {
    expect(TrustStoreSchema.safeParse({ ...validStore, version: 2 }).success).toBe(false)
  })

  it('rejects a source missing trustedAt', () => {
    expect(TrustStoreSchema.safeParse({
      version: TRUST_STORE_VERSION,
      sources: [{ id: 'npm:x' }],
    }).success).toBe(false)
  })
})

describe('trustedSourceSchema', () => {
  it('requires id and trustedAt', () => {
    expect(TrustedSourceSchema.safeParse({ id: 'npm:x', trustedAt: '2026-06-14T10:00:00.000Z' }).success).toBe(true)
    expect(TrustedSourceSchema.safeParse({ id: 'npm:x' }).success).toBe(false)
  })
})
