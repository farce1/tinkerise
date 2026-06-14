/**
 * tinkerise.lock — build and persist the reproducible record of a scaffold.
 *
 * Unlike the session file, the lock is a committed project artifact (the input
 * for `scaffold --from-lock` and `tinkerise update`), so it is never gitignored.
 */

import type { TinkeriseLock } from '@tinkerise/shared'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getScaffolder } from '@tinkerise/core'
import { LOCK_SCHEMA_VERSION, TinkeriseLockSchema, VERSION } from '@tinkerise/shared'

/** Lock filename written to the scaffolded project root. */
export const LOCK_FILENAME = 'tinkerise.lock'

export interface BuildLockInput {
  framework: string
  flags: Record<string, string | boolean>
  packageManager: string
}

/**
 * Build a schema-validated lock for a scaffolded project. The category is
 * derived from the registry so callers only need the framework.
 */
export function buildLock(input: BuildLockInput): TinkeriseLock {
  const entry = getScaffolder(input.framework)
  if (!entry)
    throw new Error(`Cannot build lock: unknown framework '${input.framework}'`)

  return TinkeriseLockSchema.parse({
    schemaVersion: LOCK_SCHEMA_VERSION,
    framework: input.framework,
    category: entry.category,
    flags: input.flags,
    enhancements: [],
    packageManager: input.packageManager,
    createdWith: VERSION,
  })
}

/** Write the lock as pretty JSON to `tinkerise.lock` in the project directory. */
export async function writeLockFile(projectDir: string, lock: TinkeriseLock): Promise<void> {
  await writeFile(
    join(projectDir, LOCK_FILENAME),
    `${JSON.stringify(lock, null, 2)}\n`,
    'utf-8',
  )
}
