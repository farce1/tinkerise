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

import type { PackageManager } from '@tinkerise/core'
import type { PresetData, ScaffolderCategory, TinkeriseUserConfig } from '@tinkerise/shared'
import type { Command } from 'commander'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { detectPackageManager, executeScaffolder, findClosestMatch, InvalidCategoryError, isCI, loadPreset, resolveConfig, tinkeriseSummaryCard } from '@tinkerise/core'
import pc from 'picocolors'
import { setSessionContext, writeSessionFile } from '../context/session.js'
import { runPromptFlow } from '../prompts/flow.js'
import { promptPackageManager } from '../prompts/pm-select.js'
import { promptProjectName } from '../prompts/project-name.js'
import { resolveViteTemplate, selectT3Components, selectViteTemplate } from '../prompts/variant-select.js'
import { showBanner } from '../utils/banner.js'
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
  biome?: boolean
  /** Commander.js: --no-git sets git=false */
  git?: boolean
  /** Commander.js: --no-install sets install=false */
  install?: boolean
  packageManager?: string
  /** Template/starter name (Vite, Astro, Remix) */
  template?: string
  /** Use src/ directory (Next.js) */
  srcDir?: boolean
  /** Import alias (e.g. @/*, ~/) */
  importAlias?: string
  /** Initialize with no starter content */
  empty?: boolean
  /** Overwrite existing directory */
  overwrite?: boolean
  /** Use App Router (Next.js, T3) */
  appRouter?: boolean
  /** Enable React Compiler (Next.js v16+) */
  reactCompiler?: boolean
  /** Use Turbopack bundler (Next.js v16+) */
  turbopack?: boolean
  /** Headless API project (Next.js v16+) */
  api?: boolean
  /** Apply a saved preset */
  preset?: string
  /** Show detailed output (config override messages) */
  verbose?: boolean
}

/**
 * Resolve the package manager — detect, warn if missing, prompt if needed.
 *
 * Config packageManager applies only when detectPackageManager returns 'default'
 * (no lockfile found, no CLI flag provided). Lockfile always wins over config.
 *
 * @returns The resolved package manager name
 */
async function resolvePackageManager(
  cwd: string,
  flagValue?: string,
  config?: Partial<TinkeriseUserConfig>,
  verbose?: boolean,
): Promise<PackageManager> {
  const pmResult = await detectPackageManager(cwd, flagValue)

  if (pmResult.source === 'binary-missing') {
    // Detected PM binary is not installed — warn and prompt
    p.log.warn(
      pc.yellow(`${pmResult.pm} was detected but is not installed. Choose a package manager:`),
    )
    return promptPackageManager()
  }

  // Config only applies when no lockfile and no CLI flag
  if (pmResult.source === 'default' && config?.packageManager) {
    p.log.info(pc.dim(`Using ${config.packageManager} (from config)`))
    return config.packageManager
  }

  if (pmResult.source === 'default') {
    // No lockfile or packageManager field found — prompt user to choose
    return promptPackageManager()
  }

  // Flag override message (verbose only)
  if (verbose && flagValue && config?.packageManager && flagValue !== config.packageManager) {
    p.log.info(pc.dim(`Overriding config (${config.packageManager} -> ${flagValue})`))
  }

  // Source is 'flag', 'lockfile', or 'packageManager-field' — use detected PM
  return pmResult.pm
}

/**
 * Build userFlags record from prompt/preselected options, CLI Command, and PM.
 *
 * Uses mergePromptAndFlags for --no-git/--no-install detection, then layers
 * on explicit boolean option flags, config typescript pre-selection, and
 * the resolved package manager.
 */
function buildUserFlags(
  promptOptions: string[],
  cmd: Command,
  cliOptions: ScaffoldOptions,
  pm: PackageManager,
  config?: Partial<TinkeriseUserConfig>,
): Record<string, string | boolean> {
  const flags = mergePromptAndFlags(promptOptions, cmd)

  // Config typescript pre-selection: applies when CLI --typescript not explicitly set
  if (config?.typescript === true && !cliOptions.typescript) {
    flags.typescript = true
  }

  // Override with explicit CLI flags if provided
  if (cliOptions.typescript)
    flags.typescript = true
  if (cliOptions.tailwind)
    flags.tailwind = true
  if (cliOptions.eslint)
    flags.eslint = true
  if (cliOptions.biome)
    flags.biome = true
  if (cliOptions.srcDir)
    flags['src-dir'] = true
  if (cliOptions.empty)
    flags.empty = true
  if (cliOptions.overwrite)
    flags.overwrite = true
  if (cliOptions.appRouter)
    flags['app-router'] = true
  if (cliOptions.reactCompiler)
    flags['react-compiler'] = true
  if (cliOptions.turbopack)
    flags.turbopack = true
  if (cliOptions.api)
    flags.api = true

  // String-value flags
  if (cliOptions.importAlias)
    flags['import-alias'] = cliOptions.importAlias
  if (cliOptions.template)
    flags.template = cliOptions.template

  // Add PM if not npm (npm is the default for upstream tools)
  if (pm !== 'npm') {
    flags['package-manager'] = pm
  }

  return flags
}

/**
 * Resolve config and preset data for the current scaffold invocation.
 *
 * Calls resolveConfig() with the optional preset name, and separately loads
 * the full PresetData if a preset is specified (for scaffold-specific fields
 * like framework, flags, and category that live outside the config layer).
 */
async function resolveConfigAndPreset(
  options: ScaffoldOptions,
): Promise<{ config: Partial<TinkeriseUserConfig>, preset: PresetData | null }> {
  const config = await resolveConfig({
    projectDir: process.cwd(),
    presetName: options.preset,
  })

  const preset = options.preset ? await loadPreset(options.preset) : null

  return { config, preset }
}

/**
 * Merge preset scaffold flags into preselected options array.
 *
 * Preset flags like { typescript: true, tailwind: true } become
 * preselected option values. CLI-provided preselected options take priority
 * (they're already in the array from buildPreselectedOptions).
 */
function mergePresetFlags(
  preset: PresetData | null,
  cliPreselected: string[],
): string[] {
  if (!preset?.scaffold.flags)
    return cliPreselected

  const presetOptions: string[] = []
  for (const [key, value] of Object.entries(preset.scaffold.flags)) {
    if (value === true) {
      presetOptions.push(key)
    }
  }

  // CLI preselected win (deduplicate)
  return [...new Set([...presetOptions, ...cliPreselected])]
}

/**
 * Execute the scaffolding pipeline with variant selection and summary card.
 *
 * Handles framework-specific variant prompts (Vite template, T3 components)
 * before delegating to executeScaffolder, then shows the enhanced summary card.
 */
async function executePipeline(
  framework: string,
  name: string,
  options: string[],
  cmd: Command,
  cliOptions: ScaffoldOptions,
  pm: PackageManager,
  config?: Partial<TinkeriseUserConfig>,
): Promise<void> {
  const userFlags = buildUserFlags(options, cmd, cliOptions, pm, config)

  // Framework-specific variant handling
  let extraArgs: string[] = []

  if (framework === 'vite') {
    // Vite: template selection + TypeScript merging
    const base = await selectViteTemplate(cliOptions.template)
    const resolved = resolveViteTemplate(base, !!cliOptions.typescript)
    extraArgs = ['--template', resolved]
    // Remove typescript and template from userFlags -- handled via template suffix / extraArgs
    delete userFlags.typescript
    delete userFlags.template
  }

  if (framework === 'next') {
    // Suppress interactive prompts: --yes uses defaults for unprovided options
    extraArgs.push('--yes')
  }

  if (framework === 't3') {
    // T3: component selection -> pass as individual flags
    const components = await selectT3Components()
    for (const comp of components) {
      extraArgs.push(`--${comp}`)
    }
    // Must pass --CI when any flags are present to suppress T3's own prompts (Pitfall 5)
    if (extraArgs.length > 0 || Object.keys(userFlags).length > 0) {
      extraArgs.push('--CI')
    }
  }

  await executeScaffolder({
    scaffolderName: framework,
    projectName: name,
    userFlags,
    extraArgs,
  })

  // Persist session context for cross-process reuse (tinkerise add)
  const absProjectPath = join(process.cwd(), name)
  setSessionContext({ framework, packageManager: pm, projectDir: absProjectPath })
  await writeSessionFile(absProjectPath, { framework, packageManager: pm })

  // Enhanced summary card instead of simple one-liner
  const activeFlags = Object.entries(userFlags)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
  tinkeriseSummaryCard(framework, name, activeFlags)
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

  const { config, preset } = await resolveConfigAndPreset(options)

  // Determine effective category: preset category or defaultCategory from config
  // Per CONF-01: skip category prompt entirely when defaultCategory is set
  let filterCategory: ScaffolderCategory | undefined

  if (preset?.scaffold.category) {
    // Preset category takes precedence
    filterCategory = preset.scaffold.category as ScaffolderCategory
  }
  else if (config.defaultCategory) {
    // Validate defaultCategory — invalid values fall back to unfiltered with a warning
    if (VALID_CATEGORIES.includes(config.defaultCategory as ScaffolderCategory)) {
      filterCategory = config.defaultCategory as ScaffolderCategory
    }
    else {
      p.log.warn(
        pc.yellow(`Invalid defaultCategory '${config.defaultCategory}' in config. Showing all frameworks.`),
      )
    }
  }

  const preselected = mergePresetFlags(preset, buildPreselectedOptions(cmd))
  const answers = await runPromptFlow({
    framework: preset?.scaffold.framework,
    preselectedOptions: preselected,
    filterCategory,
  })
  const pm = await resolvePackageManager(process.cwd(), options.packageManager, config, options.verbose)

  await executePipeline(answers.framework, answers.name, answers.options, cmd, options, pm, config)
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
    const validNames = VALID_CATEGORIES as readonly string[]
    const closest = findClosestMatch(category, [...validNames])
    throw new InvalidCategoryError(category, closest)
  }

  // CI guard: category provided but framework/name missing
  if (isCI) {
    ensureNonInteractive(cmd, category)
  }

  showBanner()

  const { config, preset } = await resolveConfigAndPreset(options)

  const preselected = mergePresetFlags(preset, buildPreselectedOptions(cmd))

  // Preset framework pre-fill: only use if preset category matches user-provided category.
  // If categories don't match, ignore preset framework (Pitfall 2 from research).
  const presetFramework
    = preset?.scaffold.framework && preset.scaffold.category === category
      ? preset.scaffold.framework
      : undefined

  const answers = await runPromptFlow({
    filterCategory: category as ScaffolderCategory,
    framework: presetFramework,
    preselectedOptions: preselected,
  })
  const pm = await resolvePackageManager(process.cwd(), options.packageManager, config, options.verbose)

  await executePipeline(answers.framework, answers.name, answers.options, cmd, options, pm, config)
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

  const { config, preset } = await resolveConfigAndPreset(options)

  const projectName = name ?? await promptProjectName(framework)
  const pm = await resolvePackageManager(process.cwd(), options.packageManager, config, options.verbose)

  const preselected = mergePresetFlags(preset, buildPreselectedOptions(cmd))

  // If we have preselected options, use them directly; otherwise use empty array
  // (direct execution skips the options multiselect)
  await executePipeline(framework, projectName, preselected, cmd, options, pm, config)
}
