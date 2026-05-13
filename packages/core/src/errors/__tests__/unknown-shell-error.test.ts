import { describe, expect, it } from 'vitest'
import { TinkeriseError, UnknownShellError } from '../base.js'

describe('unknownShellError', () => {
  it('exposes COMPLETION_UNKNOWN_SHELL code and lists supported shells in the message', () => {
    const err = new UnknownShellError('powershell')
    expect(err.code).toBe('COMPLETION_UNKNOWN_SHELL')
    expect(err.name).toBe('UnknownShellError')
    expect(err.exitCode).toBe(1)
    expect(err.message).toBe('Unknown shell: \'powershell\'. Supported shells: bash, zsh, fish.')
    expect(err.suggestion).toBe('Supported shells: bash, zsh, fish.')
  })

  it('emits a Did you mean suggestion when a closest match is provided', () => {
    const err = new UnknownShellError('bsh', 'bash')
    expect(err.suggestion).toBe('Did you mean \'bash\'?')
  })

  it('extends TinkeriseError', () => {
    expect(new UnknownShellError('zsh')).toBeInstanceOf(TinkeriseError)
  })
})
