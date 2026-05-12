/**
 * `tinkerise doctor --json` payload schema (v1).
 *
 * Per D-23/D-24: data envelope always emitted (even on required-check failure);
 * exit code 1 signals failure via summary.requiredFailed > 0. Error envelope is
 * reserved for command-level failures (cannot load checks at all).
 *
 * Summary field naming is snake_case per D-24 (locked decision). Both
 * `requiredFailed` and `optionalFailed` are REQUIRED fields on the summary.
 */

import { z } from 'zod'
import { makeEnvelope } from './envelope.js'

export const DoctorCheckResultSchema = z.object({
  /** Tool display name (e.g., 'Node.js', 'Python') */
  tool: z.string(),
  /** Executable command (e.g., 'node', 'python3') */
  command: z.string(),
  /** Doctor category (e.g., 'Runtimes', 'Scaffolder Tools') */
  category: z.string(),
  /** Whether this check is required for tinkerise to function (D-11) */
  required: z.boolean(),
  /** Semver range, e.g., '>=20.11.0' (omitted if no range constraint) */
  versionRange: z.string().optional(),
  /** Whether the check passed */
  ok: z.boolean(),
  /** Detected version string (omitted on failure) */
  version: z.string().optional(),
  /** Failure detail (omitted on success) */
  error: z.string().optional(),
  /** Platform-specific install hint (omitted on success) */
  installInstructions: z.string().optional(),
})

export const DoctorSummarySchema = z.object({
  /** Total checks executed */
  total: z.number().int().nonnegative(),
  /** Checks that passed */
  passed: z.number().int().nonnegative(),
  /** Checks that failed (required + optional combined) */
  failed: z.number().int().nonnegative(),
  /** Required checks that failed — drives exit code 1 per D-11/D-24 (snake_case per D-24) */
  requiredFailed: z.number().int().nonnegative(),
  /** Optional checks that failed — informational; never drives exit code (snake_case per D-24) */
  optionalFailed: z.number().int().nonnegative(),
})

export const DoctorPayloadV1Schema = z.object({
  checks: z.array(DoctorCheckResultSchema),
  summary: DoctorSummarySchema,
})

export const DoctorEnvelopeV1Schema = makeEnvelope('doctor', DoctorPayloadV1Schema, 1)

export type DoctorPayloadV1 = z.infer<typeof DoctorPayloadV1Schema>
export type DoctorEnvelopeV1 = z.infer<typeof DoctorEnvelopeV1Schema>
