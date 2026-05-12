/**
 * `tinkerise list --json` payload schema (v1).
 *
 * Mirrors the human `tinkerise list` output: scaffolders by category with
 * prereq status, top-level utility templates, and enhancement modules.
 */

import { z } from 'zod'
import { makeEnvelope } from './envelope.js'

export const ListScaffolderEntrySchema = z.object({
  /** Scaffolder ID (e.g., 'next', 'astro') */
  name: z.string(),
  /** Category bucket */
  category: z.enum(['web', 'backend', 'mobile', 'utility']),
  /** Human-friendly display name (omitted if metadata absent) */
  displayName: z.string().optional(),
  /** Short description (omitted if metadata absent) */
  description: z.string().optional(),
  /** Upstream package name (e.g., 'create-next-app') */
  packageName: z.string(),
  /** Whether all prerequisites resolved successfully */
  prereqOk: z.boolean(),
  /** Native flag identifiers supported by this scaffolder */
  supportedFlags: z.array(z.string()),
})

export const ListTemplateEntrySchema = z.object({
  id: z.string(),
  command: z.string(),
  displayName: z.string(),
  description: z.string(),
})

export const ListEnhancementEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

export const ListPayloadV1Schema = z.object({
  scaffolders: z.array(ListScaffolderEntrySchema),
  templates: z.array(ListTemplateEntrySchema),
  enhancements: z.array(ListEnhancementEntrySchema),
})

export const ListEnvelopeV1Schema = makeEnvelope('list', ListPayloadV1Schema, 1)

export type ListPayloadV1 = z.infer<typeof ListPayloadV1Schema>
export type ListEnvelopeV1 = z.infer<typeof ListEnvelopeV1Schema>
