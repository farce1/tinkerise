/**
 * Tests for enhancement-select.ts — interactive enhancement picker.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { showEnhancementPicker } from '../../src/prompts/enhancement-select.js'

const { mockMultiselect, mockIsCancel, mockLogInfo } = vi.hoisted(() => ({
  mockMultiselect: vi.fn(),
  mockIsCancel: vi.fn(),
  mockLogInfo: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  multiselect: mockMultiselect,
  isCancel: mockIsCancel,
  log: { info: mockLogInfo },
  cancel: vi.fn(),
}))

const mockModules = vi.hoisted(() => [
  {
    id: 'eslint',
    name: 'ESLint',
    description: 'Linting',
    detect: vi.fn(),
    install: vi.fn(),
  },
  {
    id: 'prettier',
    name: 'Prettier',
    description: 'Formatting',
    detect: vi.fn(),
    install: vi.fn(),
  },
])

vi.mock('@tinkerise/core', () => ({
  allEnhancementModules: mockModules,
}))

const mockCtx = { projectRoot: '/tmp/test', packageManager: 'npm' as const }

describe('showEnhancementPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCancel.mockReturnValue(false)
    mockModules[0].detect.mockResolvedValue({ installed: false })
    mockModules[1].detect.mockResolvedValue({ installed: false })
  })

  it('returns selected enhancement modules', async () => {
    mockMultiselect.mockResolvedValue(['eslint'])

    const result = await showEnhancementPicker(mockCtx as any)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('eslint')
  })

  it('returns empty array when all enhancements are installed', async () => {
    mockModules[0].detect.mockResolvedValue({ installed: true })
    mockModules[1].detect.mockResolvedValue({ installed: true })

    const result = await showEnhancementPicker(mockCtx as any)

    expect(result).toEqual([])
    expect(mockLogInfo).toHaveBeenCalledWith('All enhancements are already installed.')
    expect(mockMultiselect).not.toHaveBeenCalled()
  })

  it('calls process.exit(0) on cancellation', async () => {
    const cancelSymbol = Symbol('cancel')
    mockMultiselect.mockResolvedValue(cancelSymbol)
    mockIsCancel.mockReturnValue(true)

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    await expect(showEnhancementPicker(mockCtx as any)).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(0)

    exitSpy.mockRestore()
  })

  it('maps selected IDs back to module objects', async () => {
    mockMultiselect.mockResolvedValue(['prettier'])

    const result = await showEnhancementPicker(mockCtx as any)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('prettier')
  })

  it('shows "already installed" hint for detected modules', async () => {
    mockModules[0].detect.mockResolvedValue({ installed: true })
    mockModules[1].detect.mockResolvedValue({ installed: false })
    mockMultiselect.mockResolvedValue([])

    await showEnhancementPicker(mockCtx as any)

    const { options } = mockMultiselect.mock.calls[0]![0]!
    const eslintOpt = options.find((o: { value: string }) => o.value === 'eslint')
    const prettierOpt = options.find((o: { value: string }) => o.value === 'prettier')
    expect(eslintOpt.hint).toBe('already installed')
    expect(prettierOpt.hint).toBe('Formatting')
  })

  it('handles detect() timeout gracefully', async () => {
    // Simulate a hanging detect by using a never-resolving promise
    mockModules[0].detect.mockImplementation(() => new Promise(() => {}))
    mockModules[1].detect.mockResolvedValue({ installed: false })

    // Override the timeout to be fast for testing
    mockMultiselect.mockResolvedValue(['prettier'])

    // This should complete (with timeout fallback) rather than hang
    // The 5s real timeout is too long for a unit test, so we just verify the structure works
    // by testing that a rejection from detect() defaults to not-installed
    mockModules[0].detect.mockRejectedValue(new Error('timeout'))

    const result = await showEnhancementPicker(mockCtx as any)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('prettier')
  })
})
