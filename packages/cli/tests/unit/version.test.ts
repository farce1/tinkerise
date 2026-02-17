import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

describe('@tinkerise/cli version', () => {
  it('package.json has a version field', () => {
    const pkg = require('../../package.json')
    expect(pkg.version).toBeDefined()
    expect(typeof pkg.version).toBe('string')
  })

  it('version matches semver pattern', () => {
    const pkg = require('../../package.json')
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('has bin entries for tinkerise and tk', () => {
    const pkg = require('../../package.json')
    expect(pkg.bin.tinkerise).toBeDefined()
    expect(pkg.bin.tk).toBeDefined()
  })
})
