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

// Framework detection (05-02)
export { detectFramework, FRAMEWORK_RULES } from './framework-detect.js'
export type { FrameworkRule, FrameworkDetectResult } from './framework-detect.js'

// Project context builder (05-02)
export { buildProjectContext } from './context.js'
export type { BuildContextOptions } from './context.js'

// Dependency graph (05-03)
export { topologicalSort, CyclicDependencyError } from './graph.js'

// Conflict resolution (05-04)
export {
  formatColoredDiff,
  showFileDiff,
  mergeConfigs,
  parseJsonConfig,
} from './conflict.js'
export type { ConflictAction } from './conflict.js'

// Executor (05-05)
export { runEnhancements } from './executor.js'
export type { EnhancementExecutorOptions, ExecutionSummary } from './executor.js'

// Summary card (05-05, extended 06-03)
export { showEnhancementSummary, showPerEnhancementSummary, ENHANCEMENT_NEXT_STEPS } from './summary.js'
export type { EnhancementNextSteps } from './summary.js'

// Enhancement modules (06-03)
export {
  allEnhancementModules,
  ciModule,
  enhancementRegistry,
  eslintModule,
  huskyModule,
  prettierModule,
} from './modules/index.js'
