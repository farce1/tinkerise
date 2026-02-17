/**
 * Enhancement summary card — styled output matching the scaffold summary card.
 *
 * Uses the same tinkeriseLog/tinkeriseBlankLine framing as the scaffold
 * summary card for visual consistency.
 */

import pc from 'picocolors'
import { tinkeriseBlankLine, tinkeriseLog } from '../executor/framing.js'
import type { ExecutionSummary } from './executor.js'
import type { InstallResult } from './types.js'

/**
 * Display a styled enhancement summary card.
 *
 * Shows installed (green checkmark), skipped (yellow dash),
 * failed (red x with error), and not-run (dimmed) modules.
 */
export function showEnhancementSummary(summary: ExecutionSummary): void {
  tinkeriseBlankLine()
  tinkeriseLog(pc.bold('Enhancement Summary'))
  tinkeriseLog('')

  // Installed modules
  for (const id of summary.installed) {
    tinkeriseLog(`  ${pc.green('\u2714')} ${id}`)
  }

  // Skipped modules
  for (const id of summary.skipped) {
    tinkeriseLog(`  ${pc.yellow('-')} ${id} ${pc.yellow('(skipped)')}`)
  }

  // Failed modules
  for (const { id, error } of summary.failed) {
    tinkeriseLog(`  ${pc.red('\u2718')} ${id} ${pc.red(error)}`)
  }

  // Not-run modules
  if (summary.notRun.length > 0) {
    tinkeriseLog('')
    tinkeriseLog(pc.dim(`  Not run: ${summary.notRun.join(', ')}`))
  }

  tinkeriseBlankLine()
}

/** Info for a per-enhancement summary card */
export interface EnhancementNextSteps {
  moduleId: string
  moduleName: string
  result: InstallResult
  nextSteps: string[]
}

/**
 * Display a detailed per-enhancement summary card.
 *
 * Shows: module name, files created/modified, packages installed, next steps.
 * Called once per successfully installed module.
 */
export function showPerEnhancementSummary(info: EnhancementNextSteps): void {
  tinkeriseBlankLine()
  tinkeriseLog(pc.bold(info.moduleName))

  if (info.result.filesModified.length > 0) {
    tinkeriseLog(`  ${pc.dim('Files:')} ${info.result.filesModified.join(', ')}`)
  }

  if (info.result.packagesAdded.length > 0) {
    tinkeriseLog(`  ${pc.dim('Packages:')} ${info.result.packagesAdded.join(', ')}`)
  }

  if (info.result.warnings.length > 0) {
    for (const w of info.result.warnings) {
      tinkeriseLog(`  ${pc.yellow('!')} ${w}`)
    }
  }

  if (info.nextSteps.length > 0) {
    tinkeriseLog(`  ${pc.dim('Next:')}`)
    for (const step of info.nextSteps) {
      tinkeriseLog(`    ${pc.cyan('>')} ${step}`)
    }
  }
}

/** Per-module suggested next steps */
export const ENHANCEMENT_NEXT_STEPS: Record<string, string[]> = {
  eslint: ['Run "npm run lint" to check your code'],
  prettier: ['Run "npm run format" to format your code'],
  husky: ['Make a commit to test the pre-commit hook'],
  ci: ['Push to GitHub to trigger the CI workflow'],
}
