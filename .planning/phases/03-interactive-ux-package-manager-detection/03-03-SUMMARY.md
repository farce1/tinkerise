---
phase: 03-interactive-ux-package-manager-detection
plan: 03
subsystem: cli-interactive
tags: [commander, non-interactive, ci-guard, hybrid-mode, flag-bypass]

# Dependency graph
requires:
  - phase: 03-interactive-ux-package-manager-detection
    plan: 01
    provides: "isCI, ciName from ci-info for CI detection"
  - phase: 03-interactive-ux-package-manager-detection
    plan: 02
    provides: "runPromptFlow, scaffold handlers, prompt modules"
provides:
  - "isOptionProvided() — detect user-provided flags via getOptionValueSource()"
  - "isFullyNonInteractive() — check if all positional args provided"
  - "buildPreselectedOptions() — extract preselected options from CLI flags"
  - "mergePromptAndFlags() — combine prompt answers with --no-git/--no-install flags"
  - "ensureNonInteractive() — CI guard that exits with descriptive error"
  - "Commander Command instance threading through all scaffold handlers"
  - "allOptionsResolved flow skip in runPromptFlow"
affects: [phase-04-error-handling]

# Tech tracking
tech-stack:
  added: []
  patterns: [commander-getOptionValueSource, ci-guard-pattern, hybrid-flag-bypass]

key-files:
  created:
    - packages/cli/src/utils/interactive.ts
    - packages/cli/tests/utils/interactive.test.ts
    - packages/cli/tests/commands/scaffold.test.ts
  modified:
    - packages/cli/src/commands/scaffold.ts
    - packages/cli/src/index.ts
    - packages/cli/src/prompts/flow.ts
    - packages/cli/vitest.config.ts

key-decisions:
  - "Commander Command passed as parameter (not this) for getOptionValueSource access"
  - "ensureNonInteractive uses process.stderr.write for error output, not console.error"
  - "buildPreselectedOptions deduplicates --ts and --typescript aliases"

patterns-established:
  - "Commander.js getOptionValueSource('cli') to detect explicit flags"
  - "CI guard early-exit pattern for non-interactive environments"
  - "vi.hoisted() with getter-based mock objects for mutable test state"

requirements-completed: [UX-04, UX-05]

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 3 Plan 03: Non-Interactive Mode & CI Guard Summary

**Flag bypass system with Commander.js getOptionValueSource(), CI guard with descriptive error output, hybrid mode preselection, and 40 new tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T11:36:41Z
- **Completed:** 2026-02-17T11:41:02Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Complete flag bypass system detecting user-provided CLI flags via Commander.js getOptionValueSource()
- CI guard exits with code 1 and descriptive error listing missing arguments when running in CI
- Hybrid mode: buildPreselectedOptions extracts --typescript/--tailwind/--eslint flags for multiselect pre-fill
- Commander Command instance properly threaded from index.ts action handler through all scaffold entry modes
- 40 new tests (26 interactive utils + 14 scaffold command integration)

## Task Commits

Each task was committed atomically:

1. **Task 1: Interactive mode utilities and CI guard** - `bf03b34` (feat)
2. **Task 2: Tests for interactive mode and CI guard** - `2b99f6d` (test)

## Files Created/Modified
- `packages/cli/src/utils/interactive.ts` - Flag detection, preselection, merge, and CI guard utilities
- `packages/cli/src/commands/scaffold.ts` - Updated with Command threading, CI guard, and hybrid mode
- `packages/cli/src/index.ts` - Passes Commander Command instance to scaffold handlers
- `packages/cli/src/prompts/flow.ts` - Added allOptionsResolved skip logic and FRAMEWORK_OPTIONS import
- `packages/cli/vitest.config.ts` - Added tests/utils and tests/commands include paths
- `packages/cli/tests/utils/interactive.test.ts` - 26 tests for all interactive utilities
- `packages/cli/tests/commands/scaffold.test.ts` - 14 integration tests for scaffold command

## Decisions Made
- Commander Command passed as explicit parameter to handlers (not `this`) since arrow functions in `.action()` don't bind `this` to the Command instance
- ensureNonInteractive uses `process.stderr.write` with `pc.red()` for error output to ensure it goes to stderr
- buildPreselectedOptions deduplicates when both `--ts` and `--typescript` are provided (Set-based dedup)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 complete: all 3 plans (PM detection, interactive prompts, non-interactive mode) delivered
- 168 total tests across monorepo (24 shared + 76 core + 68 cli)
- All interactive options have CLI flag equivalents
- CI environments detected and handled gracefully with descriptive errors
- Hybrid mode pre-selects options from flags while prompting for missing values
- Ready for Phase 4 (error handling and UX polish)

## Self-Check: PASSED

All 3 created files verified present. Both task commits (bf03b34, 2b99f6d) verified in git log.

---
*Phase: 03-interactive-ux-package-manager-detection*
*Completed: 2026-02-17*
