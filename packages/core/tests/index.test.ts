import { VERSION } from '@tinkerise/shared'
import { describe, expect, it } from 'vitest'
import { getVersion } from '../src/index'

describe('@tinkerise/core', () => {
  describe('getVersion', () => {
    it('returns a string', () => {
      expect(typeof getVersion()).toBe('string')
    })

    it('returns the VERSION from shared', () => {
      expect(getVersion()).toBe(VERSION)
    })

    it('is not empty', () => {
      expect(getVersion().length).toBeGreaterThan(0)
    })
  })
})
