import { describe, expect, it } from 'vitest'
import { defineScaffolder } from '@tinkerise/shared'
import { resolveFlags } from '../../src/flags/resolver'

/** Entry with base flags and versioned flags for testing */
const testEntry = defineScaffolder({
  name: 'test',
  category: 'web',
  command: 'npx',
  packageName: 'create-test',
  integration: { type: 'delegate', command: 'create-test' },
  flags: [
    { unified: 'typescript', native: '--typescript', nativeDisable: '--no-typescript' },
    { unified: 'tailwind', native: '--tailwind' },
    { unified: 'package-manager', native: '--use-', valueMap: { pnpm: 'pnpm', yarn: 'yarn', npm: 'npm' } },
  ],
  versionedFlags: [
    {
      versionRange: '>=15.0.0',
      flags: [
        { unified: 'typescript', native: '--ts', nativeDisable: '--no-ts' },
        { unified: 'tailwind', native: '--tw' },
      ],
    },
  ],
})

describe('resolveFlags()', () => {
  describe('base flag resolution', () => {
    it('maps { typescript: true } to ["--typescript"]', () => {
      const result = resolveFlags({ entry: testEntry, userFlags: { typescript: true } })
      expect(result.args).toEqual(['--typescript'])
      expect(result.versionUsed).toBeNull()
    })

    it('maps { typescript: false } with nativeDisable to disable flag', () => {
      const result = resolveFlags({ entry: testEntry, userFlags: { typescript: false } })
      expect(result.args).toEqual(['--no-typescript'])
    })

    it('ignores flags not set by user', () => {
      const result = resolveFlags({ entry: testEntry, userFlags: {} })
      expect(result.args).toEqual([])
    })

    it('maps multiple boolean flags', () => {
      const result = resolveFlags({
        entry: testEntry,
        userFlags: { typescript: true, tailwind: true },
      })
      expect(result.args).toEqual(['--typescript', '--tailwind'])
    })
  })

  describe('version-aware resolution', () => {
    it('uses base flags when no upstream version detected', () => {
      const result = resolveFlags({
        entry: testEntry,
        userFlags: { typescript: true },
        upstreamVersion: null,
      })
      expect(result.args).toEqual(['--typescript'])
      expect(result.versionUsed).toBeNull()
    })

    it('uses base flags when version does not match any range', () => {
      const result = resolveFlags({
        entry: testEntry,
        userFlags: { typescript: true },
        upstreamVersion: '14.2.0',
      })
      expect(result.args).toEqual(['--typescript'])
      expect(result.versionUsed).toBeNull()
    })

    it('uses versioned flags when version matches range', () => {
      const result = resolveFlags({
        entry: testEntry,
        userFlags: { typescript: true },
        upstreamVersion: '15.1.0',
      })
      expect(result.args).toEqual(['--ts'])
      expect(result.versionUsed).toBe('>=15.0.0')
    })
  })

  describe('value-mapped flags', () => {
    it('maps value flag with prefix-style native', () => {
      const result = resolveFlags({
        entry: testEntry,
        userFlags: { 'package-manager': 'pnpm' },
      })
      expect(result.args).toEqual(['--use-pnpm'])
    })
  })
})
