import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/index'
import type { ScaffolderCategory, TinkeriseConfig } from '../src/index'

describe('@tinkerise/shared', () => {
  describe('VERSION', () => {
    it('exports a string', () => {
      expect(typeof VERSION).toBe('string')
    })

    it('is not empty', () => {
      expect(VERSION.length).toBeGreaterThan(0)
    })
  })

  describe('TinkeriseConfig', () => {
    it('accepts a valid config object', () => {
      const config: TinkeriseConfig = { name: 'my-project' }
      expect(config.name).toBe('my-project')
    })

    it('accepts optional packageManager', () => {
      const config: TinkeriseConfig = { name: 'test', packageManager: 'bun' }
      expect(config.packageManager).toBe('bun')
    })
  })

  describe('ScaffolderCategory', () => {
    it('accepts valid categories', () => {
      const categories: ScaffolderCategory[] = ['web', 'backend', 'mobile', 'utility']
      expect(categories).toHaveLength(4)
    })
  })
})
