/**
 * Tests for pm-select.ts — package manager selection prompt.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { promptPackageManager } from '../../src/prompts/pm-select.js'

const { mockSelect, mockIsCancel } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockIsCancel: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  select: mockSelect,
  isCancel: mockIsCancel,
}))

describe('promptPackageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCancel.mockReturnValue(false)
  })

  it('returns the selected package manager', async () => {
    mockSelect.mockResolvedValue('pnpm')

    const result = await promptPackageManager()

    expect(result).toBe('pnpm')
  })

  it('presents all 4 package manager options', async () => {
    mockSelect.mockResolvedValue('npm')

    await promptPackageManager()

    expect(mockSelect).toHaveBeenCalledOnce()
    const { options } = mockSelect.mock.calls[0]![0]!
    const values = options.map((o: { value: string }) => o.value)
    expect(values).toContain('npm')
    expect(values).toContain('pnpm')
    expect(values).toContain('yarn')
    expect(values).toContain('bun')
  })

  it('calls process.exit(0) when user cancels', async () => {
    const cancelSymbol = Symbol('cancel')
    mockSelect.mockResolvedValue(cancelSymbol)
    mockIsCancel.mockReturnValue(true)

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    await expect(promptPackageManager()).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(0)

    exitSpy.mockRestore()
  })
})
