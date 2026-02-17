---
phase: 02-scaffolder-registry-execution
plan: 02
subsystem: flags, prerequisites
tags: [semver, which, flag-mapping, version-aware, prerequisite-check]

requires:
  - phase: 02-scaffolder-registry-execution
    provides: registry schemas, types, defineScaffolder
provides:
  - Flag resolver with version-aware resolution
  - Flag applicability validator
  - Prerequisite checker with platform-aware instructions
affects: [02-03, phase-4-web-scaffolders]

tech-stack:
  added: [semver@7.7.4, which@6.0.1, execa@9.6.1, picocolors@1.1.1]
  patterns: [version-aware-flag-mapping, platform-aware-errors, no-caching-prerequisites]

key-files:
  created:
    - packages/core/src/flags/resolver.ts
    - packages/core/src/flags/validator.ts
    - packages/core/src/flags/index.ts
    - packages/core/src/prerequisites/checker.ts
    - packages/core/src/prerequisites/platform.ts
    - packages/core/src/prerequisites/index.ts
  modified:
    - packages/core/src/index.ts
    - packages/core/package.json

key-decisions:
  - "execa@9.6.1 for subprocess execution -- ESM native, signal forwarding"
  - "which@6.0.1 for cross-platform executable resolution"

patterns-established:
  - "resolveFlags() for unified-to-native flag translation"
  - "FlagNotApplicableError for clear flag validation errors"
  - "checkPrerequisites() with fresh checks every run (no caching)"

requirements-completed: [REG-02, REG-03, REG-05]

duration: 6min
completed: 2026-02-17
---

# Plan 02-02 Summary: Flag mapping engine and prerequisite checker

**Version-aware flag resolution via semver ranges, flag applicability validation, and prerequisite checking with platform-aware install instructions**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-02-17T09:50:10Z
- **Completed:** 2026-02-17T09:56:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Flag resolver maps unified flags to native upstream args with version-aware override
- Flag validator rejects inapplicable flags with clear error messages
- Prerequisite checker validates tool existence (which) and version (semver.satisfies)
- Platform-aware install instructions on prerequisite failure
- 23 new tests all passing

## Task Commits

1. **Tasks 1-2: Flag engine + prerequisite checker** - `c2469da` (feat)
2. **Task 3: Tests** - `2ac949f` (test)

## Decisions Made
- execa@9.6.1, which@6.0.1, semver@7.7.4, picocolors@1.1.1 added to @tinkerise/core
- Prerequisites check fresh every invocation per user decision (no caching)

## Deviations from Plan
None - plan executed exactly as written.

## Self-Check: PASSED
