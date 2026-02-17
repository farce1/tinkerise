---
phase: 04-web-framework-scaffolders
plan: 03
subsystem: cli, executor
tags: [list-command, monorepo, variant-wiring, summary-card, per-scaffolder-help, unified-flags]

# Dependency graph
requires:
  - phase: 04-web-framework-scaffolders
    plan: 01
    provides: "7 web scaffolder registry entries with flag mappings"
  - phase: 04-web-framework-scaffolders
    plan: 02
    provides: "selectViteTemplate, resolveViteTemplate, selectT3Components, tinkeriseSummaryCard, getScaffolderMetadata"
provides:
  - "tinkerise list command with minimal/detailed views and prerequisite status"
  - "tinkerise monorepo command routing to turbo scaffolder"
  - "Vite template selection wired into scaffold pipeline with TS merging"
  - "T3 component selection wired with --CI flag injection"
  - "tinkeriseSummaryCard replacing simple one-liner in post-scaffold output"
  - "Per-scaffolder help text showing only unified flags (not native)"
  - "extraArgs field in ExecuteOptions for framework-specific args"
  - "--template CLI option for Vite template bypass"
affects: [04-04, 05-enhancement-scaffolders]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Early argv interception for per-scaffolder --help before Commander processes it"
    - "extraArgs pattern for framework-specific args separate from resolved flags"
    - "CLI layer owns post-scaffold summary (executor only runs tool)"

key-files:
  created:
    - packages/cli/src/commands/list.ts
    - packages/cli/src/commands/help.ts
    - packages/cli/tests/commands/list.test.ts
    - packages/cli/tests/commands/scaffold-wiring.test.ts
    - packages/cli/tests/commands/help.test.ts
  modified:
    - packages/cli/src/index.ts
    - packages/cli/src/commands/scaffold.ts
    - packages/core/src/executor/index.ts
    - packages/cli/tests/commands/scaffold.test.ts
    - packages/cli/tests/integration/cli.test.ts

key-decisions:
  - "Early process.argv interception for per-scaffolder --help (Commander handles --help before action)"
  - "CLI layer owns post-scaffold summary card (executor just runs tool, no summary output)"
  - "extraArgs merged with nativeArgs in executor (same treatment as resolved flags)"

patterns-established:
  - "Argv interception: check process.argv before program.parse() for custom behavior"
  - "Executor extraArgs: framework-specific computed args passed alongside resolved flags"
  - "Summary ownership: CLI layer calls tinkeriseSummaryCard, executor only spawns"

requirements-completed: [WEB-02, WEB-04, WEB-07, CLI-05, FLAG-06]

# Metrics
duration: 7min
completed: 2026-02-17
---

# Phase 04 Plan 03: CLI Wiring & Commands Summary

**tinkerise list/monorepo commands, variant prompt wiring (Vite/T3), summary card integration, and per-scaffolder help showing only unified flags**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-17T13:52:44Z
- **Completed:** 2026-02-17T14:00:07Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- tinkerise list command with minimal (grouped names) and detailed (descriptions, packages, flags) views, plus prerequisite status check
- tinkerise monorepo command that routes directly to the turbo scaffolder
- Vite template selection and T3 component selection wired into the scaffold execution pipeline
- tinkeriseSummaryCard replaces the simple one-liner for enhanced post-scaffold output with framework-aware suggestions
- Per-scaffolder help text (`tinkerise web next --help`) shows only unified flags, hiding native upstream flags
- 19 new tests (6 list, 7 scaffold-wiring, 6 help) bringing CLI test total to 104

## Task Commits

Each task was committed atomically:

1. **Task 1: tinkerise list command and monorepo routing** - `cdbf8a4` (feat)
2. **Task 2: Wire variant prompts and summary card into scaffold flow** - `d01d6a4` (feat)
3. **Task 3: Per-scaffolder help text showing only unified flags** - `3f4fc22` (feat)

## Files Created/Modified
- `packages/cli/src/commands/list.ts` - tinkerise list command with checkPrereqStatus, minimal/detailed views
- `packages/cli/src/commands/help.ts` - buildScaffolderHelpText() for unified-only flag display
- `packages/cli/src/index.ts` - List, monorepo commands, --template option, per-scaffolder help interception
- `packages/cli/src/commands/scaffold.ts` - Variant prompt wiring, extraArgs, summary card integration
- `packages/core/src/executor/index.ts` - extraArgs in ExecuteOptions, merged into command args
- `packages/cli/tests/commands/list.test.ts` - 6 tests for list command views and prereq status
- `packages/cli/tests/commands/scaffold-wiring.test.ts` - 7 tests for Vite/T3 variant wiring
- `packages/cli/tests/commands/help.test.ts` - 6 tests for per-scaffolder help content
- `packages/cli/tests/commands/scaffold.test.ts` - Updated mocks for tinkeriseSummaryCard and extraArgs
- `packages/cli/tests/integration/cli.test.ts` - Updated list command integration test

## Decisions Made
- Early process.argv interception for per-scaffolder --help: Commander processes --help before the action handler fires, so we detect `web <framework> --help` pattern in argv before program.parse() and show custom help text
- CLI layer owns post-scaffold summary: Removed tinkeriseSummary() call from executor, CLI calls tinkeriseSummaryCard() after executeScaffolder() returns -- cleaner separation of concerns
- extraArgs merged with nativeArgs in executor: Framework-specific computed args (Vite --template, T3 --trpc etc.) treated identically to resolver-produced native args

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed plan reference to checkPrerequisite result.satisfied (should be result.ok)**
- **Found during:** Task 1 (list command creation)
- **Issue:** Plan code referenced `result.satisfied` but the actual PrereqResult interface uses `result.ok`
- **Fix:** Used `result.ok` in checkPrereqStatus()
- **Files modified:** packages/cli/src/commands/list.ts
- **Verification:** TypeScript compiles, prereq status displays correctly
- **Committed in:** cdbf8a4 (Task 1 commit)

**2. [Rule 1 - Bug] Updated integration test expecting old "Coming soon" stub**
- **Found during:** Task 1 (list command replaces stub)
- **Issue:** Integration test at cli.test.ts line 54 expected `stdout.toContain('Coming soon')` which was the old stub output
- **Fix:** Updated assertion to expect 'Web' and 'Next.js' (actual list output)
- **Files modified:** packages/cli/tests/integration/cli.test.ts
- **Verification:** All integration tests pass
- **Committed in:** cdbf8a4 (Task 1 commit)

**3. [Rule 1 - Bug] Updated scaffold.test.ts mocks for tinkeriseSummaryCard and variant-select**
- **Found during:** Task 2 (scaffold.ts now imports tinkeriseSummaryCard)
- **Issue:** Existing scaffold.test.ts mocked @tinkerise/core without tinkeriseSummaryCard export; also lacked variant-select mock
- **Fix:** Added mockTinkeriseSummaryCard to hoisted mocks and vi.mock, added variant-select mock, relaxed exact-match assertions to objectContaining
- **Files modified:** packages/cli/tests/commands/scaffold.test.ts
- **Verification:** All 14 existing scaffold tests pass alongside 7 new wiring tests
- **Committed in:** d01d6a4 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bug fixes)
**Impact on plan:** All fixes necessary for correctness of existing test suite with new code. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 web scaffolders are fully wired end-to-end: registry -> flags -> variant prompts -> executor -> summary card
- tinkerise list, monorepo, and per-scaffolder help are functional
- Ready for Plan 04-04 (end-to-end verification and edge cases)
- Test count: 273 total across monorepo (shared: 24, core: 145, cli: 104)

## Self-Check: PASSED

All 5 created files verified on disk. All 3 task commits (cdbf8a4, d01d6a4, 3f4fc22) verified in git log.

---
*Phase: 04-web-framework-scaffolders*
*Completed: 2026-02-17*
