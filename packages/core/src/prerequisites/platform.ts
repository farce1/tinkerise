/**
 * Platform detection and install instruction resolution.
 */

import type { Prerequisite } from '@tinkerise/shared'

export type Platform = 'darwin' | 'linux' | 'win32'

/**
 * Detect the current OS platform.
 */
export function detectPlatform(): Platform {
  return process.platform as Platform
}

/**
 * Get platform-specific installation instructions for a prerequisite.
 *
 * Returns instructions for the current platform if available,
 * otherwise falls back to a generic search link.
 */
export function getInstallInstructions(prereq: Prerequisite): string {
  const platform = detectPlatform()
  const instructions = prereq.installInstructions

  if (instructions?.[platform]) {
    return instructions[platform]!
  }

  return `Install '${prereq.command}' for your platform. See: https://search.brave.com/search?q=install+${prereq.command}`
}
