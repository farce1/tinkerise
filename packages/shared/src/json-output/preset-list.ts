/**
 * `tinkerise preset list --json` payload schema (v1).
 *
 * D-21: empty arrays preserved; D-22: optional `description` omitted when absent.
 */

import { z } from 'zod'
import { makeEnvelope } from './envelope.js'

export const PresetListLocalEntrySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

export const PresetListNpmEntrySchema = z.object({
  package: z.string(),
})

export const PresetListPayloadV1Schema = z.object({
  local: z.array(PresetListLocalEntrySchema),
  npm: z.array(PresetListNpmEntrySchema),
})

export const PresetListEnvelopeV1Schema = makeEnvelope('preset.list', PresetListPayloadV1Schema, 1)

export type PresetListPayloadV1 = z.infer<typeof PresetListPayloadV1Schema>
export type PresetListEnvelopeV1 = z.infer<typeof PresetListEnvelopeV1Schema>
