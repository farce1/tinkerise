/**
 * Interactive mode utilities — flag detection, CI guard, hybrid mode support.
 *
 * Detects user-provided CLI flags via Commander.js getOptionValueSource(),
 * builds preselected options from explicit flags, merges prompt answers
 * with flag values, and guards against running interactively in CI.
 */

import type { Command } from 'commander'
import { ciName, isCI } from '@tinkerise/core'
import pc from 'picocolors'

/**
 * Check whether a specific option was explicitly provided via CLI.
 *
 * Distinguishes user-passed flags (`--typescript`) from defaults.
 * Commander.js returns 'cli' for flags provided on the command line,
 * 'default' for options with default values, and undefined for unset.
 */
export function isOptionProvided(cmd: Command, optionName: string): boolean {
  return cmd.getOptionValueSource(optionName) === 'cli'
}

/**
 * Check whether all required positional args are provided.
 *
 * Returns true when category, framework, and name are all present,
 * meaning no interactive prompts are needed for positional arguments.
 * Does NOT check option flags — those have sensible defaults.
 */
export function isFullyNonInteractive(
  _cmd: Command,
  category?: string,
  framework?: string,
  name?: string,
): boolean {
  return Boolean(category && framework && name)
}

/**
 * Build an array of preselected option values from CLI flags.
 *
 * Checks each known option flag (typescript, tailwind, eslint) against
 * the Commander instance. If a flag was explicitly provided via CLI and
 * its value is true, the option is included in the preselected array.
 *
 * This enables hybrid mode: pre-selected options skip their multiselect.
 */
export function buildPreselectedOptions(cmd: Command): string[] {
  const preselected: string[] = []

  if (isOptionProvided(cmd, 'typescript') && cmd.opts().typescript) {
    preselected.push('typescript')
  }
  // Also check --ts alias (manually merged in index.ts, but source tracked separately)
  if (isOptionProvided(cmd, 'ts') && cmd.opts().ts) {
    preselected.push('typescript')
  }
  if (isOptionProvided(cmd, 'tailwind') && cmd.opts().tailwind) {
    preselected.push('tailwind')
  }
  if (isOptionProvided(cmd, 'eslint') && cmd.opts().eslint) {
    preselected.push('eslint')
  }

  // Deduplicate (in case both --ts and --typescript provided)
  return [...new Set(preselected)]
}

/**
 * Merge prompt-selected options with explicitly-provided CLI flags.
 *
 * Combines the options selected via interactive prompts with boolean
 * negation flags (--no-git, --no-install) that were explicitly provided.
 */
export function mergePromptAndFlags(
  promptOptions: string[],
  cmd: Command,
): Record<string, string | boolean> {
  const record: Record<string, string | boolean> = {}

  for (const option of promptOptions) {
    record[option] = true
  }

  if (isOptionProvided(cmd, 'git') && cmd.opts().git === false) {
    record['no-git'] = true
  }
  if (isOptionProvided(cmd, 'install') && cmd.opts().install === false) {
    record['no-install'] = true
  }

  return record
}

/**
 * CI environment guard — exits with error when required args are missing in CI.
 *
 * Called when isCI is true. Checks if category, framework, and name are all
 * provided. If any are missing, prints a descriptive error message to stderr
 * and exits with code 1.
 *
 * Per user decision: "tinkerise is NOT for CI/CD — it's a developer terminal tool."
 * But still handle gracefully per UX-05.
 */
export function ensureNonInteractive(
  _cmd: Command,
  category?: string,
  framework?: string,
  name?: string,
): void {
  if (!isCI)
    return

  const missing: string[] = []
  if (!category)
    missing.push('category')
  if (!framework)
    missing.push('framework')
  if (!name)
    missing.push('name')

  if (missing.length === 0)
    return

  const ciEnv = ciName ?? 'unknown'
  process.stderr.write(
    pc.red(`Error: Running in CI environment (${ciEnv}).\n`)
    + pc.red(`Missing required arguments: ${missing.join(', ')}\n`)
    + pc.red('Provide all arguments for non-interactive execution:\n')
    + pc.red('  tinkerise <category> <framework> <name> [options]\n'),
  )
  process.exit(1)
}
