/**
 * Framework selection prompt — grouped-by-category list.
 *
 * Shows all registered scaffolders in a single flat list with
 * disabled category headers (Web, Backend, Mobile). No separate
 * category selection step per user decision.
 */

import type { ScaffolderCategory } from '@tinkerise/shared'
import * as p from '@clack/prompts'
import { getAllScaffolders, getScaffoldersByCategory } from '@tinkerise/core'
import pc from 'picocolors'

/** Category display config: emoji + label */
const CATEGORY_DISPLAY: Record<string, { emoji: string, label: string }> = {
  web: { emoji: '\uD83C\uDF10', label: 'Web' },
  backend: { emoji: '\u2699\uFE0F', label: 'Backend' },
  mobile: { emoji: '\uD83D\uDCF1', label: 'Mobile' },
}

/** Ordered categories for display */
const CATEGORY_ORDER: ScaffolderCategory[] = ['web', 'backend', 'mobile']

/**
 * Prompt user to select a framework from the registry.
 *
 * @param filterCategory - Optional category filter (e.g., 'web' for `tinkerise web`)
 * @returns Selected framework name
 */
export async function selectFramework(filterCategory?: ScaffolderCategory): Promise<string> {
  const scaffolders = filterCategory
    ? getScaffoldersByCategory(filterCategory)
    : getAllScaffolders()

  // Group scaffolders by category
  const grouped = new Map<string, typeof scaffolders>()
  for (const s of scaffolders) {
    const list = grouped.get(s.category) ?? []
    list.push(s)
    grouped.set(s.category, list)
  }

  // Build flat options list with disabled category headers
  const options: Array<{ value: string, label: string, hint?: string, disabled?: boolean }> = []

  for (const cat of CATEGORY_ORDER) {
    const items = grouped.get(cat)
    if (!items || items.length === 0)
      continue

    const display = CATEGORY_DISPLAY[cat] ?? { emoji: '', label: cat }

    // Disabled category header (not selectable)
    options.push({
      value: `__header_${cat}`,
      label: pc.bold(`${display.emoji} ${display.label}`),
      disabled: true,
    })

    // Framework items under this category
    for (const s of items) {
      options.push({
        value: s.name,
        label: `  ${s.name}`,
        hint: s.packageName,
      })
    }
  }

  const result = await p.select({
    message: 'What would you like to create?',
    options,
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  // Defensive: ensure result is not a header sentinel
  const value = result as string
  if (value.startsWith('__header_')) {
    // Should not happen with disabled options, but guard anyway
    return selectFramework(filterCategory)
  }

  return value
}
