/**
 * List command — show available scaffolders grouped by category.
 *
 * Two display modes:
 * - Default (`tinkerise list`): minimal view with scaffolder names grouped by category
 * - Filtered (`tinkerise list web`): detailed view with descriptions, packages, and flags
 *
 * Prerequisite status shown next to each scaffolder (checkmark or X).
 */

import type { ScaffolderCategory, ScaffolderEntry } from '@tinkerise/shared'
import { allEnhancementModules, checkPrerequisite, getAllScaffolders, getScaffolderMetadata, getScaffoldersByCategory, TEMPLATE_METADATA } from '@tinkerise/core'
import pc from 'picocolors'

const CATEGORY_ORDER: ScaffolderCategory[] = ['web', 'backend', 'mobile']
const CATEGORY_LABELS: Record<string, string> = {
  web: 'Web',
  backend: 'Backend',
  mobile: 'Mobile',
}

/**
 * Check if all prerequisites for a scaffolder are met.
 */
async function checkPrereqStatus(entry: ScaffolderEntry): Promise<boolean> {
  if (entry.prerequisites.length === 0)
    return true
  try {
    for (const prereq of entry.prerequisites) {
      const result = await checkPrerequisite(prereq)
      if (!result.ok)
        return false
    }
    return true
  }
  catch {
    return false
  }
}

/**
 * List all available scaffolders, optionally filtered by category.
 */
export async function listScaffolders(filterCategory?: string): Promise<void> {
  // Validate category if provided
  if (filterCategory && !CATEGORY_ORDER.includes(filterCategory as ScaffolderCategory)) {
    console.error(pc.red(`Unknown category: '${filterCategory}'. Valid: ${CATEGORY_ORDER.join(', ')}`))
    process.exit(1)
  }

  const scaffolders = filterCategory
    ? getScaffoldersByCategory(filterCategory as ScaffolderCategory)
    : getAllScaffolders()

  if (scaffolders.length === 0) {
    console.log(pc.dim('No scaffolders available.'))
    return
  }

  // Group by category
  const grouped = new Map<string, ScaffolderEntry[]>()
  for (const s of scaffolders) {
    const list = grouped.get(s.category) ?? []
    list.push(s)
    grouped.set(s.category, list)
  }

  for (const cat of CATEGORY_ORDER) {
    const items = grouped.get(cat)
    if (!items || items.length === 0)
      continue

    const label = CATEGORY_LABELS[cat] ?? cat
    console.log(`\n${pc.bold(label)}`)

    for (const item of items) {
      const prereqOk = await checkPrereqStatus(item)
      const icon = prereqOk ? pc.green('\u2713') : pc.red('\u2717')
      const metadata = getScaffolderMetadata(item.name)
      const displayName = metadata?.displayName ?? item.name

      if (filterCategory) {
        // Detailed view: name, description, package
        console.log(`  ${icon} ${pc.bold(displayName)}`)
        if (metadata?.description) {
          console.log(`    ${pc.dim(metadata.description)}`)
        }
        console.log(`    ${pc.dim(`Package: ${item.packageName}`)}`)

        // Show supported unified flags
        const supportedFlags = item.flags
          .filter(f => f.native !== '') // Exclude silent/no-op flags
          .map(f => `--${f.unified}`)
        if (supportedFlags.length > 0) {
          console.log(`    ${pc.dim(`Flags: ${supportedFlags.join(', ')}`)}`)
        }
      }
      else {
        // Minimal view: just name
        console.log(`  ${icon} ${displayName}`)
      }
    }
  }

  // Templates section — always shown (no category filter hides them)
  if (!filterCategory) {
    console.log(`\n${pc.bold('Templates')}`)
    for (const tmpl of TEMPLATE_METADATA) {
      const icon = pc.green('\u2713')
      console.log(`  ${icon} ${tmpl.command.padEnd(10)} ${pc.dim(tmpl.description)}`)
    }
  }

  // Enhancements section — shown in default view (no category filter)
  if (!filterCategory) {
    console.log(`\n${pc.bold('Enhancements')}`)
    for (const mod of allEnhancementModules) {
      const icon = pc.green('\u2713')
      console.log(`  ${icon} ${mod.id.padEnd(14)} ${pc.dim(mod.description)}`)
    }
  }

  console.log() // trailing newline
}
