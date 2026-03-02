/**
 * Preset CRUD operations — save, load, list, delete presets
 * stored at ~/.config/tinkerise/presets/ (XDG-compliant).
 */

import type { PresetData } from '@tinkerise/shared'
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PresetDataSchema, PresetNameSchema } from '@tinkerise/shared'
import { getConfigDir } from './global.js'

/**
 * Returns the path to the presets directory.
 * Located at {configDir}/presets/.
 */
export function getPresetsDir(): string {
  return path.join(getConfigDir(), 'presets')
}

/**
 * Saves a preset to disk.
 * Validates the preset data with Zod before writing.
 * Creates the presets directory if it doesn't exist.
 */
export async function savePreset(preset: PresetData): Promise<void> {
  const validated = PresetDataSchema.parse(preset)
  const presetsDir = getPresetsDir()
  await mkdir(presetsDir, { recursive: true })
  const filePath = path.join(presetsDir, `${validated.name}.json`)
  await writeFile(filePath, `${JSON.stringify(validated, null, 2)}\n`, 'utf-8')
}

/**
 * Loads a preset by name.
 * Returns null if the file doesn't exist, contains invalid JSON, or fails validation.
 */
export async function loadPreset(name: string): Promise<PresetData | null> {
  if (!PresetNameSchema.safeParse(name).success) {
    return null
  }

  try {
    const filePath = path.join(getPresetsDir(), `${name}.json`)
    const raw = await readFile(filePath, 'utf-8')
    const data: unknown = JSON.parse(raw)
    return PresetDataSchema.parse(data)
  }
  catch {
    return null
  }
}

/**
 * Lists all saved preset names.
 * Returns an empty array if the presets directory doesn't exist.
 */
export async function listPresets(): Promise<string[]> {
  try {
    const presetsDir = getPresetsDir()
    const entries = await readdir(presetsDir)
    return entries
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''))
  }
  catch {
    return []
  }
}

/**
 * Deletes a preset by name.
 * Returns true on success, false if the file doesn't exist.
 */
export async function deletePreset(name: string): Promise<boolean> {
  if (!PresetNameSchema.safeParse(name).success) {
    return false
  }

  try {
    const filePath = path.join(getPresetsDir(), `${name}.json`)
    await unlink(filePath)
    return true
  }
  catch {
    return false
  }
}
