/**
 * `tinkerise preset show <name> --json` payload schema (v1).
 *
 * Mirrors PresetData shape (packages/shared/src/config/schemas.ts) but owns
 * its own schemaVersion per D-01. filePath omitted when source = 'npm' (D-22).
 */

import { z } from 'zod'
import { makeEnvelope } from './envelope.js'

export const PresetShowDataV1Schema = z.object({
  /** Preset name (without 'tinkerise-preset-' prefix for npm sources) */
  name: z.string(),
  /** Optional human-readable description */
  description: z.string().optional(),
  /** Where this preset was loaded from */
  source: z.enum(['local', 'npm']),
  /** Absolute filesystem path (only present when source === 'local') */
  filePath: z.string().optional(),
  /** Scaffold configuration block */
  scaffold: z.object({
    framework: z.string(),
    category: z.string(),
    flags: z.record(z.string(), z.union([z.string(), z.boolean()])),
  }),
  /** Enhancement IDs to apply after scaffold (empty array preserved per D-21) */
  enhancements: z.array(z.string()),
  /** User config overrides — Partial<TinkeriseUserConfig> */
  config: z.object({
    packageManager: z.enum(['npm', 'pnpm', 'yarn', 'bun']).optional(),
    typescript: z.boolean().optional(),
    defaultCategory: z.enum(['web', 'backend', 'mobile']).optional(),
  }),
})

export const PresetShowEnvelopeV1Schema = makeEnvelope('preset.show', PresetShowDataV1Schema, 1)

export type PresetShowPayloadV1 = z.infer<typeof PresetShowDataV1Schema>
export type PresetShowEnvelopeV1 = z.infer<typeof PresetShowEnvelopeV1Schema>
