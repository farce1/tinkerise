/**
 * Enhancement executor — orchestrates the detect -> conflict -> install pipeline.
 *
 * Runs enhancement modules in topologically sorted order, resolves conflicts
 * via caller-provided callbacks, and continues on failure, reporting all
 * failures at the end.
 */

import type { ConflictAction } from './conflict.js'
import type { EnhancementModule, FrameworkId, ProjectContext } from './types.js'
import { readFile, writeFile } from 'node:fs/promises'
import { tinkeriseLog } from '../executor/framing.js'
import { showFileDiff } from './conflict.js'
import { CyclicDependencyError, topologicalSort } from './graph.js'

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
  failed: Array<{ id: string, error: string }>
  /** Modules that did not run due to an earlier failure */
  notRun: string[]
  /** Per-module install results (only for successfully installed modules) */
  results: Map<string, import('./types.js').InstallResult>
}

/**
 * Mark all modules after index `from` in `sorted` as not run.
 */
function _markRemainingAsNotRun(
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
 * Restore previously-saved file contents, tolerating per-file write failures so
 * a failed restore never aborts the rest of the run (continue-on-failure contract).
 */
async function restoreFiles(files: Iterable<readonly [string, string]>): Promise<void> {
  for (const [filePath, content] of files) {
    try {
      await writeFile(filePath, content, 'utf-8')
    }
    catch (err) {
      tinkeriseLog(`Warning: could not restore ${filePath}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

/**
 * Run the enhancement pipeline: sort -> detect -> resolve conflicts -> install.
 *
 * Modules are executed in topological (dependency-first) order.
 * Continues on failure — all modules are attempted and failures are collected.
 * In non-interactive mode, any conflict causes the module to fail (remaining modules still run).
 */
export async function runEnhancements(
  opts: EnhancementExecutorOptions,
): Promise<ExecutionSummary> {
  const summary: ExecutionSummary = {
    installed: [],
    skipped: [],
    failed: [],
    notRun: [],
    results: new Map(),
  }

  // 1. Topological sort
  let sorted: EnhancementModule[]
  try {
    sorted = topologicalSort(opts.modules)
  }
  catch (err) {
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
    }
    catch (err) {
      summary.failed.push({
        id: mod.id,
        error: err instanceof Error ? err.message : String(err),
      })
      tinkeriseLog(`Failed: ${mod.name} \u2718`)
      continue
    }

    // c. Handle conflicts when already installed
    if (detection.installed) {
      // Non-interactive mode: fail on any conflict, continue to next module
      if (!opts.interactive) {
        summary.failed.push({
          id: mod.id,
          error: 'Conflict detected in non-interactive mode',
        })
        tinkeriseLog(`Failed: ${mod.name} \u2718`)
        continue
      }

      // Store existing content before install overwrites files
      const existingContents = new Map<string, string>()
      for (const filePath of detection.configFiles) {
        try {
          existingContents.set(filePath, await readFile(filePath, 'utf-8'))
        }
        catch {
          existingContents.set(filePath, '')
        }
      }

      // Run install to generate actual proposed content on disk
      let installResult: import('./types.js').InstallResult | undefined
      try {
        installResult = await mod.install(opts.context)
      }
      catch (err) {
        summary.failed.push({
          id: mod.id,
          error: err instanceof Error ? err.message : String(err),
        })
        // Restore original files
        await restoreFiles(existingContents)
        tinkeriseLog(`Failed: ${mod.name} \u2718`)
        continue
      }

      // Show diffs and let user decide per file
      let skipModule = false
      for (const filePath of detection.configFiles) {
        const existingContent = existingContents.get(filePath) ?? ''
        let proposedContent: string
        try {
          proposedContent = await readFile(filePath, 'utf-8')
        }
        catch {
          proposedContent = existingContent
        }

        // Only show diff if content actually changed
        if (proposedContent === existingContent) {
          tinkeriseLog(`Note: ${filePath} detected as conflict but content unchanged — skipping diff`)
          continue
        }

        const diff = showFileDiff(filePath, existingContent, proposedContent)
        const action = await opts.onConflict(mod.id, filePath, diff)

        if (action === 'skip') {
          // Restore original content for this file
          await restoreFiles([[filePath, existingContent]])
          skipModule = true
          break
        }
        // 'accept'/'merge'/'replace' -> keep the new content (already on disk)
      }

      if (skipModule) {
        // Restore ALL original files for this module
        await restoreFiles(existingContents)
        summary.skipped.push(mod.id)
        tinkeriseLog(`Skipped ${mod.name}`)
        continue
      }

      // Module accepted — record as installed (install already ran)
      if (installResult && installResult.success) {
        summary.installed.push(mod.id)
        summary.results.set(mod.id, installResult)
        tinkeriseLog(`Done: ${mod.name} \u2714`)
        continue
      }
    }

    // d. Check for missing dependencies
    const missingDeps = mod.dependsOn.filter(
      dep => !summary.installed.includes(dep),
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
        summary.results.set(mod.id, result)
        tinkeriseLog(`Done: ${mod.name} \u2714`)
      }
      else {
        summary.failed.push({
          id: mod.id,
          error: result.warnings.join('; ') || 'Install returned success: false',
        })
        tinkeriseLog(`Failed: ${mod.name} \u2718`)
        continue
      }
    }
    catch (err) {
      // g. Install threw: record failure and continue to next module
      summary.failed.push({
        id: mod.id,
        error: err instanceof Error ? err.message : String(err),
      })
      tinkeriseLog(`Failed: ${mod.name} \u2718`)
      continue
    }
  }

  return summary
}
