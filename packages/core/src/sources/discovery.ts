/**
 * npm source discovery (Tier C) — find installed tinkerise-scaffolder-* and
 * tinkerise-enhancement-* packages in a project's package.json. Mirrors
 * discoverNpmPresets; offline and side-effect-free (listing only, no load).
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

/** Unscoped prefixes for external source packages. */
const SOURCE_PREFIXES = ['tinkerise-scaffolder-', 'tinkerise-enhancement-']

/** Pattern for scoped packages like @org/tinkerise-scaffolder-x. */
const SCOPED_SOURCE_PATTERN = /^@.+\/tinkerise-(?:scaffolder|enhancement)-/

function isSourcePackage(name: string): boolean {
  return SOURCE_PREFIXES.some(p => name.startsWith(p)) || SCOPED_SOURCE_PATTERN.test(name)
}

/**
 * Discover external source packages declared in a project's package.json
 * (dependencies + devDependencies). Returns an empty array when the file is
 * missing or has no matching packages.
 */
export async function discoverNpmSources(projectDir: string): Promise<string[]> {
  try {
    const pkg: unknown = JSON.parse(await readFile(path.join(projectDir, 'package.json'), 'utf-8'))
    if (typeof pkg !== 'object' || pkg === null)
      return []

    const record = pkg as Record<string, unknown>
    const names = (key: string): string[] =>
      (typeof record[key] === 'object' && record[key] !== null)
        ? Object.keys(record[key] as Record<string, unknown>)
        : []

    return [...names('dependencies'), ...names('devDependencies')].filter(isSourcePackage)
  }
  catch {
    return []
  }
}
