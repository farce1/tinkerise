/**
 * Tests for per-scaffolder help text generation.
 *
 * Verifies:
 * - Help text shows only unified flags, not native upstream flags
 * - Silent/no-op flags shown as "always enabled"
 * - Missing scaffolder returns empty string
 * - Passthrough section always present
 */

import { describe, expect, it } from 'vitest'
import { buildScaffolderHelpText } from '../../src/commands/help.js'

describe('buildScaffolderHelpText', () => {
  it('next: includes unified flags, not native flags', () => {
    const help = buildScaffolderHelpText('next')

    // Unified flags should appear
    expect(help).toContain('--typescript')
    expect(help).toContain('--tailwind')
    expect(help).toContain('--eslint')
    expect(help).toContain('--no-git')
    expect(help).toContain('--no-install')
    expect(help).toContain('--package-manager')

    // Native flags should NOT appear
    expect(help).not.toContain('--skip-git')
    expect(help).not.toContain('--disable-git')
    expect(help).not.toContain('--use-')
    expect(help).not.toContain('--skip-install')
  })

  it('vite: shows typescript as always enabled, no tailwind', () => {
    const help = buildScaffolderHelpText('vite')

    expect(help).toContain('--typescript')
    expect(help).toContain('(always enabled)')

    // Vite does not support --tailwind
    expect(help).not.toContain('--tailwind')
  })

  it('t3: shows unified names, not native camelCase', () => {
    const help = buildScaffolderHelpText('t3')

    expect(help).toContain('--tailwind')
    expect(help).toContain('--no-git')
    expect(help).toContain('--no-install')

    // Native camelCase should NOT appear
    expect(help).not.toContain('--noGit')
    expect(help).not.toContain('--noInstall')
  })

  it('remix: does not show --tailwind or --eslint (unsupported)', () => {
    const help = buildScaffolderHelpText('remix')

    expect(help).not.toContain('--tailwind')
    expect(help).not.toContain('--eslint')

    // But does show supported flags
    expect(help).toContain('--no-git')
    expect(help).toContain('--no-install')
  })

  it('nonexistent: returns empty string', () => {
    const help = buildScaffolderHelpText('nonexistent')
    expect(help).toBe('')
  })

  it('all help texts include passthrough section', () => {
    for (const name of ['next', 'vite', 'astro', 't3', 'remix', 'tanstack', 'turbo']) {
      const help = buildScaffolderHelpText(name)
      expect(help).toContain('Passthrough:')
      expect(help).toContain('-- <args>')
    }
  })
})
