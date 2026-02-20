/**
 * Enhancement module system — public API.
 *
 * Re-exports types, schemas, defineEnhancement helper, and
 * the centralized dependency version map.
 */

// Conflict resolution (05-04)
export {
  formatColoredDiff,
  mergeConfigs,
  parseJsonConfig,
  showFileDiff,
} from './conflict.js'

export type { ConflictAction } from './conflict.js'

// Project context builder (05-02)
export { buildProjectContext } from './context.js'

export type { BuildContextOptions } from './context.js'
// Helper
export { defineEnhancement } from './define.js'

// Executor (05-05)
export { runEnhancements } from './executor.js'
export type { EnhancementExecutorOptions, ExecutionSummary } from './executor.js'

// Framework detection (05-02)
export { detectFramework, FRAMEWORK_RULES } from './framework-detect.js'
export type { FrameworkDetectResult, FrameworkRule } from './framework-detect.js'

// Dependency graph (05-03)
export { CyclicDependencyError, topologicalSort } from './graph.js'

// Enhancement modules (06-03, extended 09-01 through 09-03)
export {
  allEnhancementModules,
  changelogModule,
  ciModule,
  commitlintModule,
  dockerModule,
  editorconfigModule,
  enhancementRegistry,
  envModule,
  eslintModule,
  huskyModule,
  prettierModule,
  renovateModule,
  testingModule,
} from './modules/index.js'
// Schemas
export {
  DetectionResultSchema,
  EnhancementModuleSchema,
  InstallResultSchema,
} from './schemas.js'

// Summary card (05-05, extended 06-03)
export { ENHANCEMENT_NEXT_STEPS, showEnhancementSummary, showPerEnhancementSummary } from './summary.js'
export type { EnhancementNextSteps } from './summary.js'

// Types
export type {
  DetectionResult,
  EnhancementModule,
  FrameworkId,
  InstallResult,
  ProjectContext,
} from './types.js'
// Version map (created in Task 2)
export { dependencyVersionMap } from './version-map.js'

export type { DependencyName } from './version-map.js'
