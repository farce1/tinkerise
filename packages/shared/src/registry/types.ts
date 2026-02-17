/**
 * TypeScript types inferred from Zod schemas.
 *
 * Using z.infer<> ensures types and runtime validation are always in sync.
 */

import type { z } from 'zod'
import type {
  FlagMappingSchema,
  IntegrationStrategySchema,
  PrerequisiteSchema,
  ScaffolderEntrySchema,
  VersionedFlagMapSchema,
} from './schemas.js'

/** Complete scaffolder registry entry */
export type ScaffolderEntry = z.infer<typeof ScaffolderEntrySchema>

/** Maps a tinkerise unified flag to a native upstream flag */
export type FlagMapping = z.infer<typeof FlagMappingSchema>

/** Tool prerequisite with version requirements */
export type Prerequisite = z.infer<typeof PrerequisiteSchema>

/** How tinkerise invokes the upstream tool */
export type IntegrationStrategy = z.infer<typeof IntegrationStrategySchema>

/** Version-specific flag mapping override */
export type VersionedFlagMap = z.infer<typeof VersionedFlagMapSchema>
