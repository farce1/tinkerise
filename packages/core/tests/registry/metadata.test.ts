/**
 * Tests for scaffolder metadata completeness and correctness.
 *
 * Ensures every scaffolder has display info and suggestions,
 * and that the lookup function works correctly.
 */

import { describe, expect, it } from 'vitest'
import { getScaffolderMetadata, SCAFFOLDER_METADATA } from '../../src/registry/metadata'

const EXPECTED_SCAFFOLDERS = ['next', 'vite', 'astro', 't3', 'remix', 'tanstack', 'turbo']

describe('sCAFFOLDER_METADATA', () => {
  it('has entries for all 7 expected scaffolders', () => {
    for (const name of EXPECTED_SCAFFOLDERS) {
      expect(SCAFFOLDER_METADATA[name]).toBeDefined()
    }
  })

  it('all entries have non-empty displayName', () => {
    for (const [name, meta] of Object.entries(SCAFFOLDER_METADATA)) {
      expect(meta.displayName, `${name} displayName`).toBeTruthy()
      expect(meta.displayName.length, `${name} displayName length`).toBeGreaterThan(0)
    }
  })

  it('all entries have non-empty description', () => {
    for (const [name, meta] of Object.entries(SCAFFOLDER_METADATA)) {
      expect(meta.description, `${name} description`).toBeTruthy()
      expect(meta.description.length, `${name} description length`).toBeGreaterThan(0)
    }
  })

  it('all entries have at least 2 suggestions', () => {
    for (const [name, meta] of Object.entries(SCAFFOLDER_METADATA)) {
      expect(meta.suggestions.length, `${name} suggestions count`).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('getScaffolderMetadata', () => {
  it('returns valid metadata for known scaffolder', () => {
    const meta = getScaffolderMetadata('next')
    expect(meta).toBeDefined()
    expect(meta!.displayName).toBe('Next.js')
    expect(meta!.description).toContain('React')
    expect(meta!.suggestions.length).toBeGreaterThanOrEqual(2)
  })

  it('returns undefined for nonexistent scaffolder', () => {
    expect(getScaffolderMetadata('nonexistent')).toBeUndefined()
  })
})
