/**
 * Helper for defining scaffolder registry entries with autocomplete
 * and runtime validation.
 */

import type { ScaffolderEntry } from './types.js'
import { ScaffolderEntrySchema } from './schemas.js'

/**
 * Define a scaffolder registry entry with full type safety.
 *
 * Validates the entry at runtime via Zod and provides autocomplete
 * in TypeScript-aware editors. Throws ZodError if invalid.
 *
 * @example
 * ```ts
 * export const nextjs = defineScaffolder({
 *   name: 'next',
 *   category: 'web',
 *   command: 'npx',
 *   packageName: 'create-next-app',
 *   integration: { type: 'delegate', command: 'create-next-app' },
 * })
 * ```
 */
export function defineScaffolder(entry: ScaffolderEntry): ScaffolderEntry {
  return ScaffolderEntrySchema.parse(entry) as ScaffolderEntry
}
