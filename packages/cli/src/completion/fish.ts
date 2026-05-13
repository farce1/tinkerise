/**
 * Fish completion script generator (D-01, D-02, D-05, D-07, D-09, D-12, D-14).
 *
 * Emits two parallel blocks — `complete -c tinkerise ...` and
 * `complete -c tk ...` — because fish does not support multi-command
 * registration in one directive (D-05). Both blocks contain identical
 * directives so the dual-binary contract is honored.
 *
 * Static enum values come from `./enums.js` (D-08). Dynamic values flow
 * through `tinkerise __complete <kind>` snippets whose `<kind>` is looked up
 * in DYNAMIC_FLAGS / DYNAMIC_POSITIONALS — never hardcoded inline (D-09).
 *
 * Stderr suppression with `2>/dev/null` keeps tab failures quiet (D-09 graceful
 * fallback). The hidden `__complete` subcommand is skipped from the candidate
 * stream (D-10).
 *
 * Security: candidates flow through fish's `complete -a` builtin, which
 * presents them as data — not commands — per D-11b.
 */

import type { Command } from 'commander'
import { DYNAMIC_FLAGS, DYNAMIC_POSITIONALS, FLAG_ENUMS, POSITIONAL_ENUMS } from './enums.js'

interface CommandNode {
  name: string
  aliases: readonly string[]
  flags: readonly string[]
  subcommands: readonly CommandNode[]
}

function walk(cmd: Command): CommandNode {
  const subcommands = cmd.commands
    .filter(c => c.name() !== '__complete')
    .map(c => walk(c))

  const flags = cmd.options
    .map(o => o.long)
    .filter((f): f is string => Boolean(f))

  return {
    name: cmd.name(),
    aliases: cmd.aliases(),
    flags,
    subcommands,
  }
}

function escapeSingle(value: string): string {
  return value.replace(/'/g, `\\'`)
}

function joinSpace(values: readonly string[]): string {
  return values.map(escapeSingle).join(' ')
}

function collectTopLevelCandidates(root: CommandNode): string[] {
  const names: string[] = []
  for (const child of root.subcommands) {
    names.push(child.name)
    for (const alias of child.aliases)
      names.push(alias)
  }
  return names
}

function emitBlock(binary: 'tinkerise' | 'tk', root: CommandNode): string[] {
  const lines: string[] = []
  const topLevel = collectTopLevelCandidates(root)

  lines.push(`# --- Completions for ${binary} ---`)

  // Top-level subcommand + root-positional candidates (web/backend/mobile + subcommand names)
  const rootPositional = POSITIONAL_ENUMS['']
  const rootCandidates: string[] = []
  if (rootPositional)
    rootCandidates.push(...rootPositional)
  rootCandidates.push(...topLevel)

  lines.push(`complete -c ${binary} -f -n '__fish_use_subcommand' -a '${joinSpace(rootCandidates)}'`)

  // Top-level flag-name completion (with -- prefix)
  for (const flag of root.flags) {
    const flagName = flag.replace(/^--/, '')
    lines.push(`complete -c ${binary} -f -n '__fish_use_subcommand' -l '${escapeSingle(flagName)}'`)
  }

  // Flag-value completion: static enums
  for (const [flag, values] of Object.entries(FLAG_ENUMS)) {
    const flagName = flag.replace(/^--/, '')
    lines.push(`complete -c ${binary} -f -n '__fish_seen_argument -l ${escapeSingle(flagName)}' -a '${joinSpace(values)}'`)
  }

  // Flag-value completion: dynamic lookups
  for (const flag of Object.keys(DYNAMIC_FLAGS)) {
    const kind = DYNAMIC_FLAGS[flag]!
    const flagName = flag.replace(/^--/, '')
    lines.push(`complete -c ${binary} -f -n '__fish_seen_argument -l ${escapeSingle(flagName)}' -a '(tinkerise __complete ${kind} 2>/dev/null; or true)'`)
  }

  // Per-subcommand completions
  for (const node of root.subcommands) {
    const subcommandNames = [node.name, ...node.aliases]
    for (const subname of subcommandNames) {
      if (node.subcommands.length > 0) {
        // Subsubcommands (e.g., preset save/use/list/delete/show)
        const childNames: string[] = []
        for (const child of node.subcommands) {
          childNames.push(child.name)
          for (const a of child.aliases)
            childNames.push(a)
        }
        lines.push(`complete -c ${binary} -f -n '__fish_seen_subcommand_from ${escapeSingle(subname)}' -a '${joinSpace(childNames)}'`)

        // Dynamic positionals on subsubcommands (e.g., preset use <preset>)
        for (const child of node.subcommands) {
          const childPath = `${node.name} ${child.name}`
          const dynKind = DYNAMIC_POSITIONALS[childPath]
          const childNamesAll = [child.name, ...child.aliases]
          if (dynKind) {
            for (const cname of childNamesAll) {
              lines.push(`complete -c ${binary} -f -n '__fish_seen_subcommand_from ${escapeSingle(subname)}; and __fish_seen_subcommand_from ${escapeSingle(cname)}' -a '(tinkerise __complete ${dynKind} 2>/dev/null; or true)'`)
            }
          }
        }
      }
      else {
        // Leaf subcommand: emit its flags and any dynamic/static positional candidates
        const dynKind = DYNAMIC_POSITIONALS[node.name]
        const staticEnum = POSITIONAL_ENUMS[node.name]
        if (staticEnum)
          lines.push(`complete -c ${binary} -f -n '__fish_seen_subcommand_from ${escapeSingle(subname)}' -a '${joinSpace(staticEnum)}'`)
        else if (dynKind)
          lines.push(`complete -c ${binary} -f -n '__fish_seen_subcommand_from ${escapeSingle(subname)}' -a '(tinkerise __complete ${dynKind} 2>/dev/null; or true)'`)

        for (const flag of node.flags) {
          const flagName = flag.replace(/^--/, '')
          lines.push(`complete -c ${binary} -f -n '__fish_seen_subcommand_from ${escapeSingle(subname)}' -l '${escapeSingle(flagName)}'`)
        }
      }
    }
  }

  return lines
}

export function generate(program: Command): string {
  const root = walk(program)

  const lines: string[] = []
  lines.push('# fish completion for tinkerise')
  lines.push('# Two parallel blocks register tinkerise and tk (D-05).')
  lines.push('# Install via: tinkerise completion fish > ~/.config/fish/completions/tinkerise.fish')
  lines.push('')

  lines.push(...emitBlock('tinkerise', root))
  lines.push('')
  lines.push(...emitBlock('tk', root))
  lines.push('')

  return lines.join('\n')
}
