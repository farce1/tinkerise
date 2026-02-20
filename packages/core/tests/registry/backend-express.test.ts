import { describe, expect, it } from 'vitest'
import {
  getScaffolder,
  getScaffoldersByCategory,
} from '../../src/registry/index'
import { getScaffolderMetadata } from '../../src/registry/metadata'

describe('express scaffolder', () => {
  it('resolves by name with correct category and command', () => {
    const entry = getScaffolder('express')
    expect(entry).toBeDefined()
    expect(entry!.name).toBe('express')
    expect(entry!.category).toBe('backend')
    expect(entry!.command).toBe('npx')
  })

  it('uses npx as command (Node.js ecosystem, like web scaffolders)', () => {
    const entry = getScaffolder('express')!
    expect(entry.command).toBe('npx')
  })

  it('packageName is express-generator-typescript', () => {
    const entry = getScaffolder('express')!
    expect(entry.packageName).toBe('express-generator-typescript')
  })

  it('has node prerequisite with versionRange >=18.0.0', () => {
    const entry = getScaffolder('express')!
    expect(entry.prerequisites).toHaveLength(1)
    expect(entry.prerequisites[0].command).toBe('node')
    expect(entry.prerequisites[0].versionRange).toBe('>=18.0.0')
  })

  it('has only 1 prerequisite (node), not 2 like Python/Go/Rust scaffolders', () => {
    const entry = getScaffolder('express')!
    expect(entry.prerequisites).toHaveLength(1)
  })

  it('uses delegate integration with "express-generator-typescript" (no create subcommand)', () => {
    const entry = getScaffolder('express')!
    expect(entry.integration).toEqual({ type: 'delegate', command: 'express-generator-typescript' })
  })

  it('has no unified flag mappings', () => {
    const entry = getScaffolder('express')!
    expect(entry.flags).toHaveLength(0)
  })

  it('has metadata with displayName "Express"', () => {
    const meta = getScaffolderMetadata('express')
    expect(meta).toBeDefined()
    expect(meta!.displayName).toBe('Express')
  })
})

describe('backend category completeness', () => {
  it('getScaffoldersByCategory("backend") returns exactly 5 entries', () => {
    const entries = getScaffoldersByCategory('backend')
    expect(entries).toHaveLength(5)
    const names = entries.map(e => e.name).sort()
    expect(names).toEqual(['django', 'express', 'fastapi', 'go', 'rust'])
  })
})
