/**
 * Errors module — structured error hierarchy and fuzzy matching utilities.
 */

export {
  CIRequiredArgsError,
  ConfigValidationError,
  CyclicDependencyError,
  FlagNotApplicableError,
  InteractivePromptBlockedError,
  InvalidCategoryError,
  InvalidConfigKeyError,
  InvalidJsonConfigError,
  InvalidStackTokensError,
  JsonUnsupportedCommandError,
  MissingPackageJsonError,
  PrerequisiteError,
  PresetNotFoundError,
  ScaffolderExitError,
  ScaffolderNotFoundError,
  TinkeriseError,
  UnknownEnhancementError,
  UnknownShellError,
} from './base.js'

export type { TinkeriseErrorOptions } from './base.js'

export { findClosestMatch, levenshteinDistance } from './fuzzy-match.js'
