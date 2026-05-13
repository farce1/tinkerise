/**
 * Phase 34 Plan 04 / Task 1 — bash generator snapshot + behavioral assertions.
 *
 * Two-layer test strategy per D-15. This file is Layer 1: catches accidental
 * template churn in the bash generator and locks the per-shell D-05/D-09/D-10/
 * D-14 invariants outside of the brittle full-snapshot diff.
 *
 * The fixture program is intentionally hand-built — NOT importing the live
 * `program` from `packages/cli/src/index.ts` — so the snapshot stays stable
 * across CLI surface changes (D-15).
 *
 * Snapshot updates require an explicit `vitest -u` and PR review (T-34-19
 * mitigation).
 */

import { Command } from 'commander'
import { describe, expect, it } from 'vitest'
import { generate } from '../../../src/completion/bash.js'

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

describe('completion/bash.generate', () => {
  it('emits a stable script for the fixture Commander tree', () => {
    expect(generate(buildFixtureProgram())).toMatchSnapshot()
  })

  it('registers both tinkerise and tk per D-05', () => {
    expect(generate(buildFixtureProgram())).toMatch(/complete -F _tinkerise tinkerise tk/)
  })

  it('skips the hidden __complete subcommand from candidates per D-10', () => {
    const out = generate(buildFixtureProgram())
    // Strip the intentional dynamic-lookup snippets (e.g.
    // `tinkerise __complete presets 2>/dev/null`) — those are
    // not advertising the subcommand to the user, they are the
    // generator's internal lookup mechanism.
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
