import { describe, expect, it } from 'vitest'
import { parseSource } from '../../src/sources/resolve'

describe('parseSource', () => {
  it('parses an unscoped npm source', () => {
    expect(parseSource('npm:tinkerise-scaffolder-foo')).toEqual({
      kind: 'npm',
      id: 'npm:tinkerise-scaffolder-foo',
    })
  })

  it('parses a scoped npm source', () => {
    expect(parseSource('npm:@acme/tinkerise-scaffolder-foo')).toEqual({
      kind: 'npm',
      id: 'npm:@acme/tinkerise-scaffolder-foo',
    })
  })

  it('parses a github source', () => {
    expect(parseSource('github:acme/widgets')).toEqual({
      kind: 'github',
      id: 'github:acme/widgets',
    })
  })

  it('canonicalizes case so trust cannot be bypassed by format', () => {
    expect(parseSource('github:Acme/Widgets').id).toBe('github:acme/widgets')
    expect(parseSource('  github:acme/widgets  ').id).toBe('github:acme/widgets')
  })

  it('throws on an unrecognized source', () => {
    expect(() => parseSource('widgets')).toThrow(/source/i)
    expect(() => parseSource('https://example.com/x')).toThrow(/source/i)
    expect(() => parseSource('npm:')).toThrow(/source/i)
    expect(() => parseSource('github:nope')).toThrow(/source/i)
  })
})
