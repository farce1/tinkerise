/**
 * Project-level config loading — loads tinkerise.config.ts from a project
 * directory using jiti for runtime TypeScript execution (no build step).
 */

import type { TinkeriseUserConfig } from '@tinkerise/shared'
import { resolve } from 'node:path'
import { TinkeriseUserConfigSchema } from '@tinkerise/shared'
import { createJiti } from 'jiti'

/** The expected project config filename */
export const CONFIG_FILENAME = 'tinkerise.config.ts' as const

/**
 * Loads a tinkerise.config.ts file from the given project directory.
 *
 * Uses jiti to transpile and execute the TypeScript config file at runtime,
 * without requiring a build step or tsconfig. The file should use
 * `defineConfig()` and export default.
 *
 * Returns null if the file doesn't exist, has no default export,
 * or contains invalid configuration values.
 */
export async function loadProjectConfig(
  projectDir: string,
): Promise<Partial<TinkeriseUserConfig> | null> {
  try {
    const configPath = resolve(projectDir, CONFIG_FILENAME)

    const jiti = createJiti(import.meta.url, {
      fsCache: false, // Config files change between runs
      moduleCache: false, // Always re-read (pitfall #1: stale reads)
    })

    const raw = await jiti.import(configPath, {
      default: true, // Unwrap default export automatically
      try: true, // Returns undefined instead of throwing if file missing
    })

    if (!raw)
      return null

    const parsed = TinkeriseUserConfigSchema.parse(raw)

    // If Zod stripped all keys (e.g., module namespace with only named exports,
    // no default export), treat as missing config
    if (Object.keys(parsed).length === 0)
      return null

    return parsed
  }
  catch {
    return null
  }
}
