import { describe, expect, it } from 'vitest'
import {
  getAllScaffolders,
  getScaffolder,
  getScaffoldersByCategory,
} from '../../src/registry/index'

const WEB_SCAFFOLDERS = ['next', 'vite', 'astro', 't3', 'remix', 'tanstack', 'turbo']

describe('web scaffolder registry', () => {
  for (const name of WEB_SCAFFOLDERS) {
    it(`resolves '${name}' by name`, () => {
      const entry = getScaffolder(name)
      expect(entry).toBeDefined()
      expect(entry!.name).toBe(name)
      expect(entry!.category).toBe('web')
    })
  }

  it('getScaffoldersByCategory("web") returns all 7 entries', () => {
    const entries = getScaffoldersByCategory('web')
    expect(entries).toHaveLength(7)
    const names = entries.map(e => e.name).sort()
    expect(names).toEqual([...WEB_SCAFFOLDERS].sort())
  })

  it('getAllScaffolders() includes all 7 web entries', () => {
    const all = getAllScaffolders()
    expect(all.length).toBeGreaterThanOrEqual(7)
  })

  // Verify specific critical fields
  it('remix uses create-react-router, not create-remix (Pitfall 1)', () => {
    const entry = getScaffolder('remix')!
    expect(entry.packageName).toBe('create-react-router')
    expect(entry.integration).toEqual({ type: 'delegate', command: 'create-react-router' })
  })

  it('tanstack uses @tanstack/cli create (multi-word command)', () => {
    const entry = getScaffolder('tanstack')!
    expect(entry.packageName).toBe('@tanstack/cli')
    expect(entry.integration).toEqual({ type: 'delegate', command: '@tanstack/cli create' })
  })

  it('t3 uses camelCase flags --noGit and --noInstall (Pitfall 3)', () => {
    const entry = getScaffolder('t3')!
    const noGitFlag = entry.flags.find(f => f.unified === 'no-git')
    expect(noGitFlag?.native).toBe('--noGit')
    const noInstallFlag = entry.flags.find(f => f.unified === 'no-install')
    expect(noInstallFlag?.native).toBe('--noInstall')
  })

  it('next has package-manager flag with prefix-style native', () => {
    const entry = getScaffolder('next')!
    const pmFlag = entry.flags.find(f => f.unified === 'package-manager')
    expect(pmFlag).toBeDefined()
    expect(pmFlag!.native).toBe('--use-')
    expect(pmFlag!.valueMap).toEqual({ npm: 'npm', pnpm: 'pnpm', yarn: 'yarn', bun: 'bun' })
  })

  it('next v15+ versionedFlags uses --disable-git instead of --skip-git (Pitfall 4)', () => {
    const entry = getScaffolder('next')!
    expect(entry.versionedFlags).toBeDefined()
    const v15Flags = entry.versionedFlags![0]
    expect(v15Flags.versionRange).toBe('>=15.0.0')
    const noGitFlag = v15Flags.flags.find(f => f.unified === 'no-git')
    expect(noGitFlag?.native).toBe('--disable-git')
  })

  it('turbo uses -m for package-manager flag', () => {
    const entry = getScaffolder('turbo')!
    const pmFlag = entry.flags.find(f => f.unified === 'package-manager')
    expect(pmFlag?.native).toBe('-m')
  })

  it('astro uses --add tailwindcss for tailwind (multi-word native)', () => {
    const entry = getScaffolder('astro')!
    const twFlag = entry.flags.find(f => f.unified === 'tailwind')
    expect(twFlag?.native).toBe('--add tailwindcss')
  })

  it('all web scaffolders have passthroughArgs enabled', () => {
    for (const name of WEB_SCAFFOLDERS) {
      const entry = getScaffolder(name)!
      expect(entry.passthroughArgs).toBe(true)
    }
  })

  it('all web scaffolders have node prerequisites', () => {
    for (const name of WEB_SCAFFOLDERS) {
      const entry = getScaffolder(name)!
      expect(entry.prerequisites.length).toBeGreaterThanOrEqual(1)
      expect(entry.prerequisites[0].command).toBe('node')
    }
  })
})
