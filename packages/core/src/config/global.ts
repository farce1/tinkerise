/**
 * Global config file operations — persistent user preferences at
 * ~/.config/tinkerise/config.json (XDG-compliant).
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { TinkeriseUserConfigSchema } from '@tinkerise/shared'
import type { TinkeriseUserConfig } from '@tinkerise/shared'

/**
 * Returns the XDG-compliant config directory for tinkerise.
 * Defaults to ~/.config/tinkerise if XDG_CONFIG_HOME is not set.
 */
export function getConfigDir(): string {
  const xdgHome = process.env['XDG_CONFIG_HOME'] || path.join(os.homedir(), '.config')
  return path.join(xdgHome, 'tinkerise')
}

/**
 * Returns the full path to the global config file.
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json')
}

/**
 * Loads the global config from disk.
 * Returns null if the file doesn't exist or contains invalid data.
 */
export async function loadGlobalConfig(): Promise<Partial<TinkeriseUserConfig> | null> {
  try {
    const raw = await readFile(getConfigPath(), 'utf-8')
    const data: unknown = JSON.parse(raw)
    return TinkeriseUserConfigSchema.parse(data)
  } catch {
    return null
  }
}

/**
 * Saves the global config to disk.
 * Creates the config directory if it doesn't exist.
 * Validates the config before writing.
 */
export async function saveGlobalConfig(config: Partial<TinkeriseUserConfig>): Promise<void> {
  const validated = TinkeriseUserConfigSchema.parse(config)
  const configDir = getConfigDir()
  await mkdir(configDir, { recursive: true })
  await writeFile(getConfigPath(), JSON.stringify(validated, null, 2) + '\n', 'utf-8')
}

/**
 * Returns the value of a specific global config key, or undefined if not set.
 */
export async function getGlobalConfigValue<K extends keyof TinkeriseUserConfig>(
  key: K,
): Promise<TinkeriseUserConfig[K] | undefined> {
  const config = await loadGlobalConfig()
  if (!config) return undefined
  return config[key] as TinkeriseUserConfig[K] | undefined
}

/**
 * Sets a single global config key. Loads existing config (or starts fresh),
 * updates the key, validates the full object, and saves back.
 */
export async function setGlobalConfigValue<K extends keyof TinkeriseUserConfig>(
  key: K,
  value: TinkeriseUserConfig[K],
): Promise<void> {
  const existing = (await loadGlobalConfig()) ?? {}
  const updated = { ...existing, [key]: value }
  await saveGlobalConfig(updated)
}
