/**
 * Executor module — the end-to-end detect-map-execute pipeline.
 *
 * Pipeline: registry lookup -> validate flags -> check prereqs ->
 *           detect version -> resolve flags -> spawn -> summary
 */

import type { ScaffolderEntry } from '@tinkerise/shared'
import { ScaffolderExitError, ScaffolderNotFoundError } from '../errors/index.js'
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
}

/**
 * Execute the full detect-map-execute pipeline.
 */
export async function executeScaffolder(options: ExecuteOptions): Promise<void> {
  const { scaffolderName, projectName, userFlags, passthroughArgs = [], extraArgs = [], cwd } = options

  // 1. Resolve scaffolder from registry
  const entry = getScaffolder(scaffolderName)
  if (!entry) {
    throw new ScaffolderNotFoundError(scaffolderName)
  }

  // 2. Validate flags apply to this scaffolder
  validateFlagApplicability(entry, userFlags)

  // 3. Check prerequisites
  tinkeriseLog('Checking prerequisites...')
  await checkPrerequisites(entry.prerequisites)

  // 4. Detect upstream version (non-fatal)
  const upstreamVersion = await detectUpstreamVersion(entry)
  if (upstreamVersion) {
    tinkeriseLog(`Detected ${entry.packageName} v${upstreamVersion}`)
  }

  // 5. Resolve flags
  const { args: nativeArgs, versionUsed } = resolveFlags({
    entry,
    userFlags,
    upstreamVersion,
  })

  if (versionUsed) {
    tinkeriseLog(`Using flag mappings for version range ${versionUsed}`)
  }

  // 6. Build final command args based on integration strategy (REG-04)
  // Merge nativeArgs with extraArgs (framework-specific like Vite template, T3 components)
  const allNativeArgs = [...nativeArgs, ...extraArgs]
  const commandArgs = buildCommandArgs(entry, projectName, allNativeArgs, passthroughArgs)

  tinkeriseLog(`Running ${entry.command} ${commandArgs.join(' ')}`)
  tinkeriseBlankLine()

  // 7. Spawn with inherited stdio (UX-06)
  const result = await spawnScaffolder(entry.command, commandArgs, { cwd })

  tinkeriseBlankLine()

  if (result.exitCode !== 0) {
    throw new ScaffolderExitError(scaffolderName, result.exitCode)
  }

  // Note: Summary output is handled by the CLI layer (tinkeriseSummaryCard)
  // for the enhanced post-scaffold experience.
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
