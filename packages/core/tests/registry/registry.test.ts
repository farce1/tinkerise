import { describe, expect, it } from 'vitest'
import { defineScaffolder } from '@tinkerise/shared'
import {
  getAllScaffolders,
  getScaffolder,
  getScaffoldersByCategory,
} from '../../src/registry/index'

describe('getScaffolder()', () => {
  it('returns the Next.js entry for "next"', () => {
    const entry = getScaffolder('next')
    expect(entry).toBeDefined()
    expect(entry?.name).toBe('next')
  })

  it('returns undefined for unknown scaffolder name', () => {
    expect(getScaffolder('nonexistent')).toBeUndefined()
  })

  it('returned entry has correct structure', () => {
    const entry = getScaffolder('next')!
    expect(entry.category).toBe('web')
    expect(entry.command).toBe('npx')
    expect(entry.packageName).toBe('create-next-app')
    expect(entry.integration.type).toBe('delegate')
    expect(entry.prerequisites.length).toBeGreaterThan(0)
    expect(entry.flags.length).toBeGreaterThan(0)
  })
})

describe('getAllScaffolders()', () => {
  it('returns array with at least 1 entry', () => {
    const all = getAllScaffolders()
    expect(all.length).toBeGreaterThanOrEqual(1)
  })

  it('all entries have required properties', () => {
    for (const entry of getAllScaffolders()) {
      expect(entry.name).toBeDefined()
      expect(entry.category).toBeDefined()
      expect(entry.command).toBeDefined()
      expect(entry.packageName).toBeDefined()
      expect(entry.integration).toBeDefined()
    }
  })
})

describe('getScaffoldersByCategory()', () => {
  it('returns Next.js for web category', () => {
    const web = getScaffoldersByCategory('web')
    expect(web.length).toBeGreaterThanOrEqual(1)
    expect(web.some(s => s.name === 'next')).toBe(true)
  })

  it('returns empty array for category with no scaffolders', () => {
    const utility = getScaffoldersByCategory('utility')
    expect(utility).toEqual([])
  })
})

describe('Declarative requirement (REG-01)', () => {
  it('adding a scaffolder is a data-only operation', () => {
    // Define a new scaffolder with only data — no logic changes needed
    const myScaffolder = defineScaffolder({
      name: 'my-test',
      category: 'utility',
      command: 'npx',
      packageName: 'create-my-test',
      integration: { type: 'delegate', command: 'create-my-test' },
    })

    // Validates successfully — the registry system accepts it as pure data
    expect(myScaffolder.name).toBe('my-test')
    expect(myScaffolder.category).toBe('utility')
    expect(myScaffolder.passthroughArgs).toBe(true) // defaults applied
  })
})
