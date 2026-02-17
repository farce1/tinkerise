---
phase: 04-web-framework-scaffolders
plan: 01
subsystem: registry
tags: [defineScaffolder, flag-mapping, resolver, buildCommandArgs, web-scaffolders]

# Dependency graph
requires:
  - phase: 02-registry-flags-executor
    provides: "Registry system, flag resolver, flag validator, executor pipeline"
  - phase: 03-interactive-ux
    provides: "FRAMEWORK_OPTIONS for interactive prompts"
provides:
  - "7 web scaffolder registry entries (Next.js, Vite, Astro, T3, Remix, TanStack, Turbo)"
  - "Multi-word native flag splitting in resolver (Astro --add tailwindcss)"
  - "Empty string sentinel for silent/no-op flags (always-TS scaffolders)"
  - "Multi-word integration command splitting in buildCommandArgs (TanStack @tanstack/cli create)"
  - "FRAMEWORK_OPTIONS extended for Astro, T3, TanStack"
  - "57 new tests covering registry entries and flag applicability matrix"
affects: [04-02, 04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-word native flags via space-split in resolver"
    - "Empty string sentinel for silent flag accept"
    - "Multi-word integration commands via space-split in buildCommandArgs"
    - "Shared nodePrerequisite() helper for DRY prerequisite definitions"

key-files:
  created:
    - packages/core/tests/registry/web-scaffolders.test.ts
    - packages/core/tests/flags/web-flag-mapping.test.ts
  modified:
    - packages/core/src/registry/scaffolders/web.ts
    - packages/core/src/registry/index.ts
    - packages/core/src/flags/resolver.ts
    - packages/core/src/executor/index.ts
    - packages/cli/src/prompts/options-select.ts

key-decisions:
  - "Multi-word native flags split on whitespace in resolver (backward-compatible, handles Astro --add tailwindcss)"
  - "Empty string sentinel native: '' for silent flag accept (resolver skips empty strings)"
  - "Multi-word integration commands split on whitespace in buildCommandArgs (handles TanStack @tanstack/cli create)"
  - "Shared nodePrerequisite() helper extracts common Node.js prerequisite pattern"

patterns-established:
  - "Silent flag accept: native: '' means flag is accepted but produces no args"
  - "Multi-word native: 'flag1 flag2' splits into multiple args automatically"
  - "Multi-word integration command: 'pkg subcommand' splits into multiple args"

requirements-completed: [WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, FLAG-01, FLAG-02, FLAG-03, FLAG-04, FLAG-05, FLAG-06]

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 4 Plan 1: Web Scaffolder Registry Summary

**7 web scaffolders registered with flag mappings, multi-word native flag splitting, and 57 new tests covering the full flag applicability matrix**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T13:43:24Z
- **Completed:** 2026-02-17T13:47:02Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Registered all 7 web scaffolders (Next.js updated, Vite, Astro, T3, Remix, TanStack, Turbo added) with correct flag mappings per research
- Extended flag resolver to handle multi-word native flags (Astro's --add tailwindcss) and empty string sentinels (silent/no-op for always-TS scaffolders)
- Extended buildCommandArgs to handle multi-word integration commands (TanStack's @tanstack/cli create)
- 57 new tests: 18 registry tests + 41 flag mapping tests covering every scaffolder+flag combination

## Task Commits

Each task was committed atomically:

1. **Task 1: Add all 7 scaffolder registry entries and register them** - `55caf1c` (feat)
2. **Task 2: Unit tests for all 7 scaffolder registry entries and flag mappings** - `b439ee4` (test)

## Files Created/Modified
- `packages/core/src/registry/scaffolders/web.ts` - All 7 defineScaffolder() entries with flag mappings
- `packages/core/src/registry/index.ts` - Import and register all 7 entries
- `packages/core/src/flags/resolver.ts` - Multi-word native flag splitting, empty string guard
- `packages/core/src/executor/index.ts` - Multi-word integration command splitting
- `packages/cli/src/prompts/options-select.ts` - FRAMEWORK_OPTIONS for Astro, T3, TanStack
- `packages/core/tests/registry/web-scaffolders.test.ts` - 18 registry lookup and field verification tests
- `packages/core/tests/flags/web-flag-mapping.test.ts` - 41 flag resolution and validation tests

## Decisions Made
- Multi-word native flags are split on whitespace in the resolver -- backward-compatible since existing single-word flags have no spaces
- Empty string native field (`native: ''`) is used as a sentinel for "accepted but handled elsewhere" (e.g., Vite's TypeScript via template suffix, Astro's always-TS)
- Multi-word integration commands split the same way in buildCommandArgs -- handles TanStack's `@tanstack/cli create` subcommand pattern
- Shared `nodePrerequisite()` helper extracts the common Node.js prerequisite pattern to reduce duplication across 7 entries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 7 scaffolders are registered and resolvable -- ready for Plan 04-02 (variant selection prompts for Vite/T3)
- Flag resolver and buildCommandArgs handle all edge cases (multi-word, silent, prefix-style)
- FRAMEWORK_OPTIONS extended -- ready for Plan 04-02 to add variant selection
- Test coverage at 254 total tests across the monorepo (was 168 at start of phase)

## Self-Check: PASSED

All 7 created/modified files verified on disk. Both commit hashes (55caf1c, b439ee4) verified in git log.

---
*Phase: 04-web-framework-scaffolders*
*Completed: 2026-02-17*
