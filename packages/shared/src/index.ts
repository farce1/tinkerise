/**
 * @tinkerise/shared — Types, constants, and utilities shared across all tinkerise packages.
 */

/**
 * Current tinkerise version. Updated at release time.
 */
export const VERSION = '0.0.0'

/**
 * Supported scaffolder categories.
 */
export type ScaffolderCategory = 'web' | 'backend' | 'mobile' | 'utility'

/**
 * Config — user config types, Zod schemas, and defineConfig helper.
 */
export { defineConfig } from './config/define-config.js'

export {
  PresetDataSchema,
  PresetNameSchema,
  ProjectNameSchema,
  SAFE_NAME_REGEX,
  SAFE_NAME_RULES,
  TinkeriseUserConfigSchema,
} from './config/schemas.js'

export type {
  PresetData,
  TinkeriseUserConfig,
} from './config/types.js'

/**
 * Registry — schemas, types, and helpers for the scaffolder registry.
 */
export {
  defineScaffolder,
  FlagMappingSchema,
  IntegrationStrategySchema,
  PrerequisiteSchema,
  ScaffolderEntrySchema,
  VersionedFlagMapSchema,
} from './registry/index.js'

export type {
  FlagMapping,
  IntegrationStrategy,
  Prerequisite,
  ScaffolderEntry,
  VersionedFlagMap,
} from './registry/index.js'
