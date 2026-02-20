/**
 * Errors module — structured error hierarchy and fuzzy matching utilities.
 */

export {
  CIRequiredArgsError,
  ConfigValidationError,
  CyclicDependencyError,
  FlagNotApplicableError,
  InvalidCategoryError,
  InvalidConfigKeyError,
  PrerequisiteError,
  PresetNotFoundError,
  ScaffolderExitError,
  ScaffolderNotFoundError,
  TinkeriseError,
  UnknownEnhancementError,
} from './base.js'

export type { TinkeriseErrorOptions } from './base.js'

export { findClosestMatch, levenshteinDistance } from './fuzzy-match.js'
