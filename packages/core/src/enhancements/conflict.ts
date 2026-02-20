/**
 * Conflict resolution utilities for the enhancement module system.
 *
 * Provides diff display (colored terminal output) and intelligent
 * config merging with array deduplication for skip/merge/replace flows.
 */

import { deepmergeCustom } from 'deepmerge-ts'
import { createPatch } from 'diff'
import pc from 'picocolors'

/** Action a user can take when a config conflict is detected */
export type ConflictAction = 'skip' | 'merge' | 'replace'

/**
 * Color a unified diff string for terminal display.
 *
 * - Additions (`+`): green
 * - Removals (`-`): red
 * - Hunk headers (`@@`): cyan
 * - Everything else: dim
 *
 * Lines starting with `+++` or `---` are treated as file headers (dim),
 * not as additions/removals.
 */
export function formatColoredDiff(patch: string): string {
  return patch
    .split('\n')
    .map((line) => {
      if (line.startsWith('@@'))
        return pc.cyan(line)
      if (line.startsWith('+++') || line.startsWith('---'))
        return pc.dim(line)
      if (line.startsWith('+'))
        return pc.green(line)
      if (line.startsWith('-'))
        return pc.red(line)
      return pc.dim(line)
    })
    .join('\n')
}

/**
 * Generate a colored unified diff between two file contents.
 *
 * @param filePath - File path used as the diff header label
 * @param existingContent - Current file contents
 * @param proposedContent - Proposed new contents
 * @returns Colored diff string ready for terminal display
 */
export function showFileDiff(
  filePath: string,
  existingContent: string,
  proposedContent: string,
): string {
  const patch = createPatch(filePath, existingContent, proposedContent)
  return formatColoredDiff(patch)
}

/**
 * Custom deep merge for config files.
 *
 * - Objects are merged recursively
 * - Primitive arrays (strings, numbers) are concatenated and deduplicated
 * - Object arrays are concatenated without deduplication (user reviews via diff)
 * - Idempotent: merging the same config twice produces identical output
 */
export const mergeConfigs = deepmergeCustom({
  mergeArrays(values) {
    const merged = values.flat()

    // Check if all items are primitives (strings/numbers/booleans)
    const allPrimitive = merged.every(
      item =>
        typeof item === 'string'
        || typeof item === 'number'
        || typeof item === 'boolean',
    )

    if (allPrimitive) {
      // Deduplicate primitives
      return [...new Set(merged)]
    }

    // Object arrays: concatenate without dedup
    return merged
  },
})

/**
 * Parse JSON config content with a helpful error message on failure.
 *
 * @param content - Raw JSON string
 * @returns Parsed object
 * @throws Error with descriptive message if parsing fails
 */
export function parseJsonConfig(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content) as Record<string, unknown>
  }
  catch (err) {
    const message
      = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to parse JSON config: ${message}. `
      + 'Check for trailing commas or syntax errors.',
    )
  }
}
