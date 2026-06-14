/**
 * tinkerise.lock — the reproducible record of a scaffolded project.
 *
 * Written after a scaffold (and enhancement) run; consumed by `scaffold --from-lock`
 * and `tinkerise update`. The lock is a committed project artifact, not a cache.
 */
import { z } from 'zod'

/** Lock schema version. Bump on any breaking shape change. */
export const LOCK_SCHEMA_VERSION = 1

/** A single enhancement recorded in the lock; version is null when unknown. */
export const LockEnhancementSchema = z.object({
  id: z.string(),
  version: z.string().nullable(),
})

export const TinkeriseLockSchema = z.object({
  schemaVersion: z.literal(LOCK_SCHEMA_VERSION),
  framework: z.string(),
  category: z.enum(['web', 'backend', 'mobile', 'utility']),
  flags: z.record(z.string(), z.union([z.string(), z.boolean()])),
  enhancements: z.array(LockEnhancementSchema),
  packageManager: z.string(),
  /** tinkerise version that produced this lock */
  createdWith: z.string(),
})

export type LockEnhancement = z.infer<typeof LockEnhancementSchema>
export type TinkeriseLock = z.infer<typeof TinkeriseLockSchema>
