/**
 * Zod validation schemas for tinkerise user config and preset data.
 *
 * These schemas mirror the interfaces in types.ts and provide runtime
 * validation for config files, preset JSON, and CLI input.
 */

import { z } from 'zod'

/**
 * Schema for TinkeriseUserConfig — all fields optional.
 */
export const TinkeriseUserConfigSchema = z.object({
  /** Preferred package manager */
  packageManager: z.enum(['npm', 'pnpm', 'yarn', 'bun']).optional(),
  /** Whether to enable TypeScript by default */
  typescript: z.boolean().optional(),
  /** Default scaffolder category */
  defaultCategory: z.enum(['web', 'backend', 'mobile']).optional(),
})

/**
 * Schema for PresetData — captures a reusable project setup recipe.
 */
export const PresetDataSchema = z.object({
  /** Schema version — must be 1 */
  version: z.literal(1),
  /** Human-readable preset name */
  name: z.string(),
  /** Optional description */
  description: z.string().optional(),
  /** Scaffold configuration */
  scaffold: z.object({
    /** Framework/scaffolder ID */
    framework: z.string(),
    /** Scaffolder category */
    category: z.string(),
    /** Flag overrides */
    flags: z.record(z.string(), z.union([z.string(), z.boolean()])),
  }),
  /** Enhancement module IDs */
  enhancements: z.array(z.string()),
  /** User config overrides */
  config: TinkeriseUserConfigSchema.partial(),
})
