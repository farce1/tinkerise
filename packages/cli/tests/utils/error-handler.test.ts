import { stripVTControlCharacters } from 'node:util'
import { TinkeriseError } from '@tinkerise/core'
import { CommanderError } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleError } from '../../src/utils/error-handler.js'

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
