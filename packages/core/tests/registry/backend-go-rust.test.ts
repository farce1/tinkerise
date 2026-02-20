import { describe, expect, it } from 'vitest'
import {
  getScaffolder,
} from '../../src/registry/index'
import { getScaffolderMetadata } from '../../src/registry/metadata'
import { goPrerequisite, rustPrerequisite } from '../../src/registry/scaffolders/backend'

describe('goPrerequisite helper', () => {
  it('returns command "go" with versionFlag "version" (not --version)', () => {
    const prereq = goPrerequisite('>=1.22')
    expect(prereq.command).toBe('go')
    expect(prereq.versionFlag).toBe('version')
  })

  it('applies versionRange parameter', () => {
    const prereq = goPrerequisite('>=1.24')
    expect(prereq.versionRange).toBe('>=1.24')
  })

  it('has install instructions for all 3 platforms', () => {
    const prereq = goPrerequisite('>=1.22')
    expect(prereq.installInstructions).toHaveProperty('darwin')
    expect(prereq.installInstructions).toHaveProperty('linux')
    expect(prereq.installInstructions).toHaveProperty('win32')
  })
})

describe('rustPrerequisite helper', () => {
  it('returns command "rustc" with versionFlag "--version"', () => {
    const prereq = rustPrerequisite('>=1.78')
    expect(prereq.command).toBe('rustc')
    expect(prereq.versionFlag).toBe('--version')
  })

  it('applies versionRange parameter', () => {
    const prereq = rustPrerequisite('>=1.80')
    expect(prereq.versionRange).toBe('>=1.80')
  })

  it('has install instructions for all 3 platforms', () => {
    const prereq = rustPrerequisite('>=1.78')
    expect(prereq.installInstructions).toHaveProperty('darwin')
    expect(prereq.installInstructions).toHaveProperty('linux')
    expect(prereq.installInstructions).toHaveProperty('win32')
  })
})

describe('go scaffolder', () => {
  it('resolves by name with correct category and command', () => {
    const entry = getScaffolder('go')
    expect(entry).toBeDefined()
    expect(entry!.name).toBe('go')
    expect(entry!.category).toBe('backend')
    expect(entry!.command).toBe('go-blueprint')
  })

  it('has two-level prerequisites: go and go-blueprint', () => {
    const entry = getScaffolder('go')!
    expect(entry.prerequisites).toHaveLength(2)
    expect(entry.prerequisites[0].command).toBe('go')
    expect(entry.prerequisites[1].command).toBe('go-blueprint')
  })

  it('go prerequisite uses versionFlag "version" (NOT "--version")', () => {
    const entry = getScaffolder('go')!
    const goPrereq = entry.prerequisites.find(p => p.command === 'go')
    expect(goPrereq!.versionFlag).toBe('version')
  })

  it('go prerequisite has versionRange >=1.22', () => {
    const entry = getScaffolder('go')!
    const goPrereq = entry.prerequisites.find(p => p.command === 'go')
    expect(goPrereq!.versionRange).toBe('>=1.22')
  })

  it('go-blueprint install instructions use go install', () => {
    const entry = getScaffolder('go')!
    const toolPrereq = entry.prerequisites.find(p => p.command === 'go-blueprint')
    expect(toolPrereq!.installInstructions!.darwin).toContain('go install')
    expect(toolPrereq!.installInstructions!.linux).toContain('go install')
    expect(toolPrereq!.installInstructions!.win32).toContain('go install')
  })

  it('uses delegate integration with "go-blueprint create"', () => {
    const entry = getScaffolder('go')!
    expect(entry.integration).toEqual({ type: 'delegate', command: 'go-blueprint create' })
  })

  it('has metadata with displayName "Go"', () => {
    const meta = getScaffolderMetadata('go')
    expect(meta).toBeDefined()
    expect(meta!.displayName).toBe('Go')
  })
})

describe('rust scaffolder', () => {
  it('resolves by name with correct category and command', () => {
    const entry = getScaffolder('rust')
    expect(entry).toBeDefined()
    expect(entry!.name).toBe('rust')
    expect(entry!.category).toBe('backend')
    expect(entry!.command).toBe('cargo')
  })

  it('has two-level prerequisites: rustc and cargo-generate', () => {
    const entry = getScaffolder('rust')!
    expect(entry.prerequisites).toHaveLength(2)
    expect(entry.prerequisites[0].command).toBe('rustc')
    expect(entry.prerequisites[1].command).toBe('cargo-generate')
  })

  it('rustc prerequisite has versionRange >=1.78', () => {
    const entry = getScaffolder('rust')!
    const rustPrereq = entry.prerequisites.find(p => p.command === 'rustc')
    expect(rustPrereq!.versionRange).toBe('>=1.78')
  })

  it('cargo-generate install instructions use cargo install', () => {
    const entry = getScaffolder('rust')!
    const toolPrereq = entry.prerequisites.find(p => p.command === 'cargo-generate')
    expect(toolPrereq!.installInstructions!.darwin).toContain('cargo install cargo-generate')
    expect(toolPrereq!.installInstructions!.linux).toContain('cargo install cargo-generate')
    expect(toolPrereq!.installInstructions!.win32).toContain('cargo install cargo-generate')
  })

  it('uses delegate integration with "cargo generate"', () => {
    const entry = getScaffolder('rust')!
    expect(entry.integration).toEqual({ type: 'delegate', command: 'cargo generate' })
  })

  it('maps unified "no-git" to native "--init"', () => {
    const entry = getScaffolder('rust')!
    const noGitFlag = entry.flags.find(f => f.unified === 'no-git')
    expect(noGitFlag).toBeDefined()
    expect(noGitFlag!.native).toBe('--init')
  })

  it('has metadata with displayName "Rust (Axum)"', () => {
    const meta = getScaffolderMetadata('rust')
    expect(meta).toBeDefined()
    expect(meta!.displayName).toBe('Rust (Axum)')
  })
})
