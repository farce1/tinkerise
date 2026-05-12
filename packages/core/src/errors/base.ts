/**
 * TinkeriseError base class and all concrete error subclasses.
 *
 * Every tinkerise error carries a machine-readable code, a human-readable
 * message, an optional suggestion, and an exit code. This replaces the
 * previous pattern where each error class extended Error directly.
 */

import type { PrereqResult } from '../prerequisites/checker.js'

export interface TinkeriseErrorOptions {
  message: string
  code: string
  suggestion?: string
  exitCode?: number
  cause?: unknown
}

/**
 * Base error class for all tinkerise errors.
 *
 * Provides structured metadata: machine-readable `code`, optional
 * `suggestion` for the user, and `exitCode` for the CLI process.
 */
export class TinkeriseError extends Error {
  readonly code: string
  readonly suggestion?: string
  readonly exitCode: number

  constructor(options: TinkeriseErrorOptions) {
    super(options.message, { cause: options.cause })
    this.name = 'TinkeriseError'
    this.code = options.code
    this.suggestion = options.suggestion
    this.exitCode = options.exitCode ?? 1
  }
}

// ---------------------------------------------------------------------------
// Refactored existing error classes
// ---------------------------------------------------------------------------

/**
 * Error thrown when the scaffolder name is not found in the registry.
 */
export class ScaffolderNotFoundError extends TinkeriseError {
  constructor(name: string) {
    super({
      message: `Unknown scaffolder: '${name}'. Run 'tinkerise list' to see available scaffolders.`,
      code: 'SCAFFOLDER_NOT_FOUND',
      suggestion: 'Run \'tinkerise list\' to see available scaffolders.',
    })
    this.name = 'ScaffolderNotFoundError'
  }
}

/**
 * Error thrown when the upstream scaffolder exits with a non-zero code.
 */
export class ScaffolderExitError extends TinkeriseError {
  constructor(
    public readonly scaffolderName: string,
    exitCode: number,
  ) {
    super({
      message: `Scaffolder '${scaffolderName}' exited with code ${exitCode}`,
      code: 'SCAFFOLDER_EXIT',
      suggestion: 'Check the output above for details. Run with --verbose for the full error.',
      exitCode,
    })
    this.name = 'ScaffolderExitError'
  }
}

/**
 * Error thrown when a user flag doesn't apply to the chosen scaffolder.
 */
export class FlagNotApplicableError extends TinkeriseError {
  constructor(
    public readonly flag: string,
    public readonly scaffolderName: string,
  ) {
    super({
      message: `Flag '--${flag}' does not apply to scaffolder '${scaffolderName}'`,
      code: 'FLAG_NOT_APPLICABLE',
      suggestion: `Run 'tinkerise web ${scaffolderName} --help' to see supported flags.`,
    })
    this.name = 'FlagNotApplicableError'
  }
}

/**
 * Error thrown when one or more prerequisites are not met.
 */
export class PrerequisiteError extends TinkeriseError {
  constructor(
    public readonly results: PrereqResult[],
  ) {
    const failures = results.filter(r => !r.ok)
    const lines = failures.map(f =>
      `  - ${f.command}: ${f.error}\n    Fix: ${f.installInstructions}`,
    )
    super({
      message: `Missing prerequisites:\n${lines.join('\n')}`,
      code: 'PREREQUISITE_MISSING',
      suggestion: 'Install the missing tools above, then try again.',
    })
    this.name = 'PrerequisiteError'
  }
}

/**
 * Error thrown when a cyclic dependency is detected in the enhancement graph.
 */
export class CyclicDependencyError extends TinkeriseError {
  readonly cycle: string[]

  constructor(cycle: string[]) {
    super({
      message: `Cyclic dependency detected: ${cycle.join(' -> ')}`,
      code: 'CYCLIC_DEPENDENCY',
      suggestion: 'This is an internal error. Please report it at https://github.com/farce1/tinkerise/issues',
    })
    this.name = 'CyclicDependencyError'
    this.cycle = cycle
  }
}

// ---------------------------------------------------------------------------
// New structured error classes
// ---------------------------------------------------------------------------

/**
 * Error thrown when the user provides an invalid scaffolder category.
 */
export class InvalidCategoryError extends TinkeriseError {
  constructor(category: string, closestMatch?: string) {
    super({
      message: `Unknown category: '${category}'. Valid categories: web, backend, mobile`,
      code: 'INVALID_CATEGORY',
      suggestion: closestMatch
        ? `Did you mean '${closestMatch}'?`
        : 'Valid categories: web, backend, mobile',
    })
    this.name = 'InvalidCategoryError'
  }
}

/**
 * Error thrown when the user provides an invalid config key.
 */
export class InvalidConfigKeyError extends TinkeriseError {
  constructor(key: string) {
    super({
      message: `Unknown config key: '${key}'`,
      code: 'INVALID_CONFIG_KEY',
      suggestion: 'Valid keys: packageManager, typescript, defaultCategory',
    })
    this.name = 'InvalidConfigKeyError'
  }
}

/**
 * Error thrown when a config value fails validation.
 */
export class ConfigValidationError extends TinkeriseError {
  constructor(key: string, value: string, validValues: string) {
    super({
      message: `Invalid value '${value}' for ${key}.`,
      code: 'CONFIG_VALIDATION',
      suggestion: `Valid values: ${validValues}`,
    })
    this.name = 'ConfigValidationError'
  }
}

/**
 * Error thrown when the user references an unknown enhancement module.
 */
export class UnknownEnhancementError extends TinkeriseError {
  constructor(name: string, availableIds: string[]) {
    super({
      message: `Unknown enhancement: '${name}'`,
      code: 'UNKNOWN_ENHANCEMENT',
      suggestion: `Available: ${availableIds.join(', ')}`,
    })
    this.name = 'UnknownEnhancementError'
  }
}

/**
 * Error thrown when a preset name is not found.
 */
export class PresetNotFoundError extends TinkeriseError {
  constructor(name: string) {
    super({
      message: `Preset not found: '${name}'`,
      code: 'PRESET_NOT_FOUND',
      suggestion: 'Run \'tinkerise preset list\' to see available presets.',
    })
    this.name = 'PresetNotFoundError'
  }
}

/**
 * Error thrown in CI environments when required arguments are missing.
 */
export class CIRequiredArgsError extends TinkeriseError {
  constructor(missing: string[], ciName: string) {
    super({
      message: `Running in CI environment (${ciName}). Missing required arguments: ${missing.join(', ')}`,
      code: 'CI_REQUIRED_ARGS',
      suggestion: 'Provide all arguments for non-interactive execution: tinkerise <category> <framework> <name> [options]',
    })
    this.name = 'CIRequiredArgsError'
  }
}

/**
 * Thrown when a --json command would prompt the user interactively (D-14).
 * --json implies non-interactive; the CLI must fail loudly rather than
 * read from stdin.
 */
export class InteractivePromptBlockedError extends TinkeriseError {
  constructor(commandName: string) {
    super({
      message: `Cannot prompt interactively in --json mode for '${commandName}'.`,
      code: 'INTERACTIVE_PROMPT_BLOCKED',
      suggestion: 'Provide all required values via flags, or omit --json to run interactively.',
    })
    this.name = 'InteractivePromptBlockedError'
  }
}

/**
 * Thrown when --json is passed to a command that does not implement a
 * machine-readable contract in Phase 33 (e.g., add, scaffold, config).
 */
export class JsonUnsupportedCommandError extends TinkeriseError {
  constructor(commandName: string) {
    super({
      message: `--json is not supported for '${commandName}'. Supported: list, doctor, preset list, preset show.`,
      code: 'JSON_UNSUPPORTED_COMMAND',
      suggestion: 'Re-run without --json, or use one of the supported read-only commands.',
    })
    this.name = 'JsonUnsupportedCommandError'
  }
}
