/**
 * `tinkerise … --dry-run --json` payload schema (v1).
 *
 * Mirrors the core ScaffoldPlan: the exact upstream command tinkerise would run,
 * plus the per-flag unified→native breakdown and prerequisites (for --explain).
 */

import { z } from 'zod'
import { makeEnvelope } from './envelope.js'

export const ScaffoldPlanFlagSchema = z.object({
  /** Unified tinkerise flag name, e.g. 'typescript' */
  unified: z.string(),
  /** Native args this flag produced, e.g. ['--typescript'] */
  native: z.array(z.string()),
})

export const ScaffoldPlanPrerequisiteSchema = z.object({
  /** Executable name, e.g. 'node' */
  command: z.string(),
  /** Semver range, e.g. '>=20.11.0' (omitted when unversioned) */
  versionRange: z.string().nullish(),
})

export const ScaffoldPlanPayloadV1Schema = z.object({
  /** Scaffolder ID, e.g. 'next' */
  scaffolderName: z.string(),
  /** Executable to invoke, e.g. 'npx' */
  command: z.string(),
  /** Full argument vector passed to the executable */
  args: z.array(z.string()),
  /** Per-flag unified→native attribution */
  resolvedFlags: z.array(ScaffoldPlanFlagSchema),
  /** Version range whose flag mappings were used (null = base flags) */
  versionUsed: z.string().nullable(),
  /** Detected upstream tool version (null when undetected/absent) */
  upstreamVersion: z.string().nullable(),
  /** Prerequisites that would be enforced before a real run */
  prerequisites: z.array(ScaffoldPlanPrerequisiteSchema),
})

export const ScaffoldPlanEnvelopeV1Schema = makeEnvelope('scaffold.plan', ScaffoldPlanPayloadV1Schema, 1)

export type ScaffoldPlanPayloadV1 = z.infer<typeof ScaffoldPlanPayloadV1Schema>
export type ScaffoldPlanEnvelopeV1 = z.infer<typeof ScaffoldPlanEnvelopeV1Schema>
