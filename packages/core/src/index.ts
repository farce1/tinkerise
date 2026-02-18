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
  tinkeriseSummaryCard,
} from './executor/index.js'
export type { ExecuteOptions } from './executor/index.js'

/**
 * Package Manager Detection — lockfile, packageManager field, flag override.
 */
export {
  detectFromLockfile,
  detectFromPackageJson,
  detectPackageManager,
  verifyPmBinary,
} from './pm/index.js'
export type { DetectResult, PackageManager } from './pm/index.js'

/**
 * CI Detection — environment detection for non-interactive mode.
 */
export { ciName, isCI } from './ci/index.js'

/**
 * Metadata — scaffolder display names, descriptions, and suggestions.
 */
export { getScaffolderMetadata, SCAFFOLDER_METADATA } from './registry/metadata.js'
export type { ScaffolderMetadata } from './registry/metadata.js'

/**
 * Enhancements — module system for post-scaffold tooling setup.
 */
export {
  allEnhancementModules,
  buildProjectContext,
  ciModule,
  CyclicDependencyError,
  defineEnhancement,
  dependencyVersionMap,
  detectFramework,
  ENHANCEMENT_NEXT_STEPS,
  enhancementRegistry,
  eslintModule,
  formatColoredDiff,
  huskyModule,
  mergeConfigs,
  prettierModule,
  runEnhancements,
  showEnhancementSummary,
  showFileDiff,
  showPerEnhancementSummary,
  topologicalSort,
} from './enhancements/index.js'
export type {
  BuildContextOptions,
  ConflictAction,
  DependencyName,
  DetectionResult,
  EnhancementExecutorOptions,
  EnhancementModule,
  EnhancementNextSteps,
  ExecutionSummary,
  FrameworkId,
  InstallResult,
  ProjectContext,
} from './enhancements/index.js'

/**
 * Config — global config read/write operations.
 */
export {
  getConfigDir,
  getConfigPath,
  getGlobalConfigValue,
  loadGlobalConfig,
  saveGlobalConfig,
  setGlobalConfigValue,
} from './config/index.js'
