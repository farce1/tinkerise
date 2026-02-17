/**
 * Tests for framework-select prompt module.
 *
 * Mocks @clack/prompts and @tinkerise/core registry functions
 * to verify option building, category headers, and cancel handling.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mock fns are available inside vi.mock factories
const { mockSelect, mockIsCancel, mockGetAllScaffolders, mockGetScaffoldersByCategory } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockIsCancel: vi.fn(),
  mockGetAllScaffolders: vi.fn(),
  mockGetScaffoldersByCategory: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  select: mockSelect,
  isCancel: mockIsCancel,
}))

vi.mock('@tinkerise/core', () => ({
  getAllScaffolders: mockGetAllScaffolders,
  getScaffoldersByCategory: mockGetScaffoldersByCategory,
}))

vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
  },
}))

import { selectFramework } from '../../src/prompts/framework-select.js'

// Test scaffolder data
const testScaffolders = [
  {
    name: 'next',
    category: 'web',
    packageName: 'create-next-app',
    command: 'npx',
    integration: { type: 'delegate' as const, command: 'create-next-app' },
    prerequisites: [],
    flags: [],
    versionedFlags: [],
    passthroughArgs: true,
  },
  {
    name: 'vite',
    category: 'web',
    packageName: 'create-vite',
    command: 'npm',
    integration: { type: 'delegate' as const, command: 'create-vite' },
    prerequisites: [],
    flags: [],
    versionedFlags: [],
    passthroughArgs: false,
  },
  {
    name: 'express',
    category: 'backend',
    packageName: 'express-generator',
    command: 'npx',
    integration: { type: 'delegate' as const, command: 'express-generator' },
    prerequisites: [],
    flags: [],
    versionedFlags: [],
    passthroughArgs: false,
  },
]

describe('selectFramework', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCancel.mockReturnValue(false)
    mockGetAllScaffolders.mockReturnValue(testScaffolders)
    mockGetScaffoldersByCategory.mockImplementation((cat: string) =>
      testScaffolders.filter(s => s.category === cat),
    )
  })

  it('calls p.select() with options containing disabled category headers', async () => {
    mockSelect.mockResolvedValue('next')

    await selectFramework()

    expect(mockSelect).toHaveBeenCalledOnce()
    const { options } = mockSelect.mock.calls[0]![0]!

    const webHeader = options.find(
      (o: { value: string }) => o.value === '__header_web',
    )
    expect(webHeader).toBeDefined()
    expect(webHeader.disabled).toBe(true)
  })

  it('includes __header_web as disabled with proper label', async () => {
    mockSelect.mockResolvedValue('next')

    await selectFramework()

    const { options } = mockSelect.mock.calls[0]![0]!
    const webHeader = options.find(
      (o: { value: string }) => o.value === '__header_web',
    )
    expect(webHeader).toBeDefined()
    expect(webHeader.disabled).toBe(true)
    expect(webHeader.label).toContain('Web')
  })

  it('includes backend header when backend scaffolders exist', async () => {
    mockSelect.mockResolvedValue('express')

    await selectFramework()

    const { options } = mockSelect.mock.calls[0]![0]!
    const backendHeader = options.find(
      (o: { value: string }) => o.value === '__header_backend',
    )
    expect(backendHeader).toBeDefined()
    expect(backendHeader.disabled).toBe(true)
    expect(backendHeader.label).toContain('Backend')
  })

  it('framework items have correct values and hints (packageName)', async () => {
    mockSelect.mockResolvedValue('next')

    await selectFramework()

    const { options } = mockSelect.mock.calls[0]![0]!
    const nextOption = options.find(
      (o: { value: string }) => o.value === 'next',
    )
    expect(nextOption).toBeDefined()
    expect(nextOption.hint).toBe('create-next-app')
    expect(nextOption.label).toContain('next')
  })

  it('framework items are indented with two spaces', async () => {
    mockSelect.mockResolvedValue('next')

    await selectFramework()

    const { options } = mockSelect.mock.calls[0]![0]!
    const nextOption = options.find(
      (o: { value: string }) => o.value === 'next',
    )
    expect(nextOption.label).toBe('  next')
  })

  it('filters to only web scaffolders when filterCategory="web"', async () => {
    mockSelect.mockResolvedValue('next')

    await selectFramework('web')

    expect(mockGetScaffoldersByCategory).toHaveBeenCalledWith('web')

    const { options } = mockSelect.mock.calls[0]![0]!
    const backendHeader = options.find(
      (o: { value: string }) => o.value === '__header_backend',
    )
    expect(backendHeader).toBeUndefined()
  })

  it('calls process.exit(0) when p.select() returns cancel', async () => {
    const cancelSymbol = Symbol('cancel')
    mockSelect.mockResolvedValue(cancelSymbol)
    mockIsCancel.mockReturnValue(true)

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    await expect(selectFramework()).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(0)

    exitSpy.mockRestore()
  })

  it('returns the selected framework name', async () => {
    mockSelect.mockResolvedValue('vite')

    const result = await selectFramework()

    expect(result).toBe('vite')
  })
})
