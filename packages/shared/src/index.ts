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
 * Lock — tinkerise.lock schema for reproducible projects (Tier B).
 */
export {
  LOCK_SCHEMA_VERSION,
  LockEnhancementSchema,
  TinkeriseLockSchema,
} from './lock/index.js'

export type {
  LockEnhancement,
  TinkeriseLock,
} from './lock/index.js'

/**
 * JSON output — Zod 4 envelope and per-command schemas for `--json` mode (Phase 33).
 */
export {
  DoctorCheckResultSchema,
  DoctorEnvelopeV1Schema,
  DoctorPayloadV1Schema,
  DoctorSummarySchema,
  ErrorPayloadSchema,
  ListEnhancementEntrySchema,
  ListEnvelopeV1Schema,
  ListPayloadV1Schema,
  ListScaffolderEntrySchema,
  ListTemplateEntrySchema,
  makeEnvelope,
  PresetListEnvelopeV1Schema,
  PresetListLocalEntrySchema,
  PresetListNpmEntrySchema,
  PresetListPayloadV1Schema,
  PresetShowDataV1Schema,
  PresetShowEnvelopeV1Schema,
  ScaffoldPlanEnvelopeV1Schema,
  ScaffoldPlanFlagSchema,
  ScaffoldPlanPayloadV1Schema,
  ScaffoldPlanPrerequisiteSchema,
} from './json-output/index.js'

export type {
  DoctorEnvelopeV1,
  DoctorPayloadV1,
  ErrorPayload,
  ListEnvelopeV1,
  ListPayloadV1,
  PresetListEnvelopeV1,
  PresetListPayloadV1,
  PresetShowEnvelopeV1,
  PresetShowPayloadV1,
  ScaffoldPlanEnvelopeV1,
  ScaffoldPlanPayloadV1,
} from './json-output/index.js'

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
