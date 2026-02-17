/**
 * Branded output utilities for tinkerise CLI.
 *
 * Color approach: Subtle, muted, professional. Not loud or rainbow.
 * Matches gh CLI aesthetic — monochrome with minimal accent color.
 */

import pc from 'picocolors'

/**
 * Print the tinkerise branding header.
 * Used during scaffolding operations (Phase 2+) for a tasteful intro.
 */
export function printBranding(): void {
  console.log()
  console.log(pc.dim('  tinkerise'))
  console.log()
}

/** Dim text for secondary information */
export function dim(text: string): string {
  return pc.dim(text)
}

/** Bold text for emphasis */
export function bold(text: string): string {
  return pc.bold(text)
}

/** Green text for success messages */
export function success(text: string): string {
  return pc.green(text)
}

/** Red text for error messages */
export function error(text: string): string {
  return pc.red(text)
}

/** Yellow text for warning messages */
export function warn(text: string): string {
  return pc.yellow(text)
}
