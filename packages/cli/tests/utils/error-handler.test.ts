import { Buffer } from 'node:buffer'
import { stripVTControlCharacters } from 'node:util'
import { TinkeriseError } from '@tinkerise/core'
import { CommanderError } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleError } from '../../src/utils/error-handler.js'
import { __resetJsonModeForTests, detectJsonMode } from '../../src/utils/output-mode.js'

class ExitSignal extends Error {
  constructor(readonly code?: string | number | null) {
    super('process.exit called')
  }
}

function stripAnsi(input: string): string {
  return stripVTControlCharacters(input)
}

describe('handleError contract', () => {
  const originalArgv = [...process.argv]
  const originalDebug = process.env.DEBUG

  afterEach(() => {
    vi.restoreAllMocks()
    process.argv = [...originalArgv]
    if (typeof originalDebug === 'undefined') {
      delete process.env.DEBUG
    }
    else {
      process.env.DEBUG = originalDebug
    }
  })

  it('renders 3-part output with visible code for expected errors', () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    const error = new TinkeriseError({
      code: 'INVALID_CATEGORY',
      message: 'Unknown category: webx',
      suggestion: 'Run tinkerise list to see categories.',
      exitCode: 1,
    })

    expect(() => handleError(error)).toThrowError(ExitSignal)
    expect(exitSpy).toHaveBeenCalledWith(1)

    const output = stripAnsi(logSpy.mock.calls.map(call => String(call[0])).join('\n'))
    expect(output).toContain('Error [INVALID_CATEGORY] Command failed.')
    expect(output).toContain('Cause: Unknown category: webx')
    expect(output).toContain('Next step: Run tinkerise list to see categories.')
    expect(output).not.toContain('at ')
  })

  it('shows stack details only in debug mode', () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    process.argv = [...originalArgv, '--verbose']

    const error = new Error('boom')
    error.stack = 'Error: boom\n    at debug-stack:1:1'

    expect(() => handleError(error)).toThrowError(ExitSignal)

    const output = stripAnsi(logSpy.mock.calls.map(call => String(call[0])).join('\n'))
    expect(output).toContain('Error [UNEXPECTED_RUNTIME] Unexpected runtime failure.')
    expect(output).toContain('Cause: boom')
    expect(output).toContain('Next step: Retry with')
    expect(output).toContain('--verbose')
    expect(output).toContain('debug-stack:1:1')
  })

  it('formats commander failures through the same contract', () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    const commanderError = new CommanderError(1, 'commander.unknownCommand', 'unknown command \'lst\'')
    expect(() => handleError(commanderError)).toThrowError(ExitSignal)
    expect(exitSpy).toHaveBeenCalledWith(1)

    const output = stripAnsi(logSpy.mock.calls.map(call => String(call[0])).join('\n'))
    expect(output).toContain('Error [COMMANDER_UNKNOWNCOMMAND] Command input is invalid.')
    expect(output).toContain('Cause: unknown command \'lst\'')
    expect(output).toContain('Next step: Did you mean')
    expect(output).toContain('Try \'tinkerise list\'.')
  })

  it('keeps unknown runtime errors graceful without stack by default', () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    expect(() => handleError('raw failure')).toThrowError(ExitSignal)

    const output = stripAnsi(logSpy.mock.calls.map(call => String(call[0])).join('\n'))
    expect(output).toContain('Error [UNEXPECTED_RUNTIME] Unexpected runtime failure.')
    expect(output).toContain('Cause: A non-error value was thrown during command execution.')
    expect(output).toContain('Next step: Retry with')
    expect(output).toContain('--verbose')
    expect(output).not.toContain('raw failure')
  })
})

describe('handleError --json branch (D-05, D-12, D-15)', () => {
  const originalArgv = [...process.argv]

  afterEach(() => {
    vi.restoreAllMocks()
    process.argv = [...originalArgv]
    __resetJsonModeForTests()
  })

  function captureStdout(): { spy: ReturnType<typeof vi.spyOn>, joined: () => string } {
    const writes: string[] = []
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
      writes.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8'))
      return true
    }) as never)
    return {
      spy,
      joined: () => writes.join(''),
    }
  }

  it('emits JSON envelope to stdout for TinkeriseError with stable code', () => {
    process.argv = ['node', 'tinkerise', '--json', 'preset', 'show', 'missing']
    detectJsonMode()
    const stdout = captureStdout()
    const stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    const error = new TinkeriseError({
      code: 'PRESET_NOT_FOUND',
      message: 'Preset not found: \'missing\'',
      exitCode: 1,
    })

    expect(() => handleError(error)).toThrowError(ExitSignal)
    expect(exitSpy).toHaveBeenCalledWith(1)

    const out = stdout.joined()
    expect(out).toMatch(/\n$/)
    const parsed = JSON.parse(out.trimEnd())
    expect(parsed).toEqual({
      schemaVersion: 1,
      command: 'preset.show',
      error: {
        code: 'PRESET_NOT_FOUND',
        message: 'Preset not found: \'missing\'',
      },
    })
    // stderr must NOT receive any JSON object
    const stderrOut = stripAnsi(stderrSpy.mock.calls.map(call => String(call[0])).join('\n'))
    expect(stderrOut).not.toMatch(/^\s*\{/)
  })

  it('emits JSON envelope with COMMANDER_* code for CommanderError', () => {
    process.argv = ['node', 'tinkerise', '--json', 'bogus-cmd-xyz']
    detectJsonMode()
    const stdout = captureStdout()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    const commanderError = new CommanderError(1, 'commander.unknownCommand', 'unknown command \'bogus-cmd-xyz\'')
    expect(() => handleError(commanderError)).toThrowError(ExitSignal)
    expect(exitSpy).toHaveBeenCalledWith(1)

    const parsed = JSON.parse(stdout.joined().trimEnd())
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.command).toBe('bogus-cmd-xyz')
    expect(parsed.error.code).toBe('COMMANDER_UNKNOWNCOMMAND')
    expect(parsed.error.message).toContain('bogus-cmd-xyz')
  })

  it('falls back to UNEXPECTED_RUNTIME for plain Error', () => {
    process.argv = ['node', 'tinkerise', '--json', 'list']
    detectJsonMode()
    const stdout = captureStdout()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    expect(() => handleError(new Error('boom'))).toThrowError(ExitSignal)
    expect(exitSpy).toHaveBeenCalledWith(1)

    const parsed = JSON.parse(stdout.joined().trimEnd())
    expect(parsed.error.code).toBe('UNEXPECTED_RUNTIME')
    expect(parsed.error.message).toBe('boom')
  })

  it('falls back to UNEXPECTED_RUNTIME for non-Error throws and stringifies the value', () => {
    process.argv = ['node', 'tinkerise', '--json', 'list']
    detectJsonMode()
    const stdout = captureStdout()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    expect(() => handleError('raw failure')).toThrowError(ExitSignal)
    expect(exitSpy).toHaveBeenCalledWith(1)

    const parsed = JSON.parse(stdout.joined().trimEnd())
    expect(parsed.error.code).toBe('UNEXPECTED_RUNTIME')
    expect(parsed.error.message).toBe('raw failure')
  })

  it('infers command="unknown" when argv has only --json with no subcommand', () => {
    process.argv = ['node', 'tinkerise', '--json']
    detectJsonMode()
    const stdout = captureStdout()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    expect(() => handleError(new Error('boom'))).toThrowError(ExitSignal)
    const parsed = JSON.parse(stdout.joined().trimEnd())
    expect(parsed.command).toBe('unknown')
  })

  it('preserves TinkeriseError.exitCode in the JSON branch', () => {
    process.argv = ['node', 'tinkerise', '--json', 'list']
    detectJsonMode()
    captureStdout()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new ExitSignal(code)
    }) as never)

    const error = new TinkeriseError({
      code: 'SCAFFOLDER_EXIT',
      message: 'exited',
      exitCode: 127,
    })

    expect(() => handleError(error)).toThrowError(ExitSignal)
    expect(exitSpy).toHaveBeenCalledWith(127)
  })
})
