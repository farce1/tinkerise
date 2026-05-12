/**
 * Tests for output-mode singleton + clack-output wrapper (Phase 33, plan 33-02).
 *
 * Verifies:
 *  - argv inspection toggles module state (detectJsonMode / isJsonMode)
 *  - emitJson writes byte-exact `{"k":v}\n` to stdout (D-12)
 *  - clack-output log methods inject `output: process.stderr` in JSON mode (D-13)
 *  - clack-output log methods pass `{}` in non-JSON mode (default stdout)
 *  - Strict equality argv match — '--json=true' does NOT trip detection
 *  - Position-agnostic detection — flag works before OR after subcommand
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const clackLogMocks = vi.hoisted(() => ({
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  message: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  log: clackLogMocks,
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  spinner: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
}))

async function freshModules() {
  vi.resetModules()
  // Import output-mode first so clack-output picks up the same instance.
  const outputMode = await import('../output-mode.js')
  const clackOutput = await import('../clack-output.js')
  return { outputMode, clackOutput }
}

async function freshOutputMode() {
  const { outputMode } = await freshModules()
  return outputMode
}

describe('output-mode.detectJsonMode + isJsonMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('flips jsonMode to true when --json appears after subcommand', async () => {
    const mod = await freshOutputMode()
    mod.detectJsonMode(['node', 'tinkerise', 'list', '--json'])
    expect(mod.isJsonMode()).toBe(true)
  })

  it('leaves jsonMode false when --json absent', async () => {
    const mod = await freshOutputMode()
    mod.detectJsonMode(['node', 'tinkerise', 'list'])
    expect(mod.isJsonMode()).toBe(false)
  })

  it('detects --json placed before subcommand (position-agnostic)', async () => {
    const mod = await freshOutputMode()
    mod.detectJsonMode(['node', 'tinkerise', '--json', 'list'])
    expect(mod.isJsonMode()).toBe(true)
  })

  it('does NOT detect --json=true (strict equality only)', async () => {
    const mod = await freshOutputMode()
    mod.detectJsonMode(['node', 'tinkerise', '--json=true', 'list'])
    expect(mod.isJsonMode()).toBe(false)
  })

  it('__resetJsonModeForTests resets module state to false', async () => {
    const mod = await freshOutputMode()
    mod.detectJsonMode(['node', 'tinkerise', '--json'])
    expect(mod.isJsonMode()).toBe(true)
    mod.__resetJsonModeForTests()
    expect(mod.isJsonMode()).toBe(false)
  })

  it('defaults argv parameter to process.argv', async () => {
    const mod = await freshOutputMode()
    const originalArgv = process.argv
    try {
      process.argv = ['node', 'tinkerise', '--json']
      mod.detectJsonMode()
      expect(mod.isJsonMode()).toBe(true)
    }
    finally {
      process.argv = originalArgv
    }
  })
})

describe('output-mode.emitJson', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes exactly one JSON.stringify(payload) + newline to stdout (D-12 byte-exact)', async () => {
    const mod = await freshOutputMode()
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    try {
      mod.emitJson({ a: 1 })
      expect(writeSpy).toHaveBeenCalledTimes(1)
      expect(writeSpy).toHaveBeenCalledWith('{"a":1}\n')
    }
    finally {
      writeSpy.mockRestore()
    }
  })

  it('emits a single trailing newline for nested payloads', async () => {
    const mod = await freshOutputMode()
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    try {
      mod.emitJson({ schemaVersion: 1, command: 'list', data: { items: [] } })
      const arg = writeSpy.mock.calls[0]?.[0]
      expect(typeof arg).toBe('string')
      expect(arg).toMatch(/\}\n$/)
      expect((arg as string).split('\n')).toHaveLength(2)
      expect((arg as string).split('\n')[1]).toBe('')
    }
    finally {
      writeSpy.mockRestore()
    }
  })
})

describe('clack-output log wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes log.info to stderr when in JSON mode (D-13)', async () => {
    const { outputMode, clackOutput } = await freshModules()
    outputMode.detectJsonMode(['node', 'tinkerise', '--json'])

    clackOutput.log.info('hello')

    expect(clackLogMocks.info).toHaveBeenCalledTimes(1)
    expect(clackLogMocks.info).toHaveBeenCalledWith('hello', { output: process.stderr })
  })

  it('passes empty options (no output override) in non-JSON mode', async () => {
    const { outputMode, clackOutput } = await freshModules()
    outputMode.detectJsonMode(['node', 'tinkerise', 'list'])

    clackOutput.log.info('hello')

    expect(clackLogMocks.info).toHaveBeenCalledTimes(1)
    expect(clackLogMocks.info).toHaveBeenCalledWith('hello', {})
  })

  it('applies the stderr override to every log method when in JSON mode', async () => {
    const { outputMode, clackOutput } = await freshModules()
    outputMode.detectJsonMode(['node', 'tinkerise', '--json'])

    clackOutput.log.success('ok')
    clackOutput.log.warn('warn')
    clackOutput.log.error('err')
    clackOutput.log.step('step')
    clackOutput.log.message('msg')

    expect(clackLogMocks.success).toHaveBeenCalledWith('ok', { output: process.stderr })
    expect(clackLogMocks.warn).toHaveBeenCalledWith('warn', { output: process.stderr })
    expect(clackLogMocks.error).toHaveBeenCalledWith('err', { output: process.stderr })
    expect(clackLogMocks.step).toHaveBeenCalledWith('step', { output: process.stderr })
    expect(clackLogMocks.message).toHaveBeenCalledWith('msg', { output: process.stderr })
  })
})
