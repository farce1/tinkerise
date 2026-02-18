/**
 * Config resolver — the single entry point for resolving configuration.
 *
 * Orchestrates loading from all config sources (global JSON, project TS,
 * CLI flags) and merging them in priority order. Silent merge — no
 * warnings when layers override each other (per user decision).
 */

import type { TinkeriseUserConfig } from '@tinkerise/shared'
import { loadGlobalConfig } from './global.js'
import { loadProjectConfig } from './project.js'
import { mergeConfigChain } from './merge.js'

/**
 * Options for resolving the final merged configuration.
 */
export interface ResolveConfigOptions {
  /** Project directory to search for tinkerise.config.ts */
  projectDir?: string
  /** CLI flag overrides (highest priority) */
  cliFlags?: Partial<TinkeriseUserConfig>
}

/**
 * Resolves the final configuration by loading and merging all available
 * config sources in priority order:
 *
 * 1. Global config (~/.config/tinkerise/config.json) — lowest priority
 * 2. Project config (tinkerise.config.ts in projectDir) — overrides global
 * 3. CLI flags — highest priority, overrides everything
 *
 * Missing sources are silently skipped. Returns `{}` if no config found.
 */
export async function resolveConfig(
  options: ResolveConfigOptions = {},
): Promise<Partial<TinkeriseUserConfig>> {
  const globalConfig = await loadGlobalConfig()
  const projectConfig = await loadProjectConfig(options.projectDir ?? process.cwd())

  return mergeConfigChain(globalConfig, projectConfig, options.cliFlags)
}
