/**
 * Dependency graph resolution for enhancement modules.
 *
 * Uses Kahn's algorithm for topological sorting with O(V+E) complexity
 * and built-in cycle detection.
 */

import type { EnhancementModule } from './types.js'
import { CyclicDependencyError } from '../errors/index.js'

export { CyclicDependencyError } from '../errors/index.js'

/**
 * Topologically sort enhancement modules by their dependency graph.
 *
 * Modules with no dependencies come first. If module A depends on module B,
 * B will appear before A in the result.
 *
 * Dependencies that reference module IDs not present in the input batch
 * are skipped gracefully (external/missing deps).
 *
 * @param modules - Enhancement modules to sort
 * @returns Sorted modules in dependency-first order
 * @throws {CyclicDependencyError} If a cyclic dependency is detected
 */
export function topologicalSort(
  modules: EnhancementModule[],
): EnhancementModule[] {
  if (modules.length === 0)
    return []

  // Build module map and adjacency list
  const moduleMap = new Map<string, EnhancementModule>()
  const adjacency = new Map<string, string[]>() // edge: dependency -> dependent
  const inDegree = new Map<string, number>()

  for (const mod of modules) {
    moduleMap.set(mod.id, mod)
    adjacency.set(mod.id, [])
    inDegree.set(mod.id, 0)
  }

  // Build edges: if A.dependsOn includes B, create edge B -> A
  // (B must run before A)
  for (const mod of modules) {
    for (const dep of mod.dependsOn) {
      // Skip dependencies not in the current batch
      if (!moduleMap.has(dep))
        continue

      adjacency.get(dep)!.push(mod.id)
      inDegree.set(mod.id, inDegree.get(mod.id)! + 1)
    }
  }

  // Seed queue with zero in-degree nodes (in insertion order for stability)
  const queue: string[] = []
  for (const mod of modules) {
    if (inDegree.get(mod.id)! === 0) {
      queue.push(mod.id)
    }
  }

  // Process queue: BFS-style Kahn's algorithm
  const sorted: EnhancementModule[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(moduleMap.get(current)!)

    for (const neighbor of adjacency.get(current)!) {
      const newDegree = inDegree.get(neighbor)! - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) {
        queue.push(neighbor)
      }
    }
  }

  // If not all modules were sorted, a cycle exists
  if (sorted.length !== modules.length) {
    const sortedIds = new Set(sorted.map(m => m.id))
    const cycleIds = modules
      .filter(m => !sortedIds.has(m.id))
      .map(m => m.id)
    throw new CyclicDependencyError(cycleIds)
  }

  return sorted
}
