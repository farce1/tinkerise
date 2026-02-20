import { defineScaffolder } from '@tinkerise/shared'
import { describe, expect, it } from 'vitest'
import { FlagNotApplicableError, validateFlagApplicability } from '../../src/flags/validator'

const testEntry = defineScaffolder({
  name: 'test',
  category: 'web',
  command: 'npx',
  packageName: 'create-test',
  integration: { type: 'delegate', command: 'create-test' },
  flags: [
    { unified: 'typescript', native: '--typescript' },
    { unified: 'tailwind', native: '--tailwind' },
  ],
  versionedFlags: [
    {
      versionRange: '>=15.0.0',
      flags: [
        { unified: 'turbo', native: '--turbo' },
      ],
    },
  ],
})

describe('validateFlagApplicability()', () => {
  it('passes when all user flags are known', () => {
    expect(() => {
      validateFlagApplicability(testEntry, { typescript: true, tailwind: true })
    }).not.toThrow()
  })

  it('throws FlagNotApplicableError for unknown flag', () => {
    expect(() => {
      validateFlagApplicability(testEntry, { unknown: true })
    }).toThrow(FlagNotApplicableError)
  })

  it('considers flags from both base and versioned flag sets', () => {
    // 'turbo' is only in versioned flags, should still be known
    expect(() => {
      validateFlagApplicability(testEntry, { turbo: true })
    }).not.toThrow()
  })

  it('passes with empty user flags', () => {
    expect(() => {
      validateFlagApplicability(testEntry, {})
    }).not.toThrow()
  })

  it('error includes flag name and scaffolder name', () => {
    try {
      validateFlagApplicability(testEntry, { docker: true })
      expect.unreachable('should have thrown')
    }
    catch (e) {
      expect(e).toBeInstanceOf(FlagNotApplicableError)
      const err = e as FlagNotApplicableError
      expect(err.flag).toBe('docker')
      expect(err.scaffolderName).toBe('test')
      expect(err.message).toContain('docker')
      expect(err.message).toContain('test')
    }
  })
})
