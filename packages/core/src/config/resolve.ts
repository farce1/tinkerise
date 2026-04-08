/**
 * Config resolver — the single entry point for resolving configuration.
 *
 * Orchestrates loading from all config sources (global JSON, project TS,
 * CLI flags, preset) and merging them in priority order. Silent merge — no
 * warnings when layers override each other (per user decision).
 */

import type { TinkeriseUserConfig } from '@tinkerise/shared'
import { loadGlobalConfig } from './global.js'
import { mergeConfigChain } from './merge.js'
import { loadPreset } from './preset.js'
import { loadProjectConfig } from './project.js'

/**
 * Options for resolving the final merged configuration.
 */
export interface ResolveConfigOptions {
  /** Project directory to search for tinkerise.config.ts */
  projectDir?: string
  /** CLI flag overrides (highest priority) */
  cliFlags?: Partial<TinkeriseUserConfig>
  /** Active preset name — loaded and used as lowest priority layer */
  presetName?: string
  /** Whether to load executable project config (tinkerise.config.ts). Default: true */
  includeProjectConfig?: boolean
}

/**
 * Resolves the final configuration by loading and merging all available
 * config sources in priority order:
 *
 * 1. Preset config (lowest priority) — loaded by name if presetName provided
 * 2. Global config (~/.config/tinkerise/config.json) — overrides preset
 * 3. Project config (tinkerise.config.ts in projectDir) — overrides global
 *    (skipped when includeProjectConfig is false)
 * 4. CLI flags — highest priority, overrides everything
 *
 * Missing sources are silently skipped. Returns `{}` if no config found.
 */
export async function resolveConfig(
  options: ResolveConfigOptions = {},
): Promise<Partial<TinkeriseUserConfig>> {
  // Load preset config if a preset name is provided
  let presetConfig: Partial<TinkeriseUserConfig> | null = null
  if (options.presetName) {
    const preset = await loadPreset(options.presetName)
    presetConfig = preset?.config ?? null
  }

  const globalConfig = await loadGlobalConfig()
  const projectConfig = options.includeProjectConfig === false
    ? null
    : await loadProjectConfig(options.projectDir ?? process.cwd())

  return mergeConfigChain(presetConfig, globalConfig, projectConfig, options.cliFlags)
}
