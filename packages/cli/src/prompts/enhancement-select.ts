/**
 * Interactive multi-select picker for available enhancements.
 *
 * Already-installed enhancements appear as disabled/checked.
 * User sees the full picture but can only select uninstalled ones.
 */

import * as p from '@clack/prompts'
import type { EnhancementModule, ProjectContext } from '@tinkerise/core'
import { allEnhancementModules } from '@tinkerise/core'

/**
 * Show interactive multi-select picker for enhancements.
 *
 * Runs detect() on all modules to check installed state.
 * Returns the selected modules (only uninstalled ones are selectable).
 */
export async function showEnhancementPicker(
  ctx: ProjectContext,
): Promise<EnhancementModule[]> {
  // Run detect() on all modules in parallel
  const detections = await Promise.all(
    allEnhancementModules.map(async (mod) => ({
      mod,
      detection: await mod.detect(ctx),
    })),
  )

  const options = detections.map(({ mod, detection }) => ({
    value: mod.id,
    label: mod.name,
    hint: detection.installed ? 'already installed' : mod.description,
  }))

  // Check if all are installed
  const allInstalled = detections.every(({ detection }) => detection.installed)
  if (allInstalled) {
    p.log.info('All enhancements are already installed.')
    return []
  }

  const selected = await p.multiselect({
    message: 'Select enhancements to add:',
    options,
    required: false,
  })

  if (p.isCancel(selected)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  // Map selected IDs back to modules
  return (selected as string[])
    .map(id => allEnhancementModules.find(m => m.id === id))
    .filter((m): m is EnhancementModule => m !== undefined)
}
