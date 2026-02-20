import type { ScaffolderCategory, TinkeriseUserConfig } from '../src/index'
import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/index'

describe('@tinkerise/shared', () => {
  describe('vERSION', () => {
    it('exports a string', () => {
      expect(typeof VERSION).toBe('string')
    })

    it('is not empty', () => {
      expect(VERSION.length).toBeGreaterThan(0)
    })
  })

  describe('tinkeriseUserConfig', () => {
    it('accepts a valid config object', () => {
      const config: TinkeriseUserConfig = { packageManager: 'npm' }
      expect(config.packageManager).toBe('npm')
    })

    it('accepts optional fields', () => {
      const config: TinkeriseUserConfig = { packageManager: 'bun', typescript: true, defaultCategory: 'web' }
      expect(config.packageManager).toBe('bun')
      expect(config.typescript).toBe(true)
      expect(config.defaultCategory).toBe('web')
    })
  })

  describe('scaffolderCategory', () => {
    it('accepts valid categories', () => {
      const categories: ScaffolderCategory[] = ['web', 'backend', 'mobile', 'utility']
      expect(categories).toHaveLength(4)
    })
  })
})
