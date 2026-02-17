/**
 * @tinkerise/core — Business logic for tinkerise CLI.
 */

import { VERSION } from '@tinkerise/shared'

/**
 * Returns the current tinkerise version.
 */
export function getVersion(): string {
  return VERSION
}

/**
 * Registry — scaffolder lookup and resolution.
 */
export {
  getAllScaffolders,
  getScaffolder,
  getScaffoldersByCategory,
} from './registry/index.js'
