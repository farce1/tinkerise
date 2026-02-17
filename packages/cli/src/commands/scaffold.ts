/**
 * Scaffold command — wires interactive prompts to the execution pipeline.
 *
 * Three entry modes:
 * - runInteractiveFlow: no args, full guided experience
 * - runCategoryFlow: category provided, filtered framework selection
 * - runDirectExecution: category + framework (+ optional name), minimal prompts
 *
 * Each mode supports:
 * - CI guard: exits with clear error when args missing in CI environments
 * - Hybrid mode: pre-selects options from explicit CLI flags
 * - Full non-interactive: skips all prompts when all positional args provided
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import type { Command } from 'commander'
import type { ScaffolderCategory } from '@tinkerise/shared'
import { detectPackageManager, executeScaffolder, isCI } from '@tinkerise/core'
import type { PackageManager } from '@tinkerise/core'
import { showBanner } from '../utils/banner.js'
import { runPromptFlow } from '../prompts/flow.js'
import { promptPackageManager } from '../prompts/pm-select.js'
import { promptProjectName } from '../prompts/project-name.js'
import {
  buildPreselectedOptions,
  ensureNonInteractive,
  mergePromptAndFlags,
} from '../utils/interactive.js'

/** Valid scaffolder categories */
const VALID_CATEGORIES: ScaffolderCategory[] = ['web', 'backend', 'mobile']

export interface ScaffoldOptions {
  typescript?: boolean
  tailwind?: boolean
  eslint?: boolean
  /** Commander.js: --no-git sets git=false */
  git?: boolean
  /** Commander.js: --no-install sets install=false */
  install?: boolean
  packageManager?: string
}

/**
 * Resolve the package manager — detect, warn if missing, prompt if needed.
 *
 * @returns The resolved package manager name
 */
async function resolvePackageManager(
  cwd: string,
  flagValue?: string,
): Promise<PackageManager> {
  const pmResult = await detectPackageManager(cwd, flagValue)

  if (pmResult.source === 'binary-missing') {
    // Detected PM binary is not installed — warn and prompt
    p.log.warn(
      pc.yellow(`${pmResult.pm} was detected but is not installed. Choose a package manager:`),
    )
    return promptPackageManager()
  }

  if (pmResult.source === 'default') {
    // No lockfile or packageManager field found — prompt user to choose
    return promptPackageManager()
  }

  // Source is 'flag', 'lockfile', or 'packageManager-field' — use detected PM
  return pmResult.pm
}

/**
 * Build userFlags record from prompt/preselected options, CLI Command, and PM.
 *
 * Uses mergePromptAndFlags for --no-git/--no-install detection, then layers
 * on explicit boolean option flags and the resolved package manager.
 */
function buildUserFlags(
  promptOptions: string[],
  cmd: Command,
  cliOptions: ScaffoldOptions,
  pm: PackageManager,
): Record<string, string | boolean> {
  const flags = mergePromptAndFlags(promptOptions, cmd)

  // Override with explicit CLI flags if provided
  if (cliOptions.typescript) flags['typescript'] = true
  if (cliOptions.tailwind) flags['tailwind'] = true
  if (cliOptions.eslint) flags['eslint'] = true

  // Add PM if not npm (npm is the default for upstream tools)
  if (pm !== 'npm') {
    flags['package-manager'] = pm
  }

  return flags
}

/**
 * Execute the scaffolding pipeline and show success message.
 */
async function executePipeline(
  framework: string,
  name: string,
  options: string[],
  cmd: Command,
  cliOptions: ScaffoldOptions,
  pm: PackageManager,
): Promise<void> {
  const userFlags = buildUserFlags(options, cmd, cliOptions, pm)

  await executeScaffolder({
    scaffolderName: framework,
    projectName: name,
    userFlags,
  })

  // Success one-liner per user decision
  p.log.success(
    `${pc.green('Created')} ${pc.bold(name)}. ${pc.dim(`cd ${name} && ${pm} run dev`)}`,
  )
}

/**
 * Full interactive flow — no arguments provided.
 *
 * Shows banner, runs all prompts, detects PM, executes.
 * CI guard: exits with clear error when in CI (no args = all missing).
 */
export async function runInteractiveFlow(
  cmd: Command,
  options: ScaffoldOptions,
): Promise<void> {
  // CI guard: no args provided, cannot run interactively in CI
  if (isCI) {
    ensureNonInteractive(cmd)
    // ensureNonInteractive exits if args are missing; this line only reached
    // if somehow all args were provided (shouldn't happen in this code path)
  }

  showBanner()

  const preselected = buildPreselectedOptions(cmd)
  const answers = await runPromptFlow({ preselectedOptions: preselected })
  const pm = await resolvePackageManager(process.cwd(), options.packageManager)

  await executePipeline(answers.framework, answers.name, answers.options, cmd, options, pm)
}

/**
 * Category-scoped flow — category provided, framework selection filtered.
 *
 * Shows banner, runs prompts filtered to the given category.
 * CI guard: exits if framework/name missing in CI.
 */
export async function runCategoryFlow(
  category: string,
  cmd: Command,
  options: ScaffoldOptions,
): Promise<void> {
  if (!VALID_CATEGORIES.includes(category as ScaffolderCategory)) {
    p.log.error(
      pc.red(`Unknown category: '${category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`),
    )
    process.exit(1)
  }

  // CI guard: category provided but framework/name missing
  if (isCI) {
    ensureNonInteractive(cmd, category)
  }

  showBanner()

  const preselected = buildPreselectedOptions(cmd)
  const answers = await runPromptFlow({
    filterCategory: category as ScaffolderCategory,
    preselectedOptions: preselected,
  })
  const pm = await resolvePackageManager(process.cwd(), options.packageManager)

  await executePipeline(answers.framework, answers.name, answers.options, cmd, options, pm)
}

/**
 * Direct execution — category, framework, and optionally name provided.
 *
 * Minimal prompts: only asks for name if not provided.
 * CI guard: exits if name missing in CI.
 * Hybrid mode: preselects options from explicit CLI flags.
 */
export async function runDirectExecution(
  category: string,
  framework: string,
  name: string | undefined,
  cmd: Command,
  options: ScaffoldOptions,
): Promise<void> {
  // CI guard: if CI and no name, exit with error
  if (isCI) {
    ensureNonInteractive(cmd, category, framework, name)
  }

  const projectName = name ?? await promptProjectName(framework)
  const pm = await resolvePackageManager(process.cwd(), options.packageManager)

  const preselected = buildPreselectedOptions(cmd)

  // If we have preselected options, use them directly; otherwise use empty array
  // (direct execution skips the options multiselect)
  await executePipeline(framework, projectName, preselected, cmd, options, pm)
}
