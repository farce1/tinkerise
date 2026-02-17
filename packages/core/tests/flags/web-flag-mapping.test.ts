import { describe, expect, it } from 'vitest'
import { getScaffolder } from '../../src/registry/index'
import { resolveFlags } from '../../src/flags/resolver'
import { FlagNotApplicableError, validateFlagApplicability } from '../../src/flags/validator'

describe('web scaffolder flag resolution', () => {
  describe('Next.js', () => {
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
  })

  describe('Vite', () => {
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
  })

  describe('Astro', () => {
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
  })

  describe('T3', () => {
    const entry = getScaffolder('t3')!

    it('typescript: true -> [] (silent accept, TS only)', () => {
      const result = resolveFlags({ entry, userFlags: { typescript: true } })
      expect(result.args).toEqual([])
    })

    it('tailwind: true -> ["--tailwind"]', () => {
      const result = resolveFlags({ entry, userFlags: { tailwind: true } })
      expect(result.args).toEqual(['--tailwind'])
    })

    it('eslint: true -> [] (silent accept, always included)', () => {
      const result = resolveFlags({ entry, userFlags: { eslint: true } })
      expect(result.args).toEqual([])
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

  describe('Remix (React Router v7)', () => {
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

    it('package-manager throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { 'package-manager': 'pnpm' }))
        .toThrow(FlagNotApplicableError)
    })
  })

  describe('TanStack Start', () => {
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
  })

  describe('Turborepo', () => {
    const entry = getScaffolder('turbo')!

    it('no-install: true -> ["--skip-install"]', () => {
      const result = resolveFlags({ entry, userFlags: { 'no-install': true } })
      expect(result.args).toEqual(['--skip-install'])
    })

    it('package-manager: "pnpm" -> ["-m", "pnpm"] (short flag)', () => {
      const result = resolveFlags({ entry, userFlags: { 'package-manager': 'pnpm' } })
      expect(result.args).toEqual(['-m', 'pnpm'])
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

    it('no-git throws FlagNotApplicableError', () => {
      expect(() => validateFlagApplicability(entry, { 'no-git': true }))
        .toThrow(FlagNotApplicableError)
    })
  })
})
