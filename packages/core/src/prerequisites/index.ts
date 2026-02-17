/**
 * Prerequisites module — tool existence and version validation.
 */

export {
  checkPrerequisite,
  checkPrerequisites,
  PrerequisiteError,
} from './checker.js'
export type { PrereqResult } from './checker.js'
export { detectPlatform, getInstallInstructions } from './platform.js'
export type { Platform } from './platform.js'
