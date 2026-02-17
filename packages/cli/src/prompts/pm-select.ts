/**
 * Package manager selection prompt — fallback when PM is not detected.
 */

import * as p from '@clack/prompts'
import type { PackageManager } from '@tinkerise/core'

/**
 * Prompt user to choose a package manager.
 *
 * Used when no lockfile or packageManager field is found,
 * or when the detected PM binary is not installed.
 *
 * @returns Selected package manager
 */
export async function promptPackageManager(): Promise<PackageManager> {
  const result = await p.select({
    message: 'Which package manager would you like to use?',
    options: [
      { value: 'npm', label: 'npm' },
      { value: 'pnpm', label: 'pnpm', hint: 'fast, disk-efficient' },
      { value: 'yarn', label: 'yarn' },
      { value: 'bun', label: 'bun', hint: 'fast all-in-one runtime' },
    ],
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  return result as PackageManager
}
