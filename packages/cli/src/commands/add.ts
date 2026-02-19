/**
 * `tinkerise add` command — apply enhancements to existing projects.
 *
 * Entry modes:
 * - `tinkerise add` — interactive multi-select picker
 * - `tinkerise add eslint prettier` — direct (no prompts)
 *
 * Orchestrates: context build -> module selection -> execution -> summary
 */

import type { ConflictAction, EnhancementModule } from '@tinkerise/core'
import * as p from '@clack/prompts'
import {
  allEnhancementModules,
  buildProjectContext,
  ENHANCEMENT_NEXT_STEPS,
  enhancementRegistry,
  isCI,
  runEnhancements,
  showEnhancementSummary,
  showPerEnhancementSummary,
} from '@tinkerise/core'
import pc from 'picocolors'
import { getSessionContext } from '../context/session.js'
import { showEnhancementPicker } from '../prompts/enhancement-select.js'

export interface AddOptions {
  verbose?: boolean
}

/**
 * Run the `tinkerise add` command.
 *
 * @param enhancementNames - Enhancement IDs from CLI args (empty = interactive picker)
 * @param options - Command options
 */
export async function runAddCommand(
  enhancementNames: string[],
  options: AddOptions,
): Promise<void> {
  const session = await getSessionContext()

  // 1. Build project context
  const ctx = await buildProjectContext({
    rootDir: session.projectDir ?? process.cwd(),
    packageManager: session.packageManager,
    framework: session.framework,
    freshScaffold: !!session.projectDir,
    verbose: options.verbose ?? false,
    onAmbiguousFramework: isCI
      ? undefined
      : async (detected) => {
        const result = await p.select({
          message: 'Multiple frameworks detected. Which is the primary one?',
          options: detected.map(fw => ({ value: fw, label: fw })),
        })
        if (p.isCancel(result)) {
          p.cancel('Cancelled.')
          process.exit(0)
        }
        return result as typeof detected[number]
      },
  })

  // 2. Determine which enhancements to run
  let modules: EnhancementModule[]

  if (enhancementNames.length === 0) {
    // Interactive: show multi-select picker
    if (isCI) {
      p.log.error(pc.red('No enhancements specified. In CI, pass enhancement names as arguments.'))
      p.log.info(`Example: tinkerise add eslint prettier`)
      process.exit(1)
    }
    modules = await showEnhancementPicker(ctx)
    if (modules.length === 0)
      return
  }
  else {
    // Direct: resolve names to modules
    modules = enhancementNames.map((name) => {
      const mod = enhancementRegistry.get(name)
      if (!mod) {
        p.log.error(pc.red(`Unknown enhancement: '${name}'`))
        p.log.info(`Available: ${allEnhancementModules.map(m => m.id).join(', ')}`)
        process.exit(1)
      }
      return mod
    })
  }

  // 3. Run enhancement pipeline
  const summary = await runEnhancements({
    modules,
    context: ctx,
    interactive: !isCI,
    onConflict: async (moduleId, _filePath, diff): Promise<ConflictAction> => {
      if (isCI)
        return 'skip'
      console.log(diff)
      const action = await p.select({
        message: `${moduleId}: Config file already exists. What would you like to do?`,
        options: [
          { value: 'skip', label: 'Skip', hint: 'Keep existing config' },
          { value: 'replace', label: 'Replace', hint: 'Overwrite with new config' },
          { value: 'merge', label: 'Merge', hint: 'Deep merge configs' },
        ],
      })
      if (p.isCancel(action)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }
      return action as ConflictAction
    },
    onDependencyApproval: async (moduleId, deps): Promise<boolean> => {
      if (isCI)
        return true
      const result = await p.confirm({
        message: `${moduleId} requires: ${deps.join(', ')}. These were not installed in this run. Continue anyway?`,
      })
      if (p.isCancel(result)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }
      return result as boolean
    },
  })

  // 4. Show per-enhancement summary cards
  for (const installedId of summary.installed) {
    const mod = enhancementRegistry.get(installedId)
    if (!mod)
      continue
    const result = summary.results.get(installedId) ?? {
      success: true,
      filesModified: [],
      packagesAdded: [],
      warnings: [],
    }
    const nextSteps = ENHANCEMENT_NEXT_STEPS[installedId] ?? []
    showPerEnhancementSummary({
      moduleId: installedId,
      moduleName: mod.name,
      result,
      nextSteps,
    })
  }

  // 5. Show overall summary
  showEnhancementSummary(summary)
}
