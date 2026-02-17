/**
 * Package Manager Detection — public API.
 *
 * Re-exports detection pipeline, binary verification, and types.
 */

export {
  detectFromLockfile,
  detectFromPackageJson,
  detectPackageManager,
  LOCKFILE_MAP,
  VALID_PMS,
} from './detect.js'
export type { DetectResult, PackageManager } from './detect.js'

export { verifyPmBinary } from './verify.js'
