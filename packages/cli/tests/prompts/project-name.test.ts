/**
 * Tests for project-name prompt module.
 *
 * Tests validateProjectName regex and promptProjectName behavior
 * including cancellation handling.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Hoist mocks
const { mockText, mockIsCancel } = vi.hoisted(() => ({
  mockText: vi.fn(),
  mockIsCancel: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  text: mockText,
  isCancel: mockIsCancel,
}))

// eslint-disable-next-line import/first
import { validateProjectName } from '../../src/prompts/project-name.js'

describe('validateProjectName', () => {
  describe('valid names (returns undefined)', () => {
    it('accepts standard kebab-case: my-app', () => {
      expect(validateProjectName('my-app')).toBeUndefined()
    })

    it('accepts single word: app', () => {
      expect(validateProjectName('app')).toBeUndefined()
    })

    it('accepts name with numbers: my-app-123', () => {
      expect(validateProjectName('my-app-123')).toBeUndefined()
    })

    it('accepts name starting with number: 0-my-app', () => {
      expect(validateProjectName('0-my-app')).toBeUndefined()
    })

    it('accepts name with dot: my.app', () => {
      expect(validateProjectName('my.app')).toBeUndefined()
    })

    it('accepts name with underscore: my_app', () => {
      expect(validateProjectName('my_app')).toBeUndefined()
    })

    it('accepts single character: a', () => {
      expect(validateProjectName('a')).toBeUndefined()
    })

    it('accepts all numbers: 123', () => {
      expect(validateProjectName('123')).toBeUndefined()
    })
  })

  describe('invalid names (returns error string)', () => {
    it('rejects undefined', () => {
      expect(validateProjectName(undefined)).toBe('Project name is required')
    })

    it('rejects empty string', () => {
      expect(validateProjectName('')).toBe('Project name is required')
    })

    it('rejects whitespace only', () => {
      expect(validateProjectName('  ')).toBe('Project name is required')
    })

    it('rejects uppercase: My-App', () => {
      const result = validateProjectName('My-App')
      expect(result).toBeDefined()
      expect(result).toContain('lowercase')
    })

    it('rejects starting with hyphen: -my-app', () => {
      const result = validateProjectName('-my-app')
      expect(result).toBeDefined()
      expect(result).toContain('lowercase')
    })

    it('rejects starting with dot: .my-app', () => {
      const result = validateProjectName('.my-app')
      expect(result).toBeDefined()
      expect(result).toContain('lowercase')
    })

    it('rejects starting with underscore: _my-app', () => {
      const result = validateProjectName('_my-app')
      expect(result).toBeDefined()
      expect(result).toContain('lowercase')
    })

    it('rejects name with space: my app', () => {
      const result = validateProjectName('my app')
      expect(result).toBeDefined()
      expect(result).toContain('lowercase')
    })

    it('rejects name with @: my@app', () => {
      const result = validateProjectName('my@app')
      expect(result).toBeDefined()
      expect(result).toContain('lowercase')
    })

    it('rejects all uppercase: MY_APP', () => {
      const result = validateProjectName('MY_APP')
      expect(result).toBeDefined()
      expect(result).toContain('lowercase')
    })

    it('rejects names longer than 64 characters', () => {
      const longName = `a${'b'.repeat(64)}`
      const result = validateProjectName(longName)
      expect(result).toBeDefined()
      expect(result).toContain('max 64 chars')
    })
  })
})

describe('promptProjectName', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCancel.mockReturnValue(false)
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
  })

  afterEach(() => {
    exitSpy.mockRestore()
  })

  it('returns the value from p.text when user provides valid input', async () => {
    mockText.mockResolvedValue('my-next-app')
    const { promptProjectName } = await import('../../src/prompts/project-name.js')

    const result = await promptProjectName('next')

    expect(result).toBe('my-next-app')
  })

  it('calls p.text with message containing "Project name"', async () => {
    mockText.mockResolvedValue('my-app')
    const { promptProjectName } = await import('../../src/prompts/project-name.js')

    await promptProjectName('next')

    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Project name'),
      }),
    )
  })

  it('calls p.text with placeholder containing the framework name', async () => {
    mockText.mockResolvedValue('my-app')
    const { promptProjectName } = await import('../../src/prompts/project-name.js')

    await promptProjectName('next')

    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: expect.stringContaining('next'),
      }),
    )
  })

  it('passes validateProjectName as the validate function', async () => {
    mockText.mockResolvedValue('my-app')
    const { promptProjectName } = await import('../../src/prompts/project-name.js')

    await promptProjectName('react')

    const callArg = mockText.mock.calls[0]![0]
    expect(callArg.validate).toBeDefined()
    // Verify it's the real validateProjectName by testing its behavior
    expect(callArg.validate('valid-name')).toBeUndefined()
    expect(callArg.validate('')).toBe('Project name is required')
  })

  it('calls process.exit(0) when p.isCancel returns true', async () => {
    const cancelSymbol = Symbol('cancel')
    mockText.mockResolvedValue(cancelSymbol)
    mockIsCancel.mockReturnValue(true)
    const { promptProjectName } = await import('../../src/prompts/project-name.js')

    await expect(promptProjectName('next')).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(0)
  })
})
