---
phase: 05-enhancement-module-system
plan: 01
subsystem: enhancements
tags: [zod, typescript, validation, enhancement-modules, version-map]

# Dependency graph
requires:
  - phase: 02-scaffolder-registry
    provides: defineScaffolder() pattern, Zod schema validation, registry types
  - phase: 03-core-pipeline
    provides: PackageManager type from pm/detect.ts
provides:
  - EnhancementModule, ProjectContext, DetectionResult, InstallResult types
  - Zod schemas for runtime validation of enhancement module definitions
  - defineEnhancement() helper with Zod validation
  - Centralized dependencyVersionMap with 15 package version entries
  - FrameworkId union type for framework adaptation
  - Framework detection from package.json + config files
affects: [05-02, 05-03, 05-04, 05-05, 06-enhancement-modules]

# Tech tracking
tech-stack:
  added: [zod (to @tinkerise/core)]
  patterns: [defineEnhancement() mirrors defineScaffolder(), dependencyVersionMap as const satisfies]

key-files:
  created:
    - packages/core/src/enhancements/types.ts
    - packages/core/src/enhancements/schemas.ts
    - packages/core/src/enhancements/define.ts
    - packages/core/src/enhancements/version-map.ts
    - packages/core/src/enhancements/index.ts
    - packages/core/src/enhancements/framework-detect.ts
    - packages/core/tests/enhancements/define.test.ts
    - packages/core/tests/enhancements/framework-detect.test.ts
  modified:
    - packages/core/package.json

key-decisions:
  - "Direct TypeScript interfaces for types.ts rather than z.infer<> -- z.function() inferred types are too generic for typed detect/install signatures"
  - "Added zod as direct dependency to @tinkerise/core (was only in @tinkerise/shared)"
  - "Included framework-detect module from research phase as it was pre-existing in the enhancements directory with passing tests"

patterns-established:
  - "defineEnhancement(module) validates via EnhancementModuleSchema.parse() -- same pattern as defineScaffolder()"
  - "dependencyVersionMap as const satisfies Record<string, string> -- centralized version source"
  - "FrameworkRule[] with meta-frameworks first for specificity ordering"

requirements-completed: [ENH-01, ENH-08]

# Metrics
duration: 6min
completed: 2026-02-17
---

# Phase 5 Plan 1: Enhancement Module Type System Summary

**Enhancement module type system with Zod validation, defineEnhancement() helper, and centralized dependency version map for 15 packages**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-17T19:34:36Z
- **Completed:** 2026-02-17T19:40:43Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Full enhancement module type system: EnhancementModule, ProjectContext, DetectionResult, InstallResult, FrameworkId
- Zod schemas providing runtime validation with z.function() for detect/install function fields
- defineEnhancement() helper mirroring defineScaffolder() pattern for consistency
- Centralized dependency version map with 15 package versions (ESLint, Prettier, Husky, Commitlint, Vitest)
- 13 unit tests for defineEnhancement() validation and version map correctness
- Framework detection module with 22 passing tests (meta-framework priority ordering)

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhancement module types, Zod schemas, and defineEnhancement helper** - `6d848a1` (feat)
2. **Task 2: Centralized dependency version map and unit tests** - `c774af5` (feat)

## Files Created/Modified
- `packages/core/src/enhancements/types.ts` - EnhancementModule, ProjectContext, DetectionResult, InstallResult, FrameworkId types
- `packages/core/src/enhancements/schemas.ts` - Zod schemas for runtime validation with z.function()
- `packages/core/src/enhancements/define.ts` - defineEnhancement() helper with Zod validation
- `packages/core/src/enhancements/version-map.ts` - Centralized dependency version map (15 packages)
- `packages/core/src/enhancements/index.ts` - Barrel re-exports for public API
- `packages/core/src/enhancements/framework-detect.ts` - Framework detection from deps + config files
- `packages/core/tests/enhancements/define.test.ts` - 13 unit tests for defineEnhancement and version map
- `packages/core/tests/enhancements/framework-detect.test.ts` - 22 unit tests for framework detection
- `packages/core/package.json` - Added zod dependency

## Decisions Made
- **Direct interfaces over z.infer<>:** Used direct TypeScript interfaces in types.ts rather than inferring from Zod schemas. The z.function() type inference in Zod produces generic function types, losing the specific `(ctx: ProjectContext) => Promise<DetectionResult>` signatures. Direct interfaces preserve full type safety for consumers.
- **Zod added to @tinkerise/core:** Previously only in @tinkerise/shared. Enhancement schemas need validation in core, making it a direct dependency.
- **Framework-detect included:** The framework-detect module and tests (from research phase) were already present in the enhancements directory with all 22 tests passing. Included them in the Task 2 commit for completeness.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added zod dependency to @tinkerise/core**
- **Found during:** Task 1
- **Issue:** Zod was only a dependency of @tinkerise/shared, not @tinkerise/core where the enhancement schemas live
- **Fix:** Added `"zod": "^4.3.6"` to packages/core/package.json dependencies
- **Files modified:** packages/core/package.json, bun.lockb
- **Verification:** Build and typecheck pass
- **Committed in:** 6d848a1 (Task 1 commit)

**2. [Rule 3 - Blocking] Included pre-existing framework-detect files**
- **Found during:** Task 2
- **Issue:** framework-detect.ts and its test file existed in the enhancements directory from research phase but were untracked, causing pre-commit test runner to pick them up
- **Fix:** Staged and committed the files as part of Task 2 since they belong to the enhancements module
- **Files modified:** packages/core/src/enhancements/framework-detect.ts, packages/core/tests/enhancements/framework-detect.test.ts
- **Verification:** All 22 framework-detect tests pass, full suite 180 tests pass
- **Committed in:** c774af5 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for build success and test suite correctness. No scope creep.

## Issues Encountered
- Initial pre-commit hook failure due to stale turbo cache causing spurious test failures in framework-detect tests. Resolved on retry with fresh cache.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Enhancement module type system ready for all subsequent Phase 5 plans
- Plan 05-02 (Project Context Builder) can import ProjectContext, FrameworkId, and framework-detect
- Plan 05-03 (Dependency Graph) can import EnhancementModule with dependsOn field
- Plan 05-04 (Conflict Resolution) can import DetectionResult with configFiles
- All Phase 6 enhancement modules can use defineEnhancement() and dependencyVersionMap

## Self-Check: PASSED

All 9 created files verified on disk. Both commit hashes (6d848a1, c774af5) found in git log.

---
*Phase: 05-enhancement-module-system*
*Completed: 2026-02-17*
