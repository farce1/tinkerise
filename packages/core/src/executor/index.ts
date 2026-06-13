/**
 * Executor module — the end-to-end detect-map-execute pipeline.
 *
 * Pipeline: registry lookup -> validate flags -> check prereqs ->
 *           detect version -> resolve flags -> spawn -> summary
 */

import type { Prerequisite, ScaffolderEntry } from '@tinkerise/shared'
import type { ResolvedFlagMapping } from '../flags/resolver.js'
import { ProjectNameSchema } from '@tinkerise/shared'
import { ConfigValidationError, ScaffolderExitError, ScaffolderNotFoundError } from '../errors/index.js'
import { resolveFlags } from '../flags/resolver.js'
import { validateFlagApplicability } from '../flags/validator.js'
import { checkPrerequisites } from '../prerequisites/checker.js'
import { getScaffolder } from '../registry/index.js'
import { tinkeriseBlankLine, tinkeriseLog } from './framing.js'
import { spawnScaffolder } from './process.js'
import { detectUpstreamVersion } from './version.js'

export { ScaffolderExitError, ScaffolderNotFoundError } from '../errors/index.js'

export interface ExecuteOptions {
  /** Scaffolder name to look up in registry */
  scaffolderName: string
  /** Project name (directory to create) */
  projectName: string
  /** Unified flags from the user */
  userFlags: Record<string, string | boolean>
  /** Args after -- to pass through to upstream tool */
  passthroughArgs?: string[]
  /** Framework-specific args (Vite template, T3 components) */
  extraArgs?: string[]
  /** Working directory */
  cwd?: string
  /** When true, build the plan and return it without enforcing prereqs or spawning */
  dryRun?: boolean
}

/**
 * The fully-resolved scaffolding plan — what `executeScaffolder` would run.
 * Returned for every invocation; in dry-run mode it is returned without side effects.
 */
export interface ScaffoldPlan {
  scaffolderName: string
  /** Executable to invoke, e.g. 'npx' */
  command: string
  /** Full argument vector passed to the executable */
  args: string[]
  /** Prerequisites that would be enforced before a real run */
  prerequisites: Prerequisite[]
  /** Per-flag unified→native attribution (for --explain) */
  resolvedFlags: ResolvedFlagMapping[]
  /** Version range whose flag mappings were used (null = base flags) */
  versionUsed: string | null
  /** Detected upstream tool version (null when undetected/absent) */
  upstreamVersion: string | null
}

/**
 * Execute the full detect-map-execute pipeline.
 */
export async function executeScaffolder(options: ExecuteOptions): Promise<ScaffoldPlan> {
  const { scaffolderName, projectName, userFlags, passthroughArgs = [], extraArgs = [], cwd, dryRun = false } = options
  const parsedProjectName = ProjectNameSchema.safeParse(projectName)
  if (!parsedProjectName.success) {
    throw new ConfigValidationError('projectName', projectName, 'lowercase letters, numbers, hyphens, dots, underscores; max 64 chars')
  }

  // 1. Resolve scaffolder from registry
  const entry = getScaffolder(scaffolderName)
  if (!entry) {
    throw new ScaffolderNotFoundError(scaffolderName)
  }

  // 2. Validate flags apply to this scaffolder
  validateFlagApplicability(entry, userFlags)

  // 3. Detect upstream version (non-fatal — null when the tool is absent)
  const upstreamVersion = await detectUpstreamVersion(entry)

  // 4. Resolve flags (with per-flag breakdown for --explain)
  const { args: nativeArgs, versionUsed, breakdown } = resolveFlags({
    entry,
    userFlags,
    upstreamVersion,
  })

  // 5. Build final command args based on integration strategy (REG-04).
  // Merge nativeArgs with extraArgs (framework-specific like Vite template, T3 components)
  const allNativeArgs = [...nativeArgs, ...extraArgs]
  const commandArgs = buildCommandArgs(entry, parsedProjectName.data, allNativeArgs, passthroughArgs)

  const plan: ScaffoldPlan = {
    scaffolderName,
    command: entry.command,
    args: commandArgs,
    prerequisites: entry.prerequisites,
    resolvedFlags: breakdown,
    versionUsed,
    upstreamVersion,
  }

  // 6. Dry run: return the plan with zero side effects (no prereq enforcement, no spawn).
  if (dryRun) {
    return plan
  }

  // 7. Enforce prerequisites, then spawn with inherited stdio (UX-06).
  // Version is detected earlier (needed to build the plan), but we keep the
  // user-facing log order identical to the pre-dry-run behavior:
  // prerequisites -> detected version -> flag mappings -> running.
  tinkeriseLog('Checking prerequisites...')
  await checkPrerequisites(entry.prerequisites)

  if (upstreamVersion) {
    tinkeriseLog(`Detected ${entry.packageName} v${upstreamVersion}`)
  }
  if (versionUsed) {
    tinkeriseLog(`Using flag mappings for version range ${versionUsed}`)
  }
  tinkeriseLog(`Running ${entry.command} ${commandArgs.join(' ')}`)
  tinkeriseBlankLine()

  const result = await spawnScaffolder(entry.command, commandArgs, { cwd })

  tinkeriseBlankLine()

  if (result.exitCode !== 0) {
    throw new ScaffolderExitError(scaffolderName, result.exitCode)
  }

  // Note: Summary output is handled by the CLI layer (tinkeriseSummaryCard)
  // for the enhanced post-scaffold experience.
  return plan
}

/**
 * Build command arguments based on integration strategy (REG-04).
 *
 * Exported for testing.
 */
export function buildCommandArgs(
  entry: ScaffolderEntry,
  projectName: string,
  nativeArgs: string[],
  passthroughArgs: string[],
): string[] {
  const args: string[] = []

  switch (entry.integration.type) {
    case 'delegate':
      // Split on spaces to handle multi-word commands
      // e.g., '@tanstack/cli create' -> ['@tanstack/cli', 'create']
      args.push(...entry.integration.command.split(/\s+/), projectName, ...nativeArgs)
      break
    case 'wrap':
      args.push(...entry.integration.command.split(/\s+/), projectName, ...nativeArgs)
      break
    case 'template':
      args.push(projectName, ...nativeArgs)
      break
  }

  // Per user decision: "Support raw flag passthrough with -- separator"
  if (passthroughArgs.length > 0) {
    args.push('--', ...passthroughArgs)
  }

  return args
}

// Re-export framing utilities for use by CLI layer
export { tinkeriseBlankLine, tinkeriseLog, tinkeriseSummaryCard } from './framing.js'
