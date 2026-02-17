/**
 * Enhancement summary card — styled output matching the scaffold summary card.
 *
 * Uses the same tinkeriseLog/tinkeriseBlankLine framing as the scaffold
 * summary card for visual consistency.
 */

import pc from 'picocolors'
import { tinkeriseBlankLine, tinkeriseLog } from '../executor/framing.js'
import type { ExecutionSummary } from './executor.js'

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
