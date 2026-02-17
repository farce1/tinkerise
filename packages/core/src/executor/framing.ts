/**
 * Output framing — dimmed [tinkerise] prefix for orchestration messages.
 *
 * Per user decision: "Tinkerise lines prefixed with dimmed/gray styling
 * so upstream output feels primary."
 */

import pc from 'picocolors'

/**
 * Print a tinkerise orchestration message with dimmed [tinkerise] prefix.
 * This visually separates tinkerise output from raw upstream tool output (UX-07).
 */
export function tinkeriseLog(message: string): void {
  console.log(pc.dim(`[tinkerise] ${message}`))
}

/**
 * Print a brief one-liner summary after scaffolder execution.
 * Per user decision: "After upstream finishes, show a brief one-liner summary."
 */
export function tinkeriseSummary(scaffolderName: string, projectName: string, flags: string[]): void {
  const flagStr = flags.length > 0 ? ` with ${flags.join(', ')}` : ''
  tinkeriseLog(`Created ${projectName} using ${scaffolderName}${flagStr}`)
}

/**
 * Print a blank line to visually separate tinkerise framing from upstream output.
 */
export function tinkeriseBlankLine(): void {
  console.log()
}
