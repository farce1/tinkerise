/**
 * Zod schemas for runtime validation of enhancement module definitions.
 *
 * These schemas validate the structure of enhancement modules at runtime.
 * TypeScript interfaces are defined separately in types.ts. The schemas
 * use z.function() for detect/install fields — the functions are typed
 * via TypeScript, while Zod validates the overall data shape.
 */

import { z } from 'zod'

/** Validates DetectionResult shape */
export const DetectionResultSchema = z.object({
  /** Whether the enhancement is already configured */
  installed: z.boolean(),
  /** Config files found (for conflict resolution) */
  configFiles: z.array(z.string()),
  /** Partial installation detected (some files but not all) */
  partial: z.boolean(),
  /** Human-readable description of what was found */
  description: z.string().optional(),
})

/** Validates InstallResult shape */
export const InstallResultSchema = z.object({
  /** Whether installation succeeded */
  success: z.boolean(),
  /** Files created or modified */
  filesModified: z.array(z.string()),
  /** Packages added to package.json */
  packagesAdded: z.array(z.string()),
  /** Warning messages */
  warnings: z.array(z.string()),
})

/** Validates EnhancementModule shape */
export const EnhancementModuleSchema = z.object({
  /** Unique identifier, e.g., 'eslint', 'prettier', 'husky' */
  id: z.string(),
  /** Human-readable name for display */
  name: z.string(),
  /** One-line description */
  description: z.string(),
  /** Module IDs this depends on (for topological sort) */
  dependsOn: z.array(z.string()),
  /** Detect whether this enhancement is already configured */
  detect: z.function(),
  /** Install the enhancement into the project */
  install: z.function(),
})
