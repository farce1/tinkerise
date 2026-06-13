import type { ScaffolderEntry } from '@tinkerise/shared'
import { describe, expect, it } from 'vitest'
import { resolveFlags } from '../resolver.js'

const entry: ScaffolderEntry = {
  name: 'next',
  category: 'web',
  command: 'npx',
  packageName: 'create-next-app',
  integration: { type: 'delegate', command: 'create-next-app@latest' },
  prerequisites: [],
  flags: [
    { unified: 'typescript', native: '--typescript' },
    { unified: 'tailwind', native: '--tailwind' },
    { unified: 'package-manager', native: '--use-', valueMap: { pnpm: 'pnpm', yarn: 'yarn' } },
    { unified: 'git', native: '--git', nativeDisable: '--no-git' },
    // Empty-string sentinel: a flag that upstream enables by default (no-op native).
    { unified: 'silent', native: '' },
  ],
  passthroughArgs: true,
}

describe('resolveFlags breakdown', () => {
  it('returns a per-flag native breakdown alongside flat args', () => {
    const result = resolveFlags({ entry, userFlags: { typescript: true, tailwind: true } })

    expect(result.args).toEqual(['--typescript', '--tailwind'])
    expect(result.breakdown).toEqual([
      { unified: 'typescript', native: ['--typescript'] },
      { unified: 'tailwind', native: ['--tailwind'] },
    ])
  })

  it('attributes prefix-style value flags while preserving flat arg order', () => {
    const result = resolveFlags({ entry, userFlags: { 'typescript': true, 'package-manager': 'pnpm' } })

    expect(result.args).toEqual(['--typescript', '--use-pnpm'])
    expect(result.breakdown).toEqual([
      { unified: 'typescript', native: ['--typescript'] },
      { unified: 'package-manager', native: ['--use-pnpm'] },
    ])
  })

  it('attributes negation flags when a flag is explicitly disabled', () => {
    const result = resolveFlags({ entry, userFlags: { git: false } })

    expect(result.args).toEqual(['--no-git'])
    expect(result.breakdown).toEqual([{ unified: 'git', native: ['--no-git'] }])
  })

  it('omits silent/no-op flags (empty native) from args and breakdown', () => {
    const result = resolveFlags({ entry, userFlags: { silent: true } })

    expect(result.args).toEqual([])
    expect(result.breakdown).toEqual([])
  })
})
