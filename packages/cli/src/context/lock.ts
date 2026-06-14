/**
 * tinkerise.lock — build and persist the reproducible record of a scaffold.
 *
 * Unlike the session file, the lock is a committed project artifact (the input
 * for `scaffold --from-lock` and `tinkerise update`), so it is never gitignored.
 */

import type { TinkeriseLock } from '@tinkerise/shared'
import { readFile, writeFile } from 'node:fs/promises'
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

/** Read and validate the lock from a project directory; null if missing or invalid. */
export async function readLockFile(projectDir: string): Promise<TinkeriseLock | null> {
  try {
    const raw = await readFile(join(projectDir, LOCK_FILENAME), 'utf-8')
    const parsed = TinkeriseLockSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  }
  catch {
    return null
  }
}

/**
 * Record applied enhancements in the existing lock (deduped, version unknown).
 * No-op when the project has no lock — there is nothing to keep reproducible.
 */
export async function recordEnhancements(projectDir: string, ids: string[]): Promise<void> {
  if (ids.length === 0)
    return

  const lock = await readLockFile(projectDir)
  if (!lock)
    return

  const known = new Set(lock.enhancements.map(e => e.id))
  const added = ids.filter(id => !known.has(id)).map(id => ({ id, version: null }))
  if (added.length === 0)
    return

  await writeLockFile(projectDir, { ...lock, enhancements: [...lock.enhancements, ...added] })
}
