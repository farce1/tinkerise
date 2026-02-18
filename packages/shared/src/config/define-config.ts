/**
 * defineConfig — typed identity function for tinkerise.config.ts files.
 *
 * Enables autocomplete and type checking in user config files:
 * ```ts
 * import { defineConfig } from '@tinkerise/shared'
 * export default defineConfig({ packageManager: 'pnpm' })
 * ```
 *
 * Per user decision: simple typed object wrapper, no callback/async patterns.
 */

import type { TinkeriseUserConfig } from './types.js'

export function defineConfig(config: TinkeriseUserConfig): TinkeriseUserConfig {
  return config
}
