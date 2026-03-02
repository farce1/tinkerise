/**
 * Zod validation schemas for tinkerise user config and preset data.
 *
 * These schemas mirror the interfaces in types.ts and provide runtime
 * validation for config files, preset JSON, and CLI input.
 */

import { z } from 'zod'

/**
 * Safe identifier pattern for project and preset names.
 *
 * - lower-case alphanumeric first character
 * - then lower-case alphanumeric / dot / underscore / hyphen
 * - max length 64 to keep file and package names manageable
 */
export const SAFE_NAME_REGEX = /^[a-z0-9][a-z0-9._-]{0,63}$/
export const SAFE_NAME_RULES
  = 'Use lowercase letters, numbers, hyphens, dots, and underscores (must start with letter or number, max 64 chars)'

/**
 * Schema for project names used by scaffolding commands.
 */
export const ProjectNameSchema = z.string().regex(SAFE_NAME_REGEX, SAFE_NAME_RULES)

/**
 * Schema for preset names used in local preset file names.
 */
export const PresetNameSchema = z.string().regex(SAFE_NAME_REGEX, SAFE_NAME_RULES)

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
  name: PresetNameSchema,
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
