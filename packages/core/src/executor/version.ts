/**
 * Upstream version detection for version-aware flag mapping (REG-05).
 *
 * Per user decision: no caching — detect fresh every run.
 */

import { execa } from 'execa'
import semver from 'semver'
import type { ScaffolderEntry } from '@tinkerise/shared'

/**
 * Detect the installed version of an upstream scaffolder tool.
 *
 * Returns null if version cannot be detected (non-fatal, falls back to base flags).
 */
export async function detectUpstreamVersion(entry: ScaffolderEntry): Promise<string | null> {
  // Only detect if there are version-specific flag mappings
  if (!entry.versionedFlags?.length)
    return null

  try {
    const { stdout } = await execa(entry.command, [entry.packageName, '--version'], {
      reject: false,
      timeout: 10_000,
    })

    const version = semver.coerce(stdout.trim())
    return version?.version ?? null
  }
  catch {
    return null
  }
}
