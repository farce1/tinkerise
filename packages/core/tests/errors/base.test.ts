/**
 * Tests for TinkeriseError base class and all concrete error subclasses.
 */

import { describe, expect, it } from 'vitest'

import {
  CIRequiredArgsError,
  ConfigValidationError,
  CyclicDependencyError,
  FlagNotApplicableError,
  InteractivePromptBlockedError,
  InvalidCategoryError,
  InvalidConfigKeyError,
  JsonUnsupportedCommandError,
  PrerequisiteError,
  PresetNotFoundError,
  ScaffolderExitError,
  ScaffolderNotFoundError,
  TinkeriseError,
  UnknownEnhancementError,
} from '../../src/errors/base.js'

describe('tinkeriseError', () => {
  it('is an instance of Error', () => {
    const err = new TinkeriseError({ message: 'test', code: 'TEST' })
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(TinkeriseError)
  })

  it('has correct name, code, and message', () => {
    const err = new TinkeriseError({ message: 'something failed', code: 'FAIL' })
    expect(err.name).toBe('TinkeriseError')
    expect(err.code).toBe('FAIL')
    expect(err.message).toBe('something failed')
  })

  it('defaults exitCode to 1', () => {
    const err = new TinkeriseError({ message: 'test', code: 'TEST' })
    expect(err.exitCode).toBe(1)
  })

  it('accepts custom exitCode', () => {
    const err = new TinkeriseError({ message: 'test', code: 'TEST', exitCode: 42 })
    expect(err.exitCode).toBe(42)
  })

  it('stores suggestion', () => {
    const err = new TinkeriseError({ message: 'test', code: 'TEST', suggestion: 'try this' })
    expect(err.suggestion).toBe('try this')
  })

  it('stores cause', () => {
    const cause = new Error('original')
    const err = new TinkeriseError({ message: 'test', code: 'TEST', cause })
    expect(err.cause).toBe(cause)
  })

  it('suggestion is undefined when not provided', () => {
    const err = new TinkeriseError({ message: 'test', code: 'TEST' })
    expect(err.suggestion).toBeUndefined()
  })
})

describe('scaffolderNotFoundError', () => {
  it('has correct code and name', () => {
    const err = new ScaffolderNotFoundError('foobar')
    expect(err.code).toBe('SCAFFOLDER_NOT_FOUND')
    expect(err.name).toBe('ScaffolderNotFoundError')
  })

  it('includes scaffolder name in message', () => {
    const err = new ScaffolderNotFoundError('foobar')
    expect(err.message).toContain('foobar')
  })

  it('is instanceof TinkeriseError', () => {
    const err = new ScaffolderNotFoundError('x')
    expect(err).toBeInstanceOf(TinkeriseError)
  })
})

describe('scaffolderExitError', () => {
  it('has correct code and name', () => {
    const err = new ScaffolderExitError('next', 127)
    expect(err.code).toBe('SCAFFOLDER_EXIT')
    expect(err.name).toBe('ScaffolderExitError')
  })

  it('stores the exit code', () => {
    const err = new ScaffolderExitError('next', 127)
    expect(err.exitCode).toBe(127)
  })

  it('includes scaffolder name in message', () => {
    const err = new ScaffolderExitError('vite', 1)
    expect(err.message).toContain('vite')
  })
})

describe('flagNotApplicableError', () => {
  it('has correct code and name', () => {
    const err = new FlagNotApplicableError('typescript', 'vite')
    expect(err.code).toBe('FLAG_NOT_APPLICABLE')
    expect(err.name).toBe('FlagNotApplicableError')
  })

  it('includes flag and scaffolder name in message', () => {
    const err = new FlagNotApplicableError('typescript', 'vite')
    expect(err.message).toContain('typescript')
    expect(err.message).toContain('vite')
  })
})

describe('prerequisiteError', () => {
  it('has correct code and name', () => {
    const err = new PrerequisiteError([
      { ok: false, command: 'node', error: 'not found', installInstructions: 'brew install node' },
    ])
    expect(err.code).toBe('PREREQUISITE_MISSING')
    expect(err.name).toBe('PrerequisiteError')
  })

  it('formats multiple failures', () => {
    const err = new PrerequisiteError([
      { ok: false, command: 'node', error: 'not found', installInstructions: 'brew install node' },
      { ok: true, command: 'git' },
      { ok: false, command: 'go', error: 'not found', installInstructions: 'brew install go' },
    ])
    expect(err.message).toContain('node')
    expect(err.message).toContain('go')
    expect(err.message).not.toContain('git')
  })
})

describe('cyclicDependencyError', () => {
  it('has correct code and name', () => {
    const err = new CyclicDependencyError(['a', 'b', 'a'])
    expect(err.code).toBe('CYCLIC_DEPENDENCY')
    expect(err.name).toBe('CyclicDependencyError')
  })

  it('stores cycle array', () => {
    const err = new CyclicDependencyError(['eslint', 'prettier', 'eslint'])
    expect(err.cycle).toEqual(['eslint', 'prettier', 'eslint'])
  })

  it('formats cycle path in message', () => {
    const err = new CyclicDependencyError(['a', 'b', 'a'])
    expect(err.message).toContain('a -> b -> a')
  })
})

describe('invalidCategoryError', () => {
  it('has correct code and name', () => {
    const err = new InvalidCategoryError('wep')
    expect(err.code).toBe('INVALID_CATEGORY')
    expect(err.name).toBe('InvalidCategoryError')
  })

  it('suggests closest match when provided', () => {
    const err = new InvalidCategoryError('wep', 'web')
    expect(err.suggestion).toContain('web')
  })

  it('shows valid categories when no closest match', () => {
    const err = new InvalidCategoryError('xyz')
    expect(err.suggestion).toContain('web')
    expect(err.suggestion).toContain('backend')
    expect(err.suggestion).toContain('mobile')
  })
})

describe('invalidConfigKeyError', () => {
  it('has correct code and name', () => {
    const err = new InvalidConfigKeyError('badKey')
    expect(err.code).toBe('INVALID_CONFIG_KEY')
    expect(err.name).toBe('InvalidConfigKeyError')
  })

  it('includes key in message', () => {
    const err = new InvalidConfigKeyError('badKey')
    expect(err.message).toContain('badKey')
  })

  it('shows valid keys in suggestion', () => {
    const err = new InvalidConfigKeyError('x')
    expect(err.suggestion).toContain('packageManager')
  })
})

describe('configValidationError', () => {
  it('has correct code and name', () => {
    const err = new ConfigValidationError('packageManager', 'npmx', 'npm, pnpm, yarn, bun')
    expect(err.code).toBe('CONFIG_VALIDATION')
    expect(err.name).toBe('ConfigValidationError')
  })

  it('shows valid values in suggestion', () => {
    const err = new ConfigValidationError('pm', 'bad', 'npm, pnpm')
    expect(err.suggestion).toContain('npm, pnpm')
  })
})

describe('unknownEnhancementError', () => {
  it('has correct code and name', () => {
    const err = new UnknownEnhancementError('foo', ['eslint', 'prettier'])
    expect(err.code).toBe('UNKNOWN_ENHANCEMENT')
    expect(err.name).toBe('UnknownEnhancementError')
  })

  it('lists available IDs in suggestion', () => {
    const err = new UnknownEnhancementError('foo', ['eslint', 'prettier'])
    expect(err.suggestion).toContain('eslint')
    expect(err.suggestion).toContain('prettier')
  })
})

describe('presetNotFoundError', () => {
  it('has correct code and name', () => {
    const err = new PresetNotFoundError('mypreset')
    expect(err.code).toBe('PRESET_NOT_FOUND')
    expect(err.name).toBe('PresetNotFoundError')
  })

  it('includes preset name in message', () => {
    const err = new PresetNotFoundError('mypreset')
    expect(err.message).toContain('mypreset')
  })
})

describe('ciRequiredArgsError', () => {
  it('has correct code and name', () => {
    const err = new CIRequiredArgsError(['framework', 'name'], 'GitHub Actions')
    expect(err.code).toBe('CI_REQUIRED_ARGS')
    expect(err.name).toBe('CIRequiredArgsError')
  })

  it('lists missing args in message', () => {
    const err = new CIRequiredArgsError(['framework', 'name'], 'GitHub Actions')
    expect(err.message).toContain('framework')
    expect(err.message).toContain('name')
  })

  it('includes CI name in message', () => {
    const err = new CIRequiredArgsError(['x'], 'GitLab CI')
    expect(err.message).toContain('GitLab CI')
  })
})

describe('interactivePromptBlockedError', () => {
  it('has correct code and name', () => {
    const err = new InteractivePromptBlockedError('preset save')
    expect(err.code).toBe('INTERACTIVE_PROMPT_BLOCKED')
    expect(err.name).toBe('InteractivePromptBlockedError')
  })

  it('is instanceof TinkeriseError', () => {
    const err = new InteractivePromptBlockedError('preset save')
    expect(err).toBeInstanceOf(TinkeriseError)
  })

  it('includes the command name in the message', () => {
    const err = new InteractivePromptBlockedError('preset save')
    expect(err.message).toContain('preset save')
    expect(err.message).toContain('--json')
  })

  it('suggests providing flags or removing --json', () => {
    const err = new InteractivePromptBlockedError('add')
    expect(err.suggestion).toBeDefined()
    expect(err.suggestion).toContain('--json')
  })
})

describe('jsonUnsupportedCommandError', () => {
  it('has correct code and name', () => {
    const err = new JsonUnsupportedCommandError('add')
    expect(err.code).toBe('JSON_UNSUPPORTED_COMMAND')
    expect(err.name).toBe('JsonUnsupportedCommandError')
  })

  it('is instanceof TinkeriseError', () => {
    const err = new JsonUnsupportedCommandError('add')
    expect(err).toBeInstanceOf(TinkeriseError)
  })

  it('includes the offending command in the message', () => {
    const err = new JsonUnsupportedCommandError('add')
    expect(err.message).toContain('add')
  })

  it('lists the supported commands in the message', () => {
    const err = new JsonUnsupportedCommandError('scaffold')
    expect(err.message).toContain('list')
    expect(err.message).toContain('doctor')
    expect(err.message).toContain('preset list')
    expect(err.message).toContain('preset show')
  })

  it('suggests re-running without --json or using a supported command', () => {
    const err = new JsonUnsupportedCommandError('scaffold')
    expect(err.suggestion).toBeDefined()
    expect(err.suggestion).toContain('--json')
  })
})
