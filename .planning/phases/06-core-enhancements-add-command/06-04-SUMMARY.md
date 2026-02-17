---
phase: 06-core-enhancements-add-command
plan: 04
subsystem: cli
tags: [add-command, enhancement-picker, tk-alias, commander]

requires:
  - phase: 06-core-enhancements-add-command
    provides: All 4 enhancement modules, registry barrel, per-enhancement summary
provides:
  - `tinkerise add` command with interactive picker and direct mode
  - `tk` short alias via basename detection
  - Extended ExecutionSummary with per-module InstallResult map
  - Per-enhancement summary card display in add command
affects: [07, 08]

tech-stack:
  added: []
  patterns: [basename detection for CLI alias, variadic Commander argument, per-result Map on ExecutionSummary]

key-files:
  created:
    - packages/cli/src/commands/add.ts
    - packages/cli/src/prompts/enhancement-select.ts
    - packages/cli/tests/commands/add.test.ts
  modified:
    - packages/cli/src/index.ts
    - packages/core/src/enhancements/executor.ts
    - packages/core/tests/enhancements/executor.test.ts

key-decisions:
  - "basename(process.argv[1]) for tk alias detection (works with npm bin paths)"
  - "Commander variadic argument [enhancements...] for multi-enhancement support"
  - "ExecutionSummary.results as Map<string, InstallResult> for per-module detail"
  - "CI mode: process.exit(1) when no enhancement args (no interactive picker)"

patterns-established:
  - "CLI alias detection: basename of argv[1] compared against known aliases"
  - "Dynamic program name in Commander + help text"

requirements-completed: [ADD-01, ADD-02, ADD-03, ADD-04, CLI-02]

duration: 4min
completed: 2026-02-17
---

# Plan 06-04: Add Command, Picker & tk Alias Summary

**tinkerise add command with interactive multi-select picker, per-enhancement summary cards, and tk short alias via basename detection**

## Performance

- **Duration:** 4 min
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- `tinkerise add` with no args launches interactive multi-select picker
- `tinkerise add eslint prettier` runs both directly without prompts
- `tk` alias detected via basename(process.argv[1])
- Per-enhancement summary cards show files, packages, next steps
- ExecutionSummary extended with per-module InstallResult Map
- 7 unit tests pass for add command
- 1 new executor test for results map population

## Task Commits

1. **Task 1+2+3: Add command, tk alias, and tests** - `7daf451` (feat)

## Files Created/Modified
- `packages/cli/src/commands/add.ts` - Add command implementation
- `packages/cli/src/prompts/enhancement-select.ts` - Multi-select picker
- `packages/cli/src/index.ts` - Add command registration, tk alias, help text
- `packages/core/src/enhancements/executor.ts` - Extended ExecutionSummary with results Map
- `packages/core/tests/enhancements/executor.test.ts` - New results map test
- `packages/cli/tests/commands/add.test.ts` - 7 unit tests

## Decisions Made
- Commander variadic argument collects all remaining args into array
- Dynamic help text examples use programName variable

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None

## Next Phase Readiness
- Phase 6 fully complete: all 4 enhancement modules + add command + tk alias
- Ready for phase verification

---
*Phase: 06-core-enhancements-add-command*
*Completed: 2026-02-17*
