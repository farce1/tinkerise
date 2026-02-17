import { describe, expect, it } from 'vitest'
import { isCI, ciName } from '../../src/ci/index'

describe('CI detection', () => {
  it('isCI is a boolean', () => {
    expect(typeof isCI).toBe('boolean')
  })

  it('ciName is a string or null', () => {
    expect(ciName === null || typeof ciName === 'string').toBe(true)
  })

  it('isCI and ciName are consistent', () => {
    // If isCI is false, ciName should be null (not in CI)
    // If isCI is true, ciName may be a string or null (some CI systems detected but unnamed)
    if (!isCI) {
      expect(ciName).toBeNull()
    }
  })

  // Account for both local dev (not CI) and GitHub Actions (is CI)
  it('exports are importable from ci module', () => {
    // Smoke test: values exist and are the expected types
    expect(isCI).toBeDefined()
    expect(ciName !== undefined).toBe(true) // ciName can be null but not undefined
  })
})
