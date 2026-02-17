/**
 * Flag applicability validator — errors when a user passes a unified flag
 * that doesn't apply to the chosen scaffolder.
 *
 * Per user decision: "Error and stop when a user passes a unified flag
 * that doesn't apply to the chosen scaffolder."
 */

import type { ScaffolderEntry } from '@tinkerise/shared'

/**
 * Error thrown when a user flag doesn't apply to the chosen scaffolder.
 */
export class FlagNotApplicableError extends Error {
  constructor(
    public readonly flag: string,
    public readonly scaffolderName: string,
  ) {
    super(`Flag '--${flag}' does not apply to scaffolder '${scaffolderName}'`)
    this.name = 'FlagNotApplicableError'
  }
}

/**
 * Validate that all user-provided flags apply to the chosen scaffolder.
 *
 * Collects all known unified flag names from base and versioned flag sets.
 * Throws FlagNotApplicableError for any unknown flag.
 */
export function validateFlagApplicability(
  entry: ScaffolderEntry,
  userFlags: Record<string, string | boolean>,
): void {
  // Collect all known unified flag names from base + versioned flags
  const knownFlags = new Set<string>()
  for (const f of entry.flags)
    knownFlags.add(f.unified)
  if (entry.versionedFlags) {
    for (const vf of entry.versionedFlags) {
      for (const f of vf.flags)
        knownFlags.add(f.unified)
    }
  }

  // Check each user flag
  for (const flagName of Object.keys(userFlags)) {
    if (!knownFlags.has(flagName)) {
      throw new FlagNotApplicableError(flagName, entry.name)
    }
  }
}
