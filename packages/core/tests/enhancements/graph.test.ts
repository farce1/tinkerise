import type { EnhancementModule } from '../../src/enhancements/types.js'
import { describe, expect, it } from 'vitest'
import {
  CyclicDependencyError,
  topologicalSort,
} from '../../src/enhancements/graph.js'

/**
 * Creates a minimal EnhancementModule stub for graph testing.
 * Only id and dependsOn matter for topological sort.
 */
function mod(id: string, dependsOn: string[] = []): EnhancementModule {
  return {
    id,
    name: id,
    description: `${id} module`,
    dependsOn,
    detect: async () => ({
      installed: false,
      configFiles: [],
      partial: false,
    }),
    install: async () => ({
      success: true,
      filesModified: [],
      packagesAdded: [],
      warnings: [],
    }),
  }
}

describe('topologicalSort()', () => {
  it('returns empty array for empty input', () => {
    expect(topologicalSort([])).toEqual([])
  })

  it('returns single module with no deps unchanged', () => {
    const a = mod('a')
    const result = topologicalSort([a])
    expect(result).toEqual([a])
  })

  it('returns two independent modules in stable insertion order', () => {
    const a = mod('a')
    const b = mod('b')
    const result = topologicalSort([a, b])
    expect(result.map(m => m.id)).toEqual(['a', 'b'])
  })

  it('orders linear chain: A depends on B -> [B, A]', () => {
    const a = mod('a', ['b'])
    const b = mod('b')
    const result = topologicalSort([a, b])
    expect(result.map(m => m.id)).toEqual(['b', 'a'])
  })

  it('orders diamond: D depends on B,C; B,C depend on A -> A first, D last', () => {
    const a = mod('a')
    const b = mod('b', ['a'])
    const c = mod('c', ['a'])
    const d = mod('d', ['b', 'c'])
    // Input order intentionally scrambled
    const result = topologicalSort([d, b, c, a])
    const ids = result.map(m => m.id)

    // A must come before B and C; D must come last
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'))
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('c'))
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('d'))
    expect(ids.indexOf('c')).toBeLessThan(ids.indexOf('d'))
    expect(ids[ids.length - 1]).toBe('d')
  })

  it('throws CyclicDependencyError for two-node cycle: A <-> B', () => {
    const a = mod('a', ['b'])
    const b = mod('b', ['a'])

    expect(() => topologicalSort([a, b])).toThrow(CyclicDependencyError)
    try {
      topologicalSort([a, b])
    }
    catch (err) {
      const cycleErr = err as CyclicDependencyError
      expect(cycleErr.cycle).toContain('a')
      expect(cycleErr.cycle).toContain('b')
      expect(cycleErr.message).toContain('Cyclic dependency detected')
    }
  })

  it('throws CyclicDependencyError for three-way cycle: A->B->C->A', () => {
    const a = mod('a', ['c'])
    const b = mod('b', ['a'])
    const c = mod('c', ['b'])

    expect(() => topologicalSort([a, b, c])).toThrow(CyclicDependencyError)
    try {
      topologicalSort([a, b, c])
    }
    catch (err) {
      const cycleErr = err as CyclicDependencyError
      expect(cycleErr.cycle).toContain('a')
      expect(cycleErr.cycle).toContain('b')
      expect(cycleErr.cycle).toContain('c')
    }
  })

  it('skips missing dependencies gracefully', () => {
    const a = mod('a', ['unknown'])
    const result = topologicalSort([a])
    expect(result.map(m => m.id)).toEqual(['a'])
  })

  it('throws CyclicDependencyError for partial cycle: B<->C cycle, A independent', () => {
    const a = mod('a')
    const b = mod('b', ['c'])
    const c = mod('c', ['b'])

    expect(() => topologicalSort([a, b, c])).toThrow(CyclicDependencyError)
    try {
      topologicalSort([a, b, c])
    }
    catch (err) {
      const cycleErr = err as CyclicDependencyError
      expect(cycleErr.cycle).toContain('b')
      expect(cycleErr.cycle).toContain('c')
    }
  })
})

describe('cyclicDependencyError', () => {
  it('extends Error', () => {
    const err = new CyclicDependencyError(['a', 'b'])
    expect(err).toBeInstanceOf(Error)
  })

  it('has cycle property with the involved IDs', () => {
    const err = new CyclicDependencyError(['a', 'b', 'c'])
    expect(err.cycle).toEqual(['a', 'b', 'c'])
  })

  it('has descriptive message', () => {
    const err = new CyclicDependencyError(['a', 'b'])
    expect(err.message).toContain('Cyclic dependency detected')
    expect(err.message).toContain('a')
    expect(err.message).toContain('b')
  })
})
