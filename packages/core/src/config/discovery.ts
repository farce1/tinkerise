/**
 * npm preset discovery — find tinkerise-preset-* packages
 * in a project's package.json dependencies.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PresetDataSchema } from '@tinkerise/shared'
import type { PresetData } from '@tinkerise/shared'

/** Prefix for unscoped preset packages */
export const PRESET_PREFIX = 'tinkerise-preset-'

/** Pattern for scoped preset packages like @myorg/tinkerise-preset-saas */
export const SCOPED_PRESET_PATTERN = /^@.+\/tinkerise-preset-/

/**
 * Checks if a package name is a tinkerise preset.
 */
function isPresetPackage(name: string): boolean {
  return name.startsWith(PRESET_PREFIX) || SCOPED_PRESET_PATTERN.test(name)
}

/**
 * Discovers npm-distributed presets by scanning a project's package.json
 * for dependencies matching the tinkerise-preset-* naming convention.
 *
 * Checks both `dependencies` and `devDependencies`.
 * Returns an empty array if package.json doesn't exist or has no matching deps.
 */
export async function discoverNpmPresets(projectDir: string): Promise<string[]> {
  try {
    const pkgPath = path.join(projectDir, 'package.json')
    const raw = await readFile(pkgPath, 'utf-8')
    const pkg: unknown = JSON.parse(raw)

    if (typeof pkg !== 'object' || pkg === null) return []

    const record = pkg as Record<string, unknown>
    const deps = (typeof record['dependencies'] === 'object' && record['dependencies'] !== null)
      ? Object.keys(record['dependencies'] as Record<string, unknown>)
      : []
    const devDeps = (typeof record['devDependencies'] === 'object' && record['devDependencies'] !== null)
      ? Object.keys(record['devDependencies'] as Record<string, unknown>)
      : []

    return [...deps, ...devDeps].filter(isPresetPackage)
  } catch {
    return []
  }
}

/**
 * Loads a preset from an installed npm package.
 *
 * Uses import.meta.resolve to find the package, then reads its main export
 * as JSON and validates with PresetDataSchema.
 *
 * Returns null if the package is not installed or the data is invalid.
 * (Per research pitfall #6: import.meta.resolve throws on missing package.)
 */
export async function loadNpmPreset(packageName: string): Promise<PresetData | null> {
  try {
    const resolved = import.meta.resolve(packageName)
    const filePath = resolved.startsWith('file://') ? new URL(resolved).pathname : resolved
    const raw = await readFile(filePath, 'utf-8')
    const data: unknown = JSON.parse(raw)
    return PresetDataSchema.parse(data)
  } catch {
    return null
  }
}
