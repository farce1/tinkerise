/**
 * Enhancement module system — public API.
 *
 * Re-exports types, schemas, defineEnhancement helper, and
 * the centralized dependency version map.
 */

// Types
export type {
  DetectionResult,
  EnhancementModule,
  FrameworkId,
  InstallResult,
  ProjectContext,
} from './types.js'

// Schemas
export {
  DetectionResultSchema,
  EnhancementModuleSchema,
  InstallResultSchema,
} from './schemas.js'

// Helper
export { defineEnhancement } from './define.js'

// Version map (created in Task 2)
export { dependencyVersionMap } from './version-map.js'
export type { DependencyName } from './version-map.js'
