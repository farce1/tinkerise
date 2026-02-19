/**
 * Tests for platform detection and install instruction resolution.
 *
 * Verifies:
 * - detectPlatform returns a valid platform string
 * - detectPlatform returns the same value as process.platform
 * - getInstallInstructions returns platform-specific instructions when available
 * - getInstallInstructions returns fallback search URL when no platform instructions
 * - getInstallInstructions returns fallback when installInstructions is empty object
 * - Fallback URL includes the prerequisite command name
 * - Returns non-empty string for any Prerequisite with all platform instructions
 */

import type { Prerequisite } from '@tinkerise/shared'
import { describe, expect, it } from 'vitest'

import { detectPlatform, getInstallInstructions } from '../../src/prerequisites/platform.js'

describe('detectPlatform', () => {
  it('returns a value that is one of darwin, linux, or win32', () => {
    const platform = detectPlatform()
    expect(['darwin', 'linux', 'win32']).toContain(platform)
  })

  it('returns the same value as process.platform', () => {
    const platform = detectPlatform()
    expect(platform).toBe(process.platform)
  })
})

describe('getInstallInstructions', () => {
  it('returns platform-specific instruction when installInstructions has current platform key', () => {
    const prereq: Prerequisite = {
      command: 'my-tool',
      versionFlag: '--version',
      installInstructions: {
        darwin: 'brew install my-tool',
        linux: 'apt install my-tool',
        win32: 'choco install my-tool',
      },
    }

    const result = getInstallInstructions(prereq)
    const platform = detectPlatform()

    expect(result).toBe(prereq.installInstructions![platform])
  })

  it('returns fallback search URL containing search.brave.com when no installInstructions provided', () => {
    const prereq: Prerequisite = {
      command: 'some-tool',
    }

    const result = getInstallInstructions(prereq)

    expect(result).toContain('search.brave.com')
  })

  it('returns fallback when installInstructions is empty object', () => {
    const prereq: Prerequisite = {
      command: 'custom-tool',
      installInstructions: {},
    }

    const result = getInstallInstructions(prereq)

    expect(result).toContain('custom-tool')
    expect(result).toContain('search.brave.com')
  })

  it('fallback URL includes the prerequisite command name', () => {
    const prereq: Prerequisite = {
      command: 'my-special-tool',
    }

    const result = getInstallInstructions(prereq)

    expect(result).toContain('install+my-special-tool')
  })

  it('returns non-empty string for any Prerequisite with all platform instructions', () => {
    const prereq: Prerequisite = {
      command: 'git',
      versionFlag: '--version',
      installInstructions: {
        darwin: 'brew install git',
        linux: 'apt install git',
        win32: 'choco install git',
      },
    }

    const result = getInstallInstructions(prereq)
    expect(result.length).toBeGreaterThan(0)
  })
})
