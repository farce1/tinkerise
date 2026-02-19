/**
 * Tests for prompt flow orchestration module.
 *
 * Tests runPromptFlow happy path, pre-fill skip logic for
 * framework/name/options, allOptionsResolved edge cases,
 * and cancellation handling via p.group onCancel.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Hoist mocks
const mockSelectFramework = vi.hoisted(() => vi.fn())
const mockSelectFrameworkOptions = vi.hoisted(() => vi.fn())
const mockPromptProjectName = vi.hoisted(() => vi.fn())

// Mock p.group to execute prompt functions sequentially like the real implementation
const mockGroup = vi.hoisted(() => vi.fn())

const mockFrameworkOptions = vi.hoisted(() => ({
  next: [
    { value: 'typescript', label: 'TypeScript', hint: 'recommended' },
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'eslint', label: 'ESLint' },
  ],
  astro: [
    { value: 'tailwind', label: 'Tailwind CSS' },
  ],
}))

vi.mock('@clack/prompts', () => ({
  group: mockGroup,
}))

vi.mock('../../src/prompts/framework-select.js', () => ({
  selectFramework: mockSelectFramework,
}))

vi.mock('../../src/prompts/options-select.js', () => ({
  selectFrameworkOptions: mockSelectFrameworkOptions,
  FRAMEWORK_OPTIONS: mockFrameworkOptions,
}))

vi.mock('../../src/prompts/project-name.js', () => ({
  promptProjectName: mockPromptProjectName,
}))

import { runPromptFlow } from '../../src/prompts/flow.js'

describe('runPromptFlow', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>
  let capturedOnCancel: (() => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnCancel = undefined

    // Default mock implementations
    mockSelectFramework.mockResolvedValue('next')
    mockSelectFrameworkOptions.mockResolvedValue(['typescript'])
    mockPromptProjectName.mockResolvedValue('my-app')

    // Mock p.group to execute the prompt functions like the real implementation
    mockGroup.mockImplementation(async (prompts: Record<string, Function>, opts?: { onCancel?: () => void }) => {
      if (opts?.onCancel) {
        capturedOnCancel = opts.onCancel
      }
      const results: Record<string, unknown> = {}
      for (const [key, fn] of Object.entries(prompts)) {
        results[key] = await fn({ results })
      }
      return results
    })

    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
  })

  afterEach(() => {
    exitSpy.mockRestore()
  })

  describe('happy path', () => {
    it('returns framework, options, and name with correct values', async () => {
      const result = await runPromptFlow({})

      expect(result).toEqual({
        framework: 'next',
        options: ['typescript'],
        name: 'my-app',
      })
    })

    it('calls selectFramework when no opts.framework provided', async () => {
      await runPromptFlow({})

      expect(mockSelectFramework).toHaveBeenCalledOnce()
    })

    it('calls selectFrameworkOptions with resolved framework', async () => {
      await runPromptFlow({})

      expect(mockSelectFrameworkOptions).toHaveBeenCalledWith('next', undefined)
    })

    it('calls promptProjectName with resolved framework', async () => {
      await runPromptFlow({})

      expect(mockPromptProjectName).toHaveBeenCalledWith('next')
    })
  })

  describe('pre-fill skip logic', () => {
    it('skips framework prompt when opts.framework is provided', async () => {
      const result = await runPromptFlow({ framework: 'vite' })

      expect(mockSelectFramework).not.toHaveBeenCalled()
      expect(result.framework).toBe('vite')
    })

    it('skips name prompt when opts.name is provided', async () => {
      const result = await runPromptFlow({ name: 'my-custom-app' })

      expect(mockPromptProjectName).not.toHaveBeenCalled()
      expect(result.name).toBe('my-custom-app')
    })

    it('skips options multiselect when allOptionsResolved and preselected covers all framework options', async () => {
      const result = await runPromptFlow({
        framework: 'next',
        allOptionsResolved: true,
        preselectedOptions: ['typescript', 'tailwind', 'eslint'],
      })

      expect(mockSelectFrameworkOptions).not.toHaveBeenCalled()
      expect(result.options).toEqual(['typescript', 'tailwind', 'eslint'])
    })

    it('still calls selectFrameworkOptions when allOptionsResolved but preselected does not cover all options', async () => {
      await runPromptFlow({
        framework: 'next',
        allOptionsResolved: true,
        preselectedOptions: ['typescript'], // missing tailwind and eslint
      })

      expect(mockSelectFrameworkOptions).toHaveBeenCalledWith('next', ['typescript'])
    })
  })

  describe('allOptionsResolved edge cases', () => {
    it('returns preselectedOptions when allOptionsResolved and framework has no FRAMEWORK_OPTIONS entry', async () => {
      const result = await runPromptFlow({
        framework: 'express', // not in FRAMEWORK_OPTIONS
        allOptionsResolved: true,
        preselectedOptions: ['typescript'],
      })

      expect(mockSelectFrameworkOptions).not.toHaveBeenCalled()
      expect(result.options).toEqual(['typescript'])
    })

    it('calls selectFrameworkOptions when allOptionsResolved is false', async () => {
      await runPromptFlow({
        framework: 'next',
        allOptionsResolved: false,
        preselectedOptions: ['typescript', 'tailwind', 'eslint'],
      })

      expect(mockSelectFrameworkOptions).toHaveBeenCalled()
    })

    it('calls selectFrameworkOptions when preselectedOptions is empty even with allOptionsResolved', async () => {
      await runPromptFlow({
        framework: 'next',
        allOptionsResolved: true,
        preselectedOptions: [],
      })

      // allOptionsResolved is true but pre.length === 0, so condition fails
      expect(mockSelectFrameworkOptions).toHaveBeenCalled()
    })
  })

  describe('cancellation', () => {
    it('p.group receives onCancel callback', async () => {
      await runPromptFlow({})

      expect(capturedOnCancel).toBeDefined()
    })

    it('onCancel calls process.exit(0)', async () => {
      await runPromptFlow({})

      expect(capturedOnCancel).toBeDefined()
      expect(() => capturedOnCancel!()).toThrow('process.exit called')
      expect(exitSpy).toHaveBeenCalledWith(0)
    })
  })
})
