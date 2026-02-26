import { describe, expect, it } from 'vitest'
import { resolveFlags } from '../../src/flags/resolver'
import { FlagNotApplicableError, validateFlagApplicability } from '../../src/flags/validator'
import { getScaffolder } from '../../src/registry/index'

describe('web scaffolder flag resolution', () => {
  describe('next.js', () => {
    const entry = getScaffolder('next')!

    it('typescript: true -> ["--typescript"] (base flags)', () => {
      const result = resolveFlags({ entry, userFlags: { typescript: true } })
      expect(result.args).toEqual(['--typescript'])
    })

    it('no-git: true -> ["--disable-git"] with v15+ (Pitfall 4)', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true }, upstreamVersion: '15.1.0' })
      expect(result.args).toEqual(['--disable-git'])
      expect(result.versionUsed).toBe('>=15.0.0')
    })

    it('no-git: true -> ["--skip-git"] with v14', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true }, upstreamVersion: '14.2.0' })
      expect(result.args).toEqual(['--skip-git'])
      expect(result.versionUsed).toBeNull()
    })

    it('package-manager: "pnpm" -> ["--use-pnpm"] (prefix-style)', () => {
      const result = resolveFlags({ entry, userFlags: { 'package-manager': 'pnpm' } })
      expect(result.args).toEqual(['--use-pnpm'])
    })

    it('package-manager: "bun" -> ["--use-bun"] (prefix-style)', () => {
      const result = resolveFlags({ entry, userFlags: { 'package-manager': 'bun' } })
      expect(result.args).toEqual(['--use-bun'])
    })

    it('src-dir: true -> ["--src-dir"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'src-dir': true } })
      expect(result.args).toEqual(['--src-dir'])
    })

    it('import-alias: "@/*" -> ["--import-alias", "@/*"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'import-alias': '@/*' } })
      expect(result.args).toEqual(['--import-alias', '@/*'])
    })

    it('app-router: true -> ["--app"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'app-router': true } })
      expect(result.args).toEqual(['--app'])
    })

    it('empty: true -> ["--empty"] with v15+', () => {
      const result = resolveFlags({ entry, userFlags: { empty: true }, upstreamVersion: '15.1.0' })
      expect(result.args).toEqual(['--empty'])
      expect(result.versionUsed).toBe('>=15.0.0')
    })

    it('empty produces no args with v14 (not in base flags)', () => {
      const result = resolveFlags({ entry, userFlags: { empty: true }, upstreamVersion: '14.2.0' })
      expect(result.args).toEqual([])
      expect(result.versionUsed).toBeNull()
    })

    it('biome: true -> ["--biome"] with v16+', () => {
      const result = resolveFlags({ entry, userFlags: { biome: true }, upstreamVersion: '16.1.0' })
      expect(result.args).toEqual(['--biome'])
      expect(result.versionUsed).toBe('>=16.0.0')
    })

    it('v16 selects >=16.0.0 flags before >=15.0.0', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true }, upstreamVersion: '16.0.0' })
      expect(result.args).toEqual(['--disable-git'])
      expect(result.versionUsed).toBe('>=16.0.0')
    })

    it('v15 selects >=15.0.0 flags (not >=16.0.0)', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true }, upstreamVersion: '15.3.0' })
      expect(result.args).toEqual(['--disable-git'])
      expect(result.versionUsed).toBe('>=15.0.0')
    })
  })

  describe('vite', () => {
    const entry = getScaffolder('vite')!

    it('typescript: true -> [] (silent accept, empty native)', () => {
      const result = resolveFlags({ entry, userFlags: { typescript: true } })
      expect(result.args).toEqual([])
    })

    it('tailwind throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { tailwind: true }))
        .toThrow(FlagNotApplicableError)
    })

    it('eslint throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { eslint: true }))
        .toThrow(FlagNotApplicableError)
    })

    it('no-git throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { 'no-git': true }))
        .toThrow(FlagNotApplicableError)
    })

    it('no-install throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { 'no-install': true }))
        .toThrow(FlagNotApplicableError)
    })

    it('package-manager throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { 'package-manager': 'pnpm' }))
        .toThrow(FlagNotApplicableError)
    })

    it('overwrite: true -> ["--overwrite"]', () => {
      const result = resolveFlags({ entry, userFlags: { overwrite: true } })
      expect(result.args).toEqual(['--overwrite'])
    })
  })

  describe('astro', () => {
    const entry = getScaffolder('astro')!

    it('typescript: true -> [] (silent accept, always strict TS)', () => {
      const result = resolveFlags({ entry, userFlags: { typescript: true } })
      expect(result.args).toEqual([])
    })

    it('tailwind: true -> ["--add", "tailwindcss"] (multi-word split)', () => {
      const result = resolveFlags({ entry, userFlags: { tailwind: true } })
      expect(result.args).toEqual(['--add', 'tailwindcss'])
    })

    it('no-git: true -> ["--no-git"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true } })
      expect(result.args).toEqual(['--no-git'])
    })

    it('no-install: true -> ["--no-install"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-install': true } })
      expect(result.args).toEqual(['--no-install'])
    })

    it('eslint throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { eslint: true }))
        .toThrow(FlagNotApplicableError)
    })

    it('package-manager throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { 'package-manager': 'pnpm' }))
        .toThrow(FlagNotApplicableError)
    })

    it('template: "blog" -> ["--template", "blog"]', () => {
      const result = resolveFlags({ entry, userFlags: { template: 'blog' } })
      expect(result.args).toEqual(['--template', 'blog'])
    })
  })

  describe('t3', () => {
    const entry = getScaffolder('t3')!

    it('typescript: true -> [] (silent accept, TS only)', () => {
      const result = resolveFlags({ entry, userFlags: { typescript: true } })
      expect(result.args).toEqual([])
    })

    it('tailwind: true -> ["--tailwind"]', () => {
      const result = resolveFlags({ entry, userFlags: { tailwind: true } })
      expect(result.args).toEqual(['--tailwind'])
    })

    it('eslint: true -> ["--eslint"]', () => {
      const result = resolveFlags({ entry, userFlags: { eslint: true } })
      expect(result.args).toEqual(['--eslint'])
    })

    it('biome: true -> ["--biome"]', () => {
      const result = resolveFlags({ entry, userFlags: { biome: true } })
      expect(result.args).toEqual(['--biome'])
    })

    it('import-alias: "~/" -> ["--import-alias", "~/"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'import-alias': '~/' } })
      expect(result.args).toEqual(['--import-alias', '~/'])
    })

    it('app-router: true -> ["--appRouter"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'app-router': true } })
      expect(result.args).toEqual(['--appRouter'])
    })

    it('no-git: true -> ["--noGit"] (camelCase, Pitfall 3)', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true } })
      expect(result.args).toEqual(['--noGit'])
    })

    it('no-install: true -> ["--noInstall"] (camelCase, Pitfall 3)', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-install': true } })
      expect(result.args).toEqual(['--noInstall'])
    })

    it('package-manager throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { 'package-manager': 'pnpm' }))
        .toThrow(FlagNotApplicableError)
    })
  })

  describe('remix (React Router v7)', () => {
    const entry = getScaffolder('remix')!

    it('typescript: true -> [] (silent accept, TS by default)', () => {
      const result = resolveFlags({ entry, userFlags: { typescript: true } })
      expect(result.args).toEqual([])
    })

    it('no-git: true -> ["--no-git-init"] (unique flag name)', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true } })
      expect(result.args).toEqual(['--no-git-init'])
    })

    it('no-install: true -> ["--no-install"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-install': true } })
      expect(result.args).toEqual(['--no-install'])
    })

    it('tailwind throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { tailwind: true }))
        .toThrow(FlagNotApplicableError)
    })

    it('eslint throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { eslint: true }))
        .toThrow(FlagNotApplicableError)
    })

    it('package-manager: "pnpm" -> ["--package-manager", "pnpm"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'package-manager': 'pnpm' } })
      expect(result.args).toEqual(['--package-manager', 'pnpm'])
    })

    it('template: "my-template" -> ["--template", "my-template"]', () => {
      const result = resolveFlags({ entry, userFlags: { template: 'my-template' } })
      expect(result.args).toEqual(['--template', 'my-template'])
    })

    it('overwrite: true -> ["--overwrite"]', () => {
      const result = resolveFlags({ entry, userFlags: { overwrite: true } })
      expect(result.args).toEqual(['--overwrite'])
    })
  })

  describe('tanStack Start', () => {
    const entry = getScaffolder('tanstack')!

    it('typescript: true -> [] (silent accept, TS only)', () => {
      const result = resolveFlags({ entry, userFlags: { typescript: true } })
      expect(result.args).toEqual([])
    })

    it('tailwind: true -> ["--tailwind"]', () => {
      const result = resolveFlags({ entry, userFlags: { tailwind: true } })
      expect(result.args).toEqual(['--tailwind'])
    })

    it('package-manager: "pnpm" -> ["--package-manager", "pnpm"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'package-manager': 'pnpm' } })
      expect(result.args).toEqual(['--package-manager', 'pnpm'])
    })

    it('no-git: true -> ["--no-git"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true } })
      expect(result.args).toEqual(['--no-git'])
    })

    it('no-install: true -> ["--no-install"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-install': true } })
      expect(result.args).toEqual(['--no-install'])
    })

    it('empty: true -> ["--no-examples"]', () => {
      const result = resolveFlags({ entry, userFlags: { empty: true } })
      expect(result.args).toEqual(['--no-examples'])
    })

    it('overwrite: true -> ["--force"]', () => {
      const result = resolveFlags({ entry, userFlags: { overwrite: true } })
      expect(result.args).toEqual(['--force'])
    })

    it('eslint throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { eslint: true }))
        .toThrow(FlagNotApplicableError)
    })
  })

  describe('turborepo', () => {
    const entry = getScaffolder('turbo')!

    it('no-install: true -> ["--skip-install"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-install': true } })
      expect(result.args).toEqual(['--skip-install'])
    })

    it('package-manager: "pnpm" -> ["-m", "pnpm"] (short flag)', () => {
      const result = resolveFlags({ entry, userFlags: { 'package-manager': 'pnpm' } })
      expect(result.args).toEqual(['-m', 'pnpm'])
    })

    it('no-git: true -> ["--no-git"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-git': true } })
      expect(result.args).toEqual(['--no-git'])
    })

    it('typescript throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { typescript: true }))
        .toThrow(FlagNotApplicableError)
    })

    it('tailwind throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { tailwind: true }))
        .toThrow(FlagNotApplicableError)
    })

    it('eslint throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { eslint: true }))
        .toThrow(FlagNotApplicableError)
    })
  })
})
