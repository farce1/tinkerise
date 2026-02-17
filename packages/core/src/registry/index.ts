/**
 * Registry loader — resolves scaffolders by name and category.
 *
 * All scaffolder entries are statically imported and registered at module load.
 * Adding a new scaffolder requires only a data entry in the appropriate
 * category file (e.g., scaffolders/web.ts) — no logic changes here (REG-01).
 */

import type { ScaffolderCategory, ScaffolderEntry } from '@tinkerise/shared'
import { astro, nextjs, remix, t3, tanstack, turbo, vite } from './scaffolders/web.js'

/** Private registry store */
const registry = new Map<string, ScaffolderEntry>()

/**
 * Register one or more scaffolder entries.
 * Throws on duplicate names to prevent silent overwrites.
 */
function register(...entries: ScaffolderEntry[]): void {
  for (const entry of entries) {
    if (registry.has(entry.name)) {
      throw new Error(`Duplicate scaffolder: '${entry.name}' is already registered`)
    }
    registry.set(entry.name, entry)
  }
}

// Register all built-in scaffolders
register(nextjs, vite, astro, t3, remix, tanstack, turbo)

/**
 * Look up a scaffolder by name.
 */
export function getScaffolder(name: string): ScaffolderEntry | undefined {
  return registry.get(name)
}

/**
 * Get all registered scaffolders.
 */
export function getAllScaffolders(): ScaffolderEntry[] {
  return [...registry.values()]
}

/**
 * Get scaffolders filtered by category.
 */
export function getScaffoldersByCategory(category: ScaffolderCategory): ScaffolderEntry[] {
  return [...registry.values()].filter(s => s.category === category)
}
