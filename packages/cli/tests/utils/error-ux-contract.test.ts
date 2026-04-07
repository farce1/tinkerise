/**
 * Tests for error-ux-contract.ts — error rendering utilities.
 */

import type { ErrorUxContent } from '../../src/utils/error-ux-contract.js'
import { describe, expect, it } from 'vitest'

import { formatBoundaryError, renderErrorContract } from '../../src/utils/error-ux-contract.js'

const sampleContent: ErrorUxContent = {
  code: 'TEST_ERROR',
  headline: 'Something went wrong.',
  cause: 'File not found.',
  nextStep: 'Check the file path.',
}

describe('renderErrorContract', () => {
  it('formats error with code and headline', () => {
    const lines = renderErrorContract(sampleContent)
    expect(lines[0]).toBe('Error [TEST_ERROR] Something went wrong.')
  })

  it('includes cause line', () => {
    const lines = renderErrorContract(sampleContent)
    expect(lines[1]).toBe('Cause: File not found.')
  })

  it('includes next step line', () => {
    const lines = renderErrorContract(sampleContent)
    expect(lines[2]).toBe('Next step: Check the file path.')
  })

  it('normalizes whitespace in values', () => {
    const lines = renderErrorContract({
      code: '  SPACED  CODE  ',
      headline: '  too   many   spaces  ',
      cause: '  whitespace   here  ',
      nextStep: '  and   here  ',
    })
    expect(lines[0]).toBe('Error [SPACED CODE] too many spaces')
    expect(lines[1]).toBe('Cause: whitespace here')
    expect(lines[2]).toBe('Next step: and here')
  })
})

describe('formatBoundaryError', () => {
  it('returns lines from renderErrorContract', () => {
    const result = formatBoundaryError({ content: sampleContent })
    expect(result.lines).toHaveLength(3)
    expect(result.lines[0]).toContain('TEST_ERROR')
  })

  it('includes stack when debug is true', () => {
    const stack = 'Error\n  at test.js:1:1'
    const result = formatBoundaryError({
      content: sampleContent,
      stack,
      debug: true,
    })
    expect(result.stack).toBe(stack)
  })

  it('omits stack when debug is false', () => {
    const result = formatBoundaryError({
      content: sampleContent,
      stack: 'Error\n  at test.js:1:1',
      debug: false,
    })
    expect(result.stack).toBeUndefined()
  })

  it('omits stack when debug is true but no stack provided', () => {
    const result = formatBoundaryError({
      content: sampleContent,
      debug: true,
    })
    expect(result.stack).toBeUndefined()
  })

  it('omits stack when neither debug nor stack provided', () => {
    const result = formatBoundaryError({ content: sampleContent })
    expect(result.stack).toBeUndefined()
  })
})
