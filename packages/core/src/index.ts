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
 * CI Detection — environment detection for non-interactive mode.
 */
export { ciName, isCI } from './ci/index.js'

/**
 * Config — global config, project config, merge chain, resolve orchestrator,
 * preset CRUD, npm preset discovery.
 */
export {
  CONFIG_FILENAME,
  getConfigDir,
  getConfigPath,
  getGlobalConfigValue,
  loadGlobalConfig,
  loadProjectConfig,
  mergeConfigChain,
  resolveConfig,
  saveGlobalConfig,
  setGlobalConfigValue,
} from './config/index.js'
export type { ResolveConfigOptions } from './config/index.js'

export {
  deletePreset,
  getPresetsDir,
  listPresets,
  loadPreset,
  savePreset,
} from './config/index.js'
export {
  discoverNpmPresets,
  loadNpmPreset,
} from './config/index.js'

/**
 * Enhancements — module system for post-scaffold tooling setup.
 */
export {
  allEnhancementModules,
  buildProjectContext,
  changelogModule,
  ciModule,
  commitlintModule,
  CyclicDependencyError,
  defineEnhancement,
  dependencyVersionMap,
  detectFramework,
  dockerModule,
  editorconfigModule,
  ENHANCEMENT_NEXT_STEPS,
  enhancementRegistry,
  envModule,
  eslintModule,
  formatColoredDiff,
  huskyModule,
  mergeConfigs,
  prettierModule,
  renovateModule,
  runEnhancements,
  showEnhancementSummary,
  showFileDiff,
  showPerEnhancementSummary,
  testingModule,
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
 * Errors — structured error hierarchy and fuzzy matching utilities.
 */
export {
  CIRequiredArgsError,
  ConfigValidationError,
  findClosestMatch,
  InteractivePromptBlockedError,
  InvalidCategoryError,
  InvalidConfigKeyError,
  InvalidJsonConfigError,
  InvalidStackTokensError,
  JsonUnsupportedCommandError,
  MissingPackageJsonError,
  PresetNotFoundError,
  TinkeriseError,
  UnknownEnhancementError,
  UnknownShellError,
} from './errors/index.js'
export type { TinkeriseErrorOptions } from './errors/index.js'

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
  tinkeriseSummaryCard,
} from './executor/index.js'
export type { ExecuteOptions, ScaffoldPlan } from './executor/index.js'

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
 * Registry — scaffolder lookup and resolution.
 */
export {
  getAllScaffolders,
  getScaffolder,
  getScaffoldersByCategory,
} from './registry/index.js'

/**
 * Metadata — scaffolder display names, descriptions, and suggestions.
 */
export { getScaffolderMetadata, SCAFFOLDER_METADATA } from './registry/metadata.js'

export type { ScaffolderMetadata } from './registry/metadata.js'

/**
 * Sources — trust store and per-source consent gate for external sources (Tier C).
 */
export {
  discoverNpmSources,
  ensureSourceTrusted,
  getTrustStorePath,
  isSourceTrusted,
  listTrustedSources,
  loadNpmEnhancement,
  parseSource,
  TRUST_STORE_FILENAME,
  trustSource,
  untrustSource,
} from './sources/index.js'
export type { ModuleImporter, OnSourceConsent, ResolvedSource, SourceConsentRequest, SourceKind } from './sources/index.js'

/**
 * Templates — utility project generators (MCP server, CLI tool, npm library).
 */
export { generateCliTool, generateLib, generateMcpServer, TEMPLATE_METADATA } from './templates/index.js'
export type { TemplateOptions } from './templates/index.js'

/**
 * Tokens — natural-language stack token parser and command serializer.
 */
export { parseStackTokens, SCAFFOLD_FLAG_NAMES } from './tokens/index.js'
export type { FrameworkVocab, ParsedStack, ParseRegistries } from './tokens/index.js'
export { buildStackCommand } from '@tinkerise/shared'
export type { StackCommand, StackSelection } from '@tinkerise/shared'
