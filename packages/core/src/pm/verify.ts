/**
 * Binary existence verification — checks if a package manager binary
 * is available in PATH using `which`.
 */

import which from 'which'
import type { PackageManager } from './detect.js'

/**
 * Verify that a package manager binary exists in PATH.
 * Returns true if found, false otherwise.
 */
export async function verifyPmBinary(pm: PackageManager): Promise<boolean> {
  const resolved = await which(pm, { nothrow: true })
  return resolved !== null
}
