/**
 * Tests for options-select prompt module.
 *
 * Mocks @clack/prompts multiselect to verify option lookup,
 * empty-framework handling, cancel behavior, and preselection.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FRAMEWORK_OPTIONS, selectFrameworkOptions } from '../../src/prompts/options-select.js'

// Use vi.hoisted so mock fns are available inside vi.mock factories
const { mockMultiselect, mockIsCancel } = vi.hoisted(() => ({
  mockMultiselect: vi.fn(),
  mockIsCancel: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  multiselect: mockMultiselect,
  isCancel: mockIsCancel,
}))

describe('selectFrameworkOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCancel.mockReturnValue(false)
  })

  it('calls p.multiselect() with correct options for next', async () => {
    mockMultiselect.mockResolvedValue(['typescript', 'tailwind'])

    await selectFrameworkOptions('next')

    expect(mockMultiselect).toHaveBeenCalledOnce()
    const callArg = mockMultiselect.mock.calls[0]![0]!
    expect(callArg.options).toEqual(FRAMEWORK_OPTIONS.next)
    expect(callArg.message).toBe('Select options:')
  })

  it('returns empty array for unknown framework without calling multiselect', async () => {
    const result = await selectFrameworkOptions('unknown-framework')

    expect(result).toEqual([])
    expect(mockMultiselect).not.toHaveBeenCalled()
  })

  it('returns empty array for framework with no options defined', async () => {
    const result = await selectFrameworkOptions('django')

    expect(result).toEqual([])
    expect(mockMultiselect).not.toHaveBeenCalled()
  })

  it('calls process.exit(0) when multiselect returns cancel', async () => {
    const cancelSymbol = Symbol('cancel')
    mockMultiselect.mockResolvedValue(cancelSymbol)
    mockIsCancel.mockReturnValue(true)

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    await expect(selectFrameworkOptions('next')).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(0)

    exitSpy.mockRestore()
  })

  it('passes preselected array as initialValues to multiselect', async () => {
    mockMultiselect.mockResolvedValue(['typescript', 'eslint'])

    await selectFrameworkOptions('next', ['typescript'])

    const callArg = mockMultiselect.mock.calls[0]![0]!
    expect(callArg.initialValues).toEqual(['typescript'])
  })

  it('passes empty initialValues when no preselected provided', async () => {
    mockMultiselect.mockResolvedValue(['tailwind'])

    await selectFrameworkOptions('next')

    const callArg = mockMultiselect.mock.calls[0]![0]!
    expect(callArg.initialValues).toEqual([])
  })

  it('passes required: false to allow selecting no options', async () => {
    mockMultiselect.mockResolvedValue([])

    await selectFrameworkOptions('next')

    const callArg = mockMultiselect.mock.calls[0]![0]!
    expect(callArg.required).toBe(false)
  })

  it('returns the selected options as string[]', async () => {
    mockMultiselect.mockResolvedValue(['typescript', 'eslint'])

    const result = await selectFrameworkOptions('next')

    expect(result).toEqual(['typescript', 'eslint'])
  })

  it('fRAMEWORK_OPTIONS has entries for next with TypeScript, Tailwind, ESLint', () => {
    const nextOptions = FRAMEWORK_OPTIONS.next
    expect(nextOptions).toBeDefined()
    expect(nextOptions!.length).toBe(3)

    const values = nextOptions!.map(o => o.value)
    expect(values).toContain('typescript')
    expect(values).toContain('tailwind')
    expect(values).toContain('eslint')
  })

  it('typeScript option has hint "recommended"', () => {
    const tsOption = FRAMEWORK_OPTIONS.next!.find(o => o.value === 'typescript')
    expect(tsOption).toBeDefined()
    expect(tsOption!.hint).toBe('recommended')
  })
})
