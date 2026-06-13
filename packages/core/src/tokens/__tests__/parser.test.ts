import { describe, expect, it } from 'vitest'
import { parseStackTokens } from '../parser.js'

const reg = {
  frameworks: [
    { name: 'next', category: 'web' as const },
    { name: 'vite', category: 'web' as const },
  ],
  enhancementIds: ['eslint', 'prettier', 'husky'],
}

describe('parseStackTokens', () => {
  it('classifies name, framework, scaffold flags and enhancements', () => {
    const r = parseStackTokens(['my-app', 'next', 'ts', 'tailwind', 'eslint'], reg)
    expect(r.name).toBe('my-app')
    expect(r.framework).toBe('next')
    expect(r.category).toBe('web')
    expect(r.flags).toEqual({ typescript: true, tailwind: true })
    expect(r.enhancements).toEqual(['eslint'])
    expect(r.unknown).toEqual([])
  })

  it('resolves framework aliases and is order-independent', () => {
    const r = parseStackTokens(['nextjs', 'my-app'], reg)
    expect(r.framework).toBe('next')
    expect(r.name).toBe('my-app')
  })

  it('treats a second conflicting framework as unknown', () => {
    const r = parseStackTokens(['my-app', 'next', 'vite'], reg)
    expect(r.framework).toBe('next')
    expect(r.unknown).toEqual(['vite'])
  })

  it('collects unknown tokens', () => {
    const r = parseStackTokens(['my-app', 'next', 'flutterr'], reg)
    expect(r.unknown).toEqual(['flutterr'])
  })
})
