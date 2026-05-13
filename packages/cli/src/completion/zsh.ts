/* eslint-disable no-template-curly-in-string -- shell scripts use ${VAR}
   parameter expansion syntax that ESLint conflates with JS template literal
   placeholders. The strings below are literal zsh source, not JS templates. */
/**
 * Zsh completion script generator (D-01, D-02, D-05, D-07, D-09, D-12, D-14).
 *
 * Emits a `#compdef tinkerise tk` script that registers both `tinkerise` and
 * `tk` in one directive (D-05). Static enum values come from `./enums.js`
 * (single source of truth per D-08); dynamic values flow through
 * `tinkerise __complete <kind>` snippets whose `<kind>` is looked up in
 * DYNAMIC_FLAGS / DYNAMIC_POSITIONALS — never hardcoded inline (D-09).
 *
 * Stderr suppression with `2>/dev/null` keeps tab failures quiet (D-09 graceful
 * fallback). The hidden `__complete` subcommand is skipped from the candidate
 * stream (D-10).
 *
 * Security: candidates flow through zsh's `_describe` builtin, which presents
 * them as data — not commands — per D-11b.
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
  return value.replace(/'/g, `'\\''`)
}

function joinSpace(values: readonly string[]): string {
  return values.map(escapeSingle).join(' ')
}

/**
 * Build a zsh array-of-lines expansion for `tinkerise __complete <kind>`.
 * Equivalent to: ${(f)"$(tinkerise __complete <kind> 2>/dev/null)"}
 *
 * Held as a helper so the literal zsh `${(f)"..."}` parameter-expansion
 * lives in one place (the rest of the generator stays template-literal
 * friendly without triggering @antfu/eslint-config's prefer-template rule).
 */
function dynamicLookup(kind: string): string {
  return `\${(f)"$(tinkerise __complete ${kind} 2>/dev/null)"}`
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

export function generate(program: Command): string {
  const root = walk(program)
  const topLevel = collectTopLevelCandidates(root)
  const rootFlags = root.flags

  const lines: string[] = []
  lines.push('#compdef tinkerise tk')
  lines.push('# zsh completion for tinkerise')
  lines.push('# Registers both `tinkerise` and `tk` (D-05).')
  lines.push('# Install via: tinkerise completion zsh > "${fpath[1]}/_tinkerise" && compinit')
  lines.push('')
  lines.push('_tinkerise() {')
  lines.push('  local -a _items _candidates')
  lines.push('  local prev cur')
  lines.push('  prev="${words[CURRENT-1]}"')
  lines.push('  cur="${words[CURRENT]}"')
  lines.push('')

  // ---- Flag-value completion ----
  lines.push('  # Flag-value completion (static enums + dynamic lookups)')
  lines.push('  case "$prev" in')
  for (const [flag, values] of Object.entries(FLAG_ENUMS)) {
    lines.push(`    ${flag})`)
    lines.push(`      _candidates=( ${joinSpace(values)} )`)
    lines.push(`      _describe '${escapeSingle(flag)} values' _candidates`)
    lines.push('      return')
    lines.push('      ;;')
  }
  for (const flag of Object.keys(DYNAMIC_FLAGS)) {
    const kind = DYNAMIC_FLAGS[flag]!
    lines.push(`    ${flag})`)
    lines.push(`      _items=( ${dynamicLookup(kind)} )`)
    lines.push(`      _describe '${escapeSingle(kind)}' _items`)
    lines.push('      return')
    lines.push('      ;;')
  }
  lines.push('  esac')
  lines.push('')

  // ---- Depth-1 positional completion ----
  const rootPositional = POSITIONAL_ENUMS['']
  const rootCandidates: string[] = []
  if (rootPositional)
    rootCandidates.push(...rootPositional)
  rootCandidates.push(...topLevel)

  lines.push('  # Positional completion')
  lines.push('  if (( CURRENT == 2 )); then')
  lines.push(`    if [[ "$cur" == -* ]]; then`)
  lines.push(`      _candidates=( ${joinSpace(rootFlags)} )`)
  lines.push(`      _describe 'options' _candidates`)
  lines.push('      return')
  lines.push('    fi')
  lines.push(`    _candidates=( ${joinSpace(rootCandidates)} )`)
  lines.push(`    _describe 'commands' _candidates`)
  lines.push('    return')
  lines.push('  fi')
  lines.push('')

  // ---- Depth-2 completion: per top-level command ----
  lines.push('  # Depth-2 completion: per top-level command')
  lines.push('  local cmd1="${words[2]}"')
  lines.push('  local cmd2="${words[3]:-}"')
  lines.push('  case "$cmd1" in')

  for (const node of root.subcommands) {
    const allNames = [node.name, ...node.aliases]
    lines.push(`    ${allNames.join('|')})`)

    if (node.subcommands.length > 0) {
      const childNames: string[] = []
      for (const child of node.subcommands) {
        childNames.push(child.name)
        for (const a of child.aliases)
          childNames.push(a)
      }
      lines.push('      if (( CURRENT == 3 )); then')
      lines.push(`        _candidates=( ${joinSpace(childNames)} )`)
      lines.push(`        _describe '${escapeSingle(node.name)} subcommands' _candidates`)
      lines.push('        return')
      lines.push('      fi')

      lines.push('      case "$cmd2" in')
      for (const child of node.subcommands) {
        const childPath = `${node.name} ${child.name}`
        const dynKind = DYNAMIC_POSITIONALS[childPath]
        const childAll = [child.name, ...child.aliases]
        if (dynKind) {
          lines.push(`        ${childAll.join('|')})`)
          lines.push('          if (( CURRENT == 4 )); then')
          lines.push(`            _items=( ${dynamicLookup(dynKind)} )`)
          lines.push(`            _describe '${escapeSingle(dynKind)}' _items`)
          lines.push('            return')
          lines.push('          fi')
          lines.push('          ;;')
        }
      }
      lines.push('      esac')
    }
    else {
      // Only emit the `if (( CURRENT == 3 )); then ... fi` block when we
      // actually have a candidate source for that position — zsh, like
      // bash, treats an empty `if/fi` body as a syntax error.
      const dynKind = DYNAMIC_POSITIONALS[node.name]
      const staticEnum = POSITIONAL_ENUMS[node.name]
      if (staticEnum) {
        lines.push('      if (( CURRENT == 3 )); then')
        lines.push(`        _candidates=( ${joinSpace(staticEnum)} )`)
        lines.push(`        _describe '${escapeSingle(node.name)} values' _candidates`)
        lines.push('        return')
        lines.push('      fi')
      }
      else if (dynKind) {
        lines.push('      if (( CURRENT == 3 )); then')
        lines.push(`        _items=( ${dynamicLookup(dynKind)} )`)
        lines.push(`        _describe '${escapeSingle(dynKind)}' _items`)
        lines.push('        return')
        lines.push('      fi')
      }

      if (node.flags.length > 0) {
        lines.push(`      if [[ "$cur" == -* ]]; then`)
        lines.push(`        _candidates=( ${joinSpace(node.flags)} )`)
        lines.push(`        _describe '${escapeSingle(node.name)} options' _candidates`)
        lines.push('        return')
        lines.push('      fi')
      }
    }

    lines.push('      ;;')
  }

  lines.push('  esac')
  lines.push('')

  // ---- Fallback: complete flag names anywhere ----
  lines.push('  if [[ "$cur" == -* ]]; then')
  lines.push(`    _candidates=( ${joinSpace(rootFlags)} )`)
  lines.push(`    _describe 'options' _candidates`)
  lines.push('  fi')
  lines.push('}')
  lines.push('')
  lines.push('# #compdef directive above already registers tinkerise and tk.')
  lines.push('')
  return lines.join('\n')
}
