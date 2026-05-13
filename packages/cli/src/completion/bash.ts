/* eslint-disable no-template-curly-in-string -- shell scripts use ${VAR}
   parameter expansion syntax that ESLint conflates with JS template literal
   placeholders. The strings below are literal bash source, not JS templates. */
/**
 * Bash completion script generator (D-01, D-02, D-05, D-07, D-09, D-12, D-14).
 *
 * Walks the live Commander `program` tree at generation time and returns a
 * sourceable bash completion script. The emitted script:
 *
 * - Registers BOTH `tinkerise` and `tk` in a single `complete -F` directive
 *   (D-05).
 * - Skips the hidden `__complete` subcommand from the candidate stream so it
 *   never advertises an internal contract (D-10).
 * - Inlines static enum values from `./enums.js` (D-08, D-11b).
 * - Embeds dynamic-lookup snippets `tinkerise __complete <kind>` for flags
 *   and positionals listed in DYNAMIC_FLAGS / DYNAMIC_POSITIONALS — the
 *   `<kind>` comes from the imported map (single source of truth per D-09).
 *   Dynamic lookups suppress stderr (`2>/dev/null`) and fall back to an
 *   empty candidate set so the user never sees red error text mid-tab.
 *
 * Security: candidate values flow into bash via `compgen -W "$_items"` which
 * tokenizes on IFS and presents candidates as data, not commands (D-11b).
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

function escapeDouble(value: string): string {
  return value.replace(/"/g, '\\"')
}

function joinSpace(values: readonly string[]): string {
  return values.map(escapeDouble).join(' ')
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
  lines.push('# bash completion for tinkerise')
  lines.push('# Registers both `tinkerise` and `tk` (D-05).')
  lines.push('# Source via: eval "$(tinkerise completion bash)"')
  lines.push('')
  lines.push('_tinkerise() {')
  lines.push('  local cur prev words cword')
  lines.push('  _init_completion -n = 2>/dev/null || {')
  lines.push('    cur="${COMP_WORDS[COMP_CWORD]}"')
  lines.push('    prev="${COMP_WORDS[COMP_CWORD-1]}"')
  lines.push('    words=("${COMP_WORDS[@]}")')
  lines.push('    cword=${COMP_CWORD}')
  lines.push('  }')
  lines.push('')
  lines.push('  local _items=""')
  lines.push('')

  // ---- Flag-value completion (handle `prev` for known flags) ----
  lines.push('  # Flag-value completion (static enums + dynamic lookups)')
  lines.push('  case "$prev" in')
  for (const [flag, values] of Object.entries(FLAG_ENUMS)) {
    lines.push(`    ${flag})`)
    lines.push(`      COMPREPLY=( $(compgen -W "${joinSpace(values)}" -- "$cur") )`)
    lines.push('      return 0')
    lines.push('      ;;')
  }
  for (const flag of Object.keys(DYNAMIC_FLAGS)) {
    const kind = DYNAMIC_FLAGS[flag]!
    lines.push(`    ${flag})`)
    lines.push(`      _items=$(tinkerise __complete ${kind} 2>/dev/null) || _items=""`)
    lines.push('      COMPREPLY=( $(compgen -W "$_items" -- "$cur") )')
    lines.push('      return 0')
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

  lines.push('  # Positional completion at the first argument position')
  lines.push('  if [[ $cword -eq 1 ]]; then')
  lines.push(`    if [[ "$cur" == -* ]]; then`)
  lines.push(`      COMPREPLY=( $(compgen -W "${joinSpace(rootFlags)}" -- "$cur") )`)
  lines.push('      return 0')
  lines.push('    fi')
  lines.push(`    COMPREPLY=( $(compgen -W "${joinSpace(rootCandidates)}" -- "$cur") )`)
  lines.push('    return 0')
  lines.push('  fi')
  lines.push('')

  // ---- Depth-2 completion: per top-level command ----
  lines.push('  # Depth-2 completion: per top-level command')
  lines.push('  local cmd1="${words[1]}"')
  lines.push('  local cmd2="${words[2]:-}"')
  lines.push('  case "$cmd1" in')

  for (const node of root.subcommands) {
    const allNames = [node.name, ...node.aliases]
    lines.push(`    ${allNames.join('|')})`)

    if (node.subcommands.length > 0) {
      // Subsubcommands (e.g., preset save/use/list/delete/show, config list/get/set/init)
      const childNames: string[] = []
      for (const child of node.subcommands) {
        childNames.push(child.name)
        for (const a of child.aliases)
          childNames.push(a)
      }
      lines.push('      if [[ $cword -eq 2 ]]; then')
      lines.push(`        COMPREPLY=( $(compgen -W "${joinSpace(childNames)}" -- "$cur") )`)
      lines.push('        return 0')
      lines.push('      fi')

      // Depth-3: dynamic positional under a subsubcommand
      lines.push('      case "$cmd2" in')
      for (const child of node.subcommands) {
        const childPath = `${node.name} ${child.name}`
        const dynKind = DYNAMIC_POSITIONALS[childPath]
        const childAll = [child.name, ...child.aliases]
        if (dynKind) {
          lines.push(`        ${childAll.join('|')})`)
          lines.push('          if [[ $cword -eq 3 ]]; then')
          lines.push(`            _items=$(tinkerise __complete ${dynKind} 2>/dev/null) || _items=""`)
          lines.push('            COMPREPLY=( $(compgen -W "$_items" -- "$cur") )')
          lines.push('            return 0')
          lines.push('          fi')
          lines.push('          ;;')
        }
      }
      lines.push('      esac')
    }
    else {
      // Top-level positional with possible static enum or dynamic lookup.
      // Only emit the `if [[ $cword -eq 2 ]]; then ... fi` block when we
      // actually have a candidate source for that position — bash treats
      // an empty `if/fi` body as a syntax error.
      const dynKind = DYNAMIC_POSITIONALS[node.name]
      const staticEnum = POSITIONAL_ENUMS[node.name]
      if (staticEnum) {
        lines.push('      if [[ $cword -eq 2 ]]; then')
        lines.push(`        COMPREPLY=( $(compgen -W "${joinSpace(staticEnum)}" -- "$cur") )`)
        lines.push('        return 0')
        lines.push('      fi')
      }
      else if (dynKind) {
        lines.push('      if [[ $cword -eq 2 ]]; then')
        lines.push(`        _items=$(tinkerise __complete ${dynKind} 2>/dev/null) || _items=""`)
        lines.push('        COMPREPLY=( $(compgen -W "$_items" -- "$cur") )')
        lines.push('        return 0')
        lines.push('      fi')
      }
      // Flag-name completion for this command
      if (node.flags.length > 0) {
        lines.push(`      if [[ "$cur" == -* ]]; then`)
        lines.push(`        COMPREPLY=( $(compgen -W "${joinSpace(node.flags)}" -- "$cur") )`)
        lines.push('        return 0')
        lines.push('      fi')
      }
    }

    lines.push('      ;;')
  }

  lines.push('  esac')
  lines.push('')

  // ---- Fallback: complete flag names anywhere ----
  lines.push('  if [[ "$cur" == -* ]]; then')
  lines.push(`    COMPREPLY=( $(compgen -W "${joinSpace(rootFlags)}" -- "$cur") )`)
  lines.push('    return 0')
  lines.push('  fi')
  lines.push('')
  lines.push('  return 0')
  lines.push('}')
  lines.push('')
  lines.push('complete -F _tinkerise tinkerise tk')
  lines.push('')
  return lines.join('\n')
}
