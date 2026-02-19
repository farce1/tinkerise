/**
 * Tests for variant-select prompt module.
 *
 * Tests pure functions directly and mocks @clack/prompts
 * for interactive functions to verify bypass behavior.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  resolveViteTemplate,
  selectT3Components,
  selectViteTemplate,
  T3_COMPONENTS,
  VITE_TEMPLATES,
} from '../../src/prompts/variant-select.js'

// Use vi.hoisted so mock fns are available inside vi.mock factories
const { mockSelect, mockMultiselect, mockIsCancel } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockMultiselect: vi.fn(),
  mockIsCancel: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  select: mockSelect,
  multiselect: mockMultiselect,
  isCancel: mockIsCancel,
}))

describe('resolveViteTemplate', () => {
  it('returns base unchanged when typescript is false', () => {
    expect(resolveViteTemplate('react', false)).toBe('react')
  })

  it('appends -ts when typescript is true', () => {
    expect(resolveViteTemplate('react', true)).toBe('react-ts')
  })

  it('does not double-suffix when base already ends with -ts', () => {
    expect(resolveViteTemplate('react-ts', true)).toBe('react-ts')
  })

  it('handles react-swc special case', () => {
    expect(resolveViteTemplate('react-swc', true)).toBe('react-swc-ts')
  })

  it('appends -ts to vue', () => {
    expect(resolveViteTemplate('vue', true)).toBe('vue-ts')
  })

  it('appends -ts to vanilla', () => {
    expect(resolveViteTemplate('vanilla', true)).toBe('vanilla-ts')
  })
})

describe('vITE_TEMPLATES', () => {
  it('has 8 entries', () => {
    expect(VITE_TEMPLATES).toHaveLength(8)
  })

  it('has React first with recommended hint', () => {
    expect(VITE_TEMPLATES[0]).toEqual({ value: 'react', label: 'React', hint: 'recommended' })
  })
})

describe('t3_COMPONENTS', () => {
  it('has 5 entries', () => {
    expect(T3_COMPONENTS).toHaveLength(5)
  })

  it('has tRPC first with recommended hint', () => {
    expect(T3_COMPONENTS[0]).toEqual({ value: 'trpc', label: 'tRPC', hint: 'recommended' })
  })
})

describe('selectViteTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCancel.mockReturnValue(false)
  })

  it('returns preselected value without prompting', async () => {
    const result = await selectViteTemplate('vue')

    expect(result).toBe('vue')
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('calls p.select() when no preselected value', async () => {
    mockSelect.mockResolvedValue('svelte')

    const result = await selectViteTemplate()

    expect(result).toBe('svelte')
    expect(mockSelect).toHaveBeenCalledOnce()
  })

  it('calls process.exit(0) when user cancels', async () => {
    const cancelSymbol = Symbol('cancel')
    mockSelect.mockResolvedValue(cancelSymbol)
    mockIsCancel.mockReturnValue(true)

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    await expect(selectViteTemplate()).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(0)

    exitSpy.mockRestore()
  })
})

describe('selectT3Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCancel.mockReturnValue(false)
  })

  it('returns preselected array without prompting', async () => {
    const result = await selectT3Components(['trpc', 'prisma'])

    expect(result).toEqual(['trpc', 'prisma'])
    expect(mockMultiselect).not.toHaveBeenCalled()
  })

  it('calls p.multiselect() when no preselected value', async () => {
    mockMultiselect.mockResolvedValue(['trpc', 'appRouter'])

    const result = await selectT3Components()

    expect(result).toEqual(['trpc', 'appRouter'])
    expect(mockMultiselect).toHaveBeenCalledOnce()
  })

  it('calls p.multiselect() when preselected is empty array', async () => {
    mockMultiselect.mockResolvedValue(['prisma'])

    const result = await selectT3Components([])

    expect(result).toEqual(['prisma'])
    expect(mockMultiselect).toHaveBeenCalledOnce()
  })

  it('calls process.exit(0) when user cancels', async () => {
    const cancelSymbol = Symbol('cancel')
    mockMultiselect.mockResolvedValue(cancelSymbol)
    mockIsCancel.mockReturnValue(true)

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    await expect(selectT3Components()).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(0)

    exitSpy.mockRestore()
  })
})
