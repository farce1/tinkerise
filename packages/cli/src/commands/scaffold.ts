/**
 * Scaffold command — wires interactive prompts to the execution pipeline.
 *
 * Three entry modes:
 * - runInteractiveFlow: no args, full guided experience
 * - runCategoryFlow: category provided, filtered framework selection
 * - runDirectExecution: category + framework (+ optional name), minimal prompts
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import type { ScaffolderCategory } from '@tinkerise/shared'
import { detectPackageManager, executeScaffolder } from '@tinkerise/core'
import type { PackageManager } from '@tinkerise/core'
import { showBanner } from '../utils/banner.js'
import { runPromptFlow } from '../prompts/flow.js'
import { promptPackageManager } from '../prompts/pm-select.js'
import { promptProjectName } from '../prompts/project-name.js'

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
 * Build userFlags record from prompt answers and CLI options.
 */
function buildUserFlags(
  promptOptions: string[],
  cliOptions: ScaffoldOptions,
  pm: PackageManager,
): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {}

  // Add selected prompt options as boolean flags
  for (const opt of promptOptions) {
    flags[opt] = true
  }

  // Merge CLI boolean flags (--no-git, --no-install)
  if (cliOptions.git === false) {
    flags['no-git'] = true
  }
  if (cliOptions.install === false) {
    flags['no-install'] = true
  }

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
  cliOptions: ScaffoldOptions,
  pm: PackageManager,
): Promise<void> {
  const userFlags = buildUserFlags(options, cliOptions, pm)

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
 */
export async function runInteractiveFlow(options: ScaffoldOptions): Promise<void> {
  showBanner()

  const answers = await runPromptFlow({})
  const pm = await resolvePackageManager(process.cwd(), options.packageManager)

  await executePipeline(answers.framework, answers.name, answers.options, options, pm)
}

/**
 * Category-scoped flow — category provided, framework selection filtered.
 *
 * Shows banner, runs prompts filtered to the given category.
 */
export async function runCategoryFlow(
  category: string,
  options: ScaffoldOptions,
): Promise<void> {
  if (!VALID_CATEGORIES.includes(category as ScaffolderCategory)) {
    p.log.error(
      pc.red(`Unknown category: '${category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`),
    )
    process.exit(1)
  }

  showBanner()

  const answers = await runPromptFlow({
    filterCategory: category as ScaffolderCategory,
  })
  const pm = await resolvePackageManager(process.cwd(), options.packageManager)

  await executePipeline(answers.framework, answers.name, answers.options, options, pm)
}

/**
 * Direct execution — category, framework, and optionally name provided.
 *
 * Minimal prompts: only asks for name if not provided.
 */
export async function runDirectExecution(
  _category: string,
  framework: string,
  name: string | undefined,
  options: ScaffoldOptions,
): Promise<void> {
  const projectName = name ?? await promptProjectName(framework)
  const pm = await resolvePackageManager(process.cwd(), options.packageManager)

  await executePipeline(framework, projectName, [], options, pm)
}
