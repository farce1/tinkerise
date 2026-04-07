/**
 * Tests for spawnScaffolder — process executor.
 */

import { describe, expect, it, vi } from 'vitest'

import { spawnScaffolder } from '../../src/executor/process.js'

const mockExeca = vi.hoisted(() => vi.fn())

vi.mock('execa', () => ({
  execa: mockExeca,
}))

describe('spawnScaffolder', () => {
  it('returns exit code 0 on success', async () => {
    mockExeca.mockResolvedValue({ exitCode: 0 })

    const result = await spawnScaffolder('node', ['--version'])

    expect(result.exitCode).toBe(0)
  })

  it('returns the actual non-zero exit code on failure', async () => {
    mockExeca.mockResolvedValue({ exitCode: 127 })

    const result = await spawnScaffolder('notfound', [])

    expect(result.exitCode).toBe(127)
  })

  it('falls back to 1 when execa returns undefined exitCode', async () => {
    mockExeca.mockResolvedValue({ exitCode: undefined })

    const result = await spawnScaffolder('cmd', [])

    expect(result.exitCode).toBe(1)
  })

  it('falls back to 1 when execa returns null exitCode', async () => {
    mockExeca.mockResolvedValue({ exitCode: null })

    const result = await spawnScaffolder('cmd', [])

    expect(result.exitCode).toBe(1)
  })

  it('passes stdio inherit and reject false to execa', async () => {
    mockExeca.mockResolvedValue({ exitCode: 0 })

    await spawnScaffolder('node', ['--version'], { cwd: '/tmp' })

    expect(mockExeca).toHaveBeenCalledWith(
      'node',
      ['--version'],
      expect.objectContaining({
        stdio: 'inherit',
        cwd: '/tmp',
        reject: false,
      }),
    )
  })

  it('uses undefined cwd when no options provided', async () => {
    mockExeca.mockResolvedValue({ exitCode: 0 })

    await spawnScaffolder('node', [])

    expect(mockExeca).toHaveBeenCalledWith(
      'node',
      [],
      expect.objectContaining({
        cwd: undefined,
        reject: false,
      }),
    )
  })
})
