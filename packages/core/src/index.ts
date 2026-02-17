/**
 * @tinkerise/core — Business logic for tinkerise CLI.
 */

import { VERSION } from '@tinkerise/shared'

/**
 * Returns the current tinkerise version.
 */
export function getVersion(): string {
  return VERSION
}

/**
 * Registry — scaffolder lookup and resolution.
 */
export {
  getAllScaffolders,
  getScaffolder,
  getScaffoldersByCategory,
} from './registry/index.js'

/**
 * Flags — unified-to-native flag mapping and validation.
 */
export {
  FlagNotApplicableError,
  resolveFlags,
  validateFlagApplicability,
} from './flags/index.js'
export type { ResolveFlagsOptions, ResolveFlagsResult } from './flags/index.js'

/**
 * Prerequisites — tool existence and version validation.
 */
export {
  checkPrerequisite,
  checkPrerequisites,
  PrerequisiteError,
} from './prerequisites/index.js'
export type { PrereqResult } from './prerequisites/index.js'
export { detectPlatform, getInstallInstructions } from './prerequisites/index.js'
export type { Platform } from './prerequisites/index.js'

/**
 * Executor — the end-to-end detect-map-execute pipeline.
 */
export {
  buildCommandArgs,
  executeScaffolder,
  ScaffolderExitError,
  ScaffolderNotFoundError,
  tinkeriseBlankLine,
  tinkeriseLog,
  tinkeriseSummary,
} from './executor/index.js'
export type { ExecuteOptions } from './executor/index.js'
