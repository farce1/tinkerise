/**
 * Config merge chain — deterministic multi-layer config merging.
 *
 * Merge order: left-to-right, later layers override earlier ones.
 * Calling convention: mergeConfigChain(globalConfig, projectConfig, cliFlags)
 *
 * Uses deepmerge-ts default behavior which replaces arrays entirely
 * (correct for config: user's enhancement list should replace, not
 * concatenate with, a preset's list — per research pitfall #3).
 */

import { deepmerge } from 'deepmerge-ts'
import type { TinkeriseUserConfig } from '@tinkerise/shared'

/**
 * Merges configuration layers in priority order.
 *
 * Accepts any number of config layers (including null/undefined).
 * Null and undefined layers are silently filtered out.
 * Later layers override earlier ones for overlapping keys.
 *
 * @example
 * ```ts
 * mergeConfigChain(globalConfig, projectConfig, cliFlags)
 * // CLI flags > project config > global config
 * ```
 */
export function mergeConfigChain(
  ...layers: Array<Partial<TinkeriseUserConfig> | null | undefined>
): Partial<TinkeriseUserConfig> {
  const defined = layers.filter(
    (l): l is Partial<TinkeriseUserConfig> => l != null,
  )

  if (defined.length === 0) return {}
  if (defined.length === 1) return defined[0]!

  return deepmerge(...(defined as [Partial<TinkeriseUserConfig>, ...Partial<TinkeriseUserConfig>[]])) as Partial<TinkeriseUserConfig>
}
