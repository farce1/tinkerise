/**
 * Registry module — schemas, types, and helpers for the scaffolder registry.
 */

export {
  FlagMappingSchema,
  IntegrationStrategySchema,
  PrerequisiteSchema,
  ScaffolderEntrySchema,
  VersionedFlagMapSchema,
} from './schemas.js'

export type {
  FlagMapping,
  IntegrationStrategy,
  Prerequisite,
  ScaffolderEntry,
  VersionedFlagMap,
} from './types.js'

export { defineScaffolder } from './define.js'
