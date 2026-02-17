import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tinkeriseBlankLine, tinkeriseLog, tinkeriseSummary } from '../../src/executor/framing'

describe('tinkeriseLog()', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('outputs message with [tinkerise] prefix', () => {
    tinkeriseLog('Hello world')
    expect(logSpy).toHaveBeenCalledOnce()
    const output = logSpy.mock.calls[0]![0] as string
    expect(output).toContain('[tinkerise]')
    expect(output).toContain('Hello world')
  })
})

describe('tinkeriseSummary()', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('includes scaffolder name and project name', () => {
    tinkeriseSummary('next', 'my-app', [])
    const output = logSpy.mock.calls[0]![0] as string
    expect(output).toContain('my-app')
    expect(output).toContain('next')
  })

  it('includes flag list when flags provided', () => {
    tinkeriseSummary('next', 'my-app', ['typescript', 'tailwind'])
    const output = logSpy.mock.calls[0]![0] as string
    expect(output).toContain('typescript')
    expect(output).toContain('tailwind')
  })

  it('omits "with" when no flags', () => {
    tinkeriseSummary('next', 'my-app', [])
    const output = logSpy.mock.calls[0]![0] as string
    expect(output).not.toContain(' with ')
  })
})

describe('tinkeriseBlankLine()', () => {
  it('outputs an empty line', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    tinkeriseBlankLine()
    expect(logSpy).toHaveBeenCalledWith()
    logSpy.mockRestore()
  })
})
