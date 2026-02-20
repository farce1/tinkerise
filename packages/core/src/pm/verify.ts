/**
 * Binary existence verification — checks if a package manager binary
 * is available in PATH using `which`.
 */

import type { PackageManager } from './detect.js'
import which from 'which'

/**
 * Verify that a package manager binary exists in PATH.
 * Returns true if found, false otherwise.
 */
export async function verifyPmBinary(pm: PackageManager): Promise<boolean> {
  const resolved = await which(pm, { nothrow: true })
  return resolved !== null
}
