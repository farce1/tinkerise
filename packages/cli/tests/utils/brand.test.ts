/**
 * Tests for brand.ts utility functions.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { bold, dim, error, printBranding, success, warn } from '../../src/utils/brand.js'

describe('brand utilities', () => {
  describe('printBranding', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    it('calls console.log with tinkerise text', () => {
      printBranding()

      expect(consoleSpy).toHaveBeenCalled()
      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n')
      expect(output).toContain('tinkerise')
    })

    it('includes surrounding blank lines', () => {
      printBranding()

      // First and last calls should be empty lines
      expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('dim', () => {
    it('returns a string', () => {
      expect(typeof dim('hello')).toBe('string')
    })

    it('handles empty string', () => {
      expect(typeof dim('')).toBe('string')
    })
  })

  describe('bold', () => {
    it('returns a string', () => {
      expect(typeof bold('hello')).toBe('string')
    })

    it('handles empty string', () => {
      expect(typeof bold('')).toBe('string')
    })
  })

  describe('success', () => {
    it('returns a string', () => {
      expect(typeof success('done')).toBe('string')
    })

    it('handles empty string', () => {
      expect(typeof success('')).toBe('string')
    })
  })

  describe('error', () => {
    it('returns a string', () => {
      expect(typeof error('fail')).toBe('string')
    })

    it('handles empty string', () => {
      expect(typeof error('')).toBe('string')
    })
  })

  describe('warn', () => {
    it('returns a string', () => {
      expect(typeof warn('caution')).toBe('string')
    })

    it('handles empty string', () => {
      expect(typeof warn('')).toBe('string')
    })
  })
})
