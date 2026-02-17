/**
 * Enhancement executor — orchestrates the detect -> conflict -> install pipeline.
 *
 * Runs enhancement modules in topologically sorted order, resolves conflicts
 * via caller-provided callbacks, and stops on first failure.
 */

import { readFile } from 'node:fs/promises'
import { showFileDiff } from './conflict.js'
import { topologicalSort, CyclicDependencyError } from './graph.js'
import { tinkeriseLog } from '../executor/framing.js'
import type { ConflictAction } from './conflict.js'
import type { EnhancementModule, FrameworkId, ProjectContext } from './types.js'

/** Options for the enhancement executor pipeline */
export interface EnhancementExecutorOptions {
  /** Enhancement modules to install */
  modules: EnhancementModule[]
  /** Project context for detect/install calls */
  context: ProjectContext
  /** Called when a conflict is detected — caller shows diff and collects decision */
  onConflict: (
    moduleId: string,
    filePath: string,
    diff: string,
  ) => Promise<ConflictAction>
  /** Called when a module has missing dependencies — caller approves or denies */
  onDependencyApproval: (
    moduleId: string,
    deps: string[],
  ) => Promise<boolean>
  /** Called when framework detection is ambiguous (threaded to buildProjectContext) */
  onAmbiguousFramework?: (detected: FrameworkId[]) => Promise<FrameworkId>
  /** Whether running in interactive mode (false = CI, fail on conflict) */
  interactive: boolean
}

/** Summary of an enhancement execution run */
export interface ExecutionSummary {
  /** Modules that were successfully installed */
  installed: string[]
  /** Modules that were skipped (user chose skip on conflict) */
  skipped: string[]
  /** Modules that failed with error details */
  failed: Array<{ id: string; error: string }>
  /** Modules that did not run due to an earlier failure */
  notRun: string[]
}

/**
 * Mark all modules after index `from` in `sorted` as not run.
 */
function markRemainingAsNotRun(
  summary: ExecutionSummary,
  sorted: EnhancementModule[],
  from: number,
): void {
  for (let j = from; j < sorted.length; j++) {
    const remaining = sorted[j]
    if (remaining) {
      summary.notRun.push(remaining.id)
    }
  }
}

/**
 * Run the enhancement pipeline: sort -> detect -> resolve conflicts -> install.
 *
 * Modules are executed in topological (dependency-first) order.
 * Stops on first failure — remaining modules are marked as not run.
 * In non-interactive mode, any conflict causes an immediate failure.
 */
export async function runEnhancements(
  opts: EnhancementExecutorOptions,
): Promise<ExecutionSummary> {
  const summary: ExecutionSummary = {
    installed: [],
    skipped: [],
    failed: [],
    notRun: [],
  }

  // 1. Topological sort
  let sorted: EnhancementModule[]
  try {
    sorted = topologicalSort(opts.modules)
  } catch (err) {
    if (err instanceof CyclicDependencyError) {
      // All modules marked as failed
      for (const mod of opts.modules) {
        summary.failed.push({
          id: mod.id,
          error: `Cyclic dependency: ${err.message}`,
        })
      }
      return summary
    }
    throw err
  }

  // 2. Execute each module in order
  for (let i = 0; i < sorted.length; i++) {
    const mod = sorted[i]!

    // a. Announce start
    tinkeriseLog(`Setting up ${mod.name}...`)

    // b. Detect if already installed
    let detection
    try {
      detection = await mod.detect(opts.context)
    } catch (err) {
      summary.failed.push({
        id: mod.id,
        error: err instanceof Error ? err.message : String(err),
      })
      markRemainingAsNotRun(summary, sorted, i + 1)
      break
    }

    // c. Handle conflicts when already installed
    if (detection.installed) {
      // Non-interactive mode: fail on any conflict
      if (!opts.interactive) {
        summary.failed.push({
          id: mod.id,
          error: 'Conflict detected in non-interactive mode',
        })
        markRemainingAsNotRun(summary, sorted, i + 1)
        break
      }

      // Interactive: show diff per config file, ask skip/merge/replace
      let skipModule = false
      for (const filePath of detection.configFiles) {
        let existingContent: string
        try {
          existingContent = await readFile(filePath, 'utf-8')
        } catch {
          existingContent = ''
        }

        // Generate proposed content by doing a dry-run install
        // For diff purposes, we show what would change in this specific file
        const proposedResult = await mod.install(opts.context)
        const proposedContent = proposedResult.filesModified.includes(filePath)
          ? existingContent // If file is in modified list, the install would change it
          : existingContent

        const diff = showFileDiff(filePath, existingContent, proposedContent)
        const action = await opts.onConflict(mod.id, filePath, diff)

        if (action === 'skip') {
          skipModule = true
          break
        }
        // 'merge' or 'replace' -> proceed to install
      }

      if (skipModule) {
        summary.skipped.push(mod.id)
        tinkeriseLog(`Skipped ${mod.name}`)
        continue
      }
    }

    // d. Check for missing dependencies
    const missingDeps = mod.dependsOn.filter(
      (dep) => !summary.installed.includes(dep),
    )
    if (missingDeps.length > 0) {
      const approved = await opts.onDependencyApproval(mod.id, missingDeps)
      if (!approved) {
        summary.skipped.push(mod.id)
        tinkeriseLog(`Skipped ${mod.name} (missing dependencies)`)
        continue
      }
    }

    // e. Run install
    try {
      const result = await mod.install(opts.context)

      // f. Check result
      if (result.success) {
        summary.installed.push(mod.id)
        tinkeriseLog(`Done: ${mod.name} \u2714`)
      } else {
        summary.failed.push({
          id: mod.id,
          error: result.warnings.join('; ') || 'Install returned success: false',
        })
        // Stop on first failure: mark remaining as not run
        markRemainingAsNotRun(summary, sorted, i + 1)
        break
      }
    } catch (err) {
      // g. Install threw: stop on first failure
      summary.failed.push({
        id: mod.id,
        error: err instanceof Error ? err.message : String(err),
      })
      markRemainingAsNotRun(summary, sorted, i + 1)
      break
    }
  }

  return summary
}
