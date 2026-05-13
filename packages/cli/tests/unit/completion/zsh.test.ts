/**
 * Phase 34 Plan 04 / Task 1 — zsh generator snapshot + behavioral assertions.
 *
 * Layer 1 of the two-layer strategy from D-15. Locks D-05 (dual-binary
 * `#compdef tinkerise tk` header), D-09 (dynamic-lookup snippet with
 * stderr suppression), D-10 (hidden `__complete` skipped), and D-14
 * (subcommand aliases emitted).
 */

import { Command } from 'commander'
import { describe, expect, it } from 'vitest'
import { generate } from '../../../src/completion/zsh.js'

function buildFixtureProgram(): Command {
  const p = new Command()
  p.name('tinkerise')
  p.option('--package-manager <pm>', 'Package manager')
  p.option('--preset <name>', 'Apply a saved preset')
  p.command('list [category]')
  p.command('add [enhancements...]').alias('install')
  p.command('doctor')
  p.command('completion <shell>')
  p.command('__complete <kind>', { hidden: true })
  return p
}

describe('completion/zsh.generate', () => {
  it('emits a stable script for the fixture Commander tree', () => {
    expect(generate(buildFixtureProgram())).toMatchSnapshot()
  })

  it('registers both tinkerise and tk per D-05', () => {
    expect(generate(buildFixtureProgram())).toMatch(/^#compdef tinkerise tk/)
  })

  it('skips the hidden __complete subcommand from candidates per D-10', () => {
    const out = generate(buildFixtureProgram())
    const stripped = out.replace(/tinkerise __complete \S+/g, '')
    expect(stripped).not.toMatch(/\b__complete\b/)
  })

  it('emits subcommand aliases alongside canonical names per D-14', () => {
    const out = generate(buildFixtureProgram())
    expect(out).toMatch(/\binstall\b/)
    expect(out).toMatch(/\badd\b/)
  })

  it('emits dynamic-lookup snippet for --preset per D-09', () => {
    expect(generate(buildFixtureProgram())).toMatch(/tinkerise __complete presets 2>\/dev\/null/)
  })
})
