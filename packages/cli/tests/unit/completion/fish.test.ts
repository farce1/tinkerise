/**
 * Phase 34 Plan 04 / Task 1 — fish generator snapshot + behavioral assertions.
 *
 * Layer 1 of the two-layer strategy from D-15. Fish does not support
 * multi-command registration in one directive (D-05), so the generator
 * emits two parallel `complete -c tinkerise` and `complete -c tk` blocks
 * — both must appear in the output.
 */

import { Command } from 'commander'
import { describe, expect, it } from 'vitest'
import { generate } from '../../../src/completion/fish.js'

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

describe('completion/fish.generate', () => {
  it('emits a stable script for the fixture Commander tree', () => {
    expect(generate(buildFixtureProgram())).toMatchSnapshot()
  })

  it('registers both tinkerise and tk per D-05', () => {
    const out = generate(buildFixtureProgram())
    expect(out).toMatch(/complete -c tinkerise/)
    expect(out).toMatch(/complete -c tk/)
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

  it('emits dynamic-lookup snippet for --preset per D-09 (fish syntax: `; or true`)', () => {
    const out = generate(buildFixtureProgram())
    expect(out).toMatch(/tinkerise __complete presets 2>\/dev\/null; or true/)
  })

  it('emits root-positional dispatch for web/backend/mobile in both binaries per CR-01 / D-05 (34-06)', () => {
    const out = generate(buildFixtureProgram())
    // Each category directive must appear twice — once for `-c tinkerise`,
    // once for `-c tk` — per the dual-binary contract (D-05).
    for (const category of ['web', 'backend', 'mobile']) {
      const tinkeriseRegex = new RegExp(`complete -c tinkerise -f -n '__fish_seen_subcommand_from ${category}' -a '\\(tinkerise __complete scaffolders:${category} 2>/dev/null; or true\\)'`)
      const tkRegex = new RegExp(`complete -c tk -f -n '__fish_seen_subcommand_from ${category}' -a '\\(tinkerise __complete scaffolders:${category} 2>/dev/null; or true\\)'`)
      expect(out).toMatch(tinkeriseRegex)
      expect(out).toMatch(tkRegex)
    }
  })
})
