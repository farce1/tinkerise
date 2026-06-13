/**
 * Flag resolver — maps unified tinkerise flags to native upstream flags
 * with version-aware resolution (REG-02, REG-05).
 */

import type { FlagMapping, ScaffolderEntry } from '@tinkerise/shared'
import semver from 'semver'

export interface ResolveFlagsOptions {
  /** Registry entry for the scaffolder */
  entry: ScaffolderEntry
  /** Unified flags from the user, e.g., { typescript: true, tailwind: true } */
  userFlags: Record<string, string | boolean>
  /** Detected upstream version, or null if unknown */
  upstreamVersion?: string | null
}

export interface ResolvedFlagMapping {
  /** Unified flag name, e.g., 'typescript' */
  unified: string
  /** Native args this flag produced, e.g., ['--typescript'] */
  native: string[]
}

export interface ResolveFlagsResult {
  /** Native CLI args to pass to the upstream tool */
  args: string[]
  /** Which version range matched (null = base flags used) */
  versionUsed: string | null
  /** Per-flag attribution: which native args each unified flag produced (for --explain) */
  breakdown: ResolvedFlagMapping[]
}

/**
 * Resolve unified flags to native upstream args.
 *
 * If an upstream version is detected and matches a versionedFlags range,
 * those flags override the base flags. Otherwise, base flags are used.
 */
export function resolveFlags(options: ResolveFlagsOptions): ResolveFlagsResult {
  const { entry, userFlags, upstreamVersion } = options

  let activeFlagDefs: FlagMapping[] = entry.flags
  let versionUsed: string | null = null

  // Version-aware override: find matching versioned flags
  if (upstreamVersion && entry.versionedFlags?.length) {
    const match = entry.versionedFlags.find(vf =>
      semver.satisfies(upstreamVersion, vf.versionRange),
    )
    if (match) {
      activeFlagDefs = match.flags
      versionUsed = match.versionRange
    }
  }

  // Map unified flags to native args, attributing each flag's output for --explain.
  const args: string[] = []
  const breakdown: ResolvedFlagMapping[] = []
  for (const flagDef of activeFlagDefs) {
    const userValue = userFlags[flagDef.unified]
    if (userValue === undefined)
      continue

    const nativeForFlag: string[] = []
    if (userValue === false && flagDef.nativeDisable) {
      // User explicitly disabled (e.g., --no-typescript)
      nativeForFlag.push(...flagDef.nativeDisable.split(/\s+/))
    }
    else if (userValue === true) {
      // Split on whitespace to handle multi-word native flags
      // e.g., '--add tailwindcss' -> ['--add', 'tailwindcss']
      // Empty string sentinel (silent/no-op flags) produces no args
      if (flagDef.native)
        nativeForFlag.push(...flagDef.native.split(/\s+/))
    }
    else if (typeof userValue === 'string' && flagDef.valueMap) {
      // Value flag with mapping (e.g., --package-manager pnpm)
      const mapped = flagDef.valueMap[userValue]
      if (mapped) {
        // Prefix-style: '--use-' + 'pnpm' = '--use-pnpm'
        if (flagDef.native.endsWith('-')) {
          nativeForFlag.push(`${flagDef.native}${mapped}`)
        }
        else {
          nativeForFlag.push(...flagDef.native.split(/\s+/), mapped)
        }
      }
    }
    else if (typeof userValue === 'string') {
      nativeForFlag.push(...flagDef.native.split(/\s+/), userValue)
    }

    // Only record flags that actually produced native args (preserves flat-arg order).
    if (nativeForFlag.length > 0) {
      args.push(...nativeForFlag)
      breakdown.push({ unified: flagDef.unified, native: nativeForFlag })
    }
  }

  return { args, versionUsed, breakdown }
}
