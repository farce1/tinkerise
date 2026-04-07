/**
 * Tests for banner.ts — verifies showBanner() calls p.intro().
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { showBanner } from '../../src/utils/banner.js'

const mockIntro = vi.hoisted(() => vi.fn())

vi.mock('@clack/prompts', () => ({
  intro: mockIntro,
}))

vi.mock('picocolors', () => ({
  default: {
    bgCyan: (s: string) => s,
    black: (s: string) => s,
    dim: (s: string) => s,
  },
}))

describe('showBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls p.intro() with a string containing "tinkerise"', () => {
    showBanner()

    expect(mockIntro).toHaveBeenCalledOnce()
    const arg = mockIntro.mock.calls[0]![0] as string
    expect(arg).toContain('tinkerise')
  })

  it('includes "scaffold anything" in the branded text', () => {
    showBanner()

    const arg = mockIntro.mock.calls[0]![0] as string
    expect(arg).toContain('scaffold anything')
  })

  it('does not throw', () => {
    expect(() => showBanner()).not.toThrow()
  })
})
