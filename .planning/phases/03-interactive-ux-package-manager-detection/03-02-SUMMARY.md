---
phase: 03-interactive-ux-package-manager-detection
plan: 02
subsystem: cli-prompts
tags: [clack-prompts, commander, interactive-flow, multiselect, cancel-handling]

# Dependency graph
requires:
  - phase: 02-scaffolder-registry-execution
    provides: "executeScaffolder pipeline, registry functions, flag resolver"
  - phase: 03-interactive-ux-package-manager-detection
    plan: 01
    provides: "detectPackageManager with binary-missing source, PackageManager type"
provides:
  - "runInteractiveFlow() full guided prompt experience"
  - "runCategoryFlow() category-filtered framework selection"
  - "runDirectExecution() minimal-prompt direct scaffolding"
  - "selectFramework() grouped-by-category select with disabled headers"
  - "selectFrameworkOptions() multiselect for framework-specific options"
  - "promptProjectName() text input with validation"
  - "promptPackageManager() fallback PM selection prompt"
  - "showBanner() intro branding via p.intro()"
  - "runPromptFlow() p.group() orchestration with centralized cancel"
  - "Commander.js routing with [category] [framework] [name] positional args"
affects: [03-03-non-interactive-mode, phase-04-error-handling]

# Tech tracking
tech-stack:
  added: ["@clack/prompts@^1.0.1"]
  patterns: [p-group-flow-orchestration, disabled-options-category-headers, vi-hoisted-mock-pattern, silent-ctrl-c-exit]

key-files:
  created:
    - packages/cli/src/prompts/framework-select.ts
    - packages/cli/src/prompts/options-select.ts
    - packages/cli/src/prompts/project-name.ts
    - packages/cli/src/prompts/pm-select.ts
    - packages/cli/src/prompts/flow.ts
    - packages/cli/src/commands/scaffold.ts
    - packages/cli/src/utils/banner.ts
    - packages/cli/tests/prompts/framework-select.test.ts
    - packages/cli/tests/prompts/options-select.test.ts
  modified:
    - packages/cli/src/index.ts
    - packages/cli/package.json
    - packages/cli/vitest.config.ts

key-decisions:
  - "Separate --ts and --typescript options with manual merge (Commander.js comma-separated alias not suitable)"
  - "validateProjectName accepts string|undefined to match @clack/prompts text() validate signature"
  - "No spinner around executeScaffolder — upstream tool owns stdio with inherit"
  - "vi.hoisted() pattern for mock functions referenced in vi.mock() factories"

patterns-established:
  - "p.group() for multi-step prompt flows with centralized onCancel"
  - "Disabled options as category headers in p.select() for grouped lists"
  - "Silent Ctrl+C exit via process.exit(0) on isCancel"
  - "vi.hoisted() for mock declarations used inside vi.mock() factories in vitest"
  - "Shared executePipeline helper for DRY scaffold execution across entry modes"

requirements-completed: [CLI-01, UX-01, UX-02, UX-03]

# Metrics
duration: 7min
completed: 2026-02-17
---

# Phase 3 Plan 02: Interactive Prompt Flow Summary

**@clack/prompts interactive flow with Commander.js 3-mode routing, grouped framework select, options multiselect, PM detection fallback, and 18 unit tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-17T11:26:55Z
- **Completed:** 2026-02-17T11:33:51Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Complete interactive prompt flow from CLI entry to scaffolder execution via @clack/prompts
- Commander.js routing handles 3 entry modes: full interactive, category-scoped, and direct execution with positional args
- Framework select shows grouped-by-category list with disabled category headers and emoji labels
- PM detection integrated with binary-missing warning and fallback prompt
- 18 new unit tests covering framework-select and options-select prompt modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @clack/prompts, create prompt modules and banner** - `2efab10` (feat)
2. **Task 2: Commander.js routing, flow orchestration, and scaffold command** - `65eaf74` (feat)
3. **Task 3: Unit tests for prompt modules** - `c144033` (test)

## Files Created/Modified
- `packages/cli/src/prompts/framework-select.ts` - Grouped framework select with disabled category headers
- `packages/cli/src/prompts/options-select.ts` - Framework-specific multiselect with FRAMEWORK_OPTIONS registry
- `packages/cli/src/prompts/project-name.ts` - Project name text input with validation
- `packages/cli/src/prompts/pm-select.ts` - PM selection fallback prompt
- `packages/cli/src/prompts/flow.ts` - p.group() flow orchestration with centralized cancel
- `packages/cli/src/commands/scaffold.ts` - Three entry mode handlers with shared executePipeline helper
- `packages/cli/src/utils/banner.ts` - Intro banner with tinkerise branding
- `packages/cli/src/index.ts` - Rewritten with Commander.js routing and global options
- `packages/cli/package.json` - Added @clack/prompts dependency
- `packages/cli/vitest.config.ts` - Added tests/prompts/ include path
- `packages/cli/tests/prompts/framework-select.test.ts` - 8 tests for grouped select
- `packages/cli/tests/prompts/options-select.test.ts` - 10 tests for multiselect

## Decisions Made
- Used separate `--ts` and `--typescript` options with manual merge in action handler, because Commander.js comma-separated aliases (`--typescript, --ts`) don't work as expected for boolean options
- `validateProjectName` accepts `string | undefined` to match @clack/prompts v1.0.1 text() validate callback signature
- No spinner around executeScaffolder call -- the upstream tool uses `stdio: 'inherit'` and has its own framing output
- Used `vi.hoisted()` for mock function declarations that need to be referenced inside `vi.mock()` factory functions (vitest hoisting requirement)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed validateProjectName parameter type**
- **Found during:** Task 1 (project-name.ts creation)
- **Issue:** @clack/prompts text() validate callback receives `string | undefined`, not `string`. TypeScript error TS2322 on typecheck.
- **Fix:** Changed parameter type from `string` to `string | undefined`
- **Files modified:** packages/cli/src/prompts/project-name.ts
- **Verification:** `bun run typecheck` passes
- **Committed in:** 2efab10 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed framework-select using hint instead of disabled property**
- **Found during:** Task 1 (framework-select.ts creation)
- **Issue:** Category headers used `hint: 'disabled'` instead of `disabled: true` property. Would not actually prevent selection.
- **Fix:** Added `disabled: true` to header options, updated type to include `disabled?: boolean`
- **Files modified:** packages/cli/src/prompts/framework-select.ts
- **Verification:** Typecheck passes, tests verify disabled property
- **Committed in:** 2efab10 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed vi.mock hoisting with vi.hoisted()**
- **Found during:** Task 3 (unit test creation)
- **Issue:** `vi.mock()` factories referenced `const` mock functions declared before the mock, but vitest hoists `vi.mock()` to file top, causing `ReferenceError: Cannot access before initialization`
- **Fix:** Used `vi.hoisted()` to declare mock functions that are available at hoist time
- **Files modified:** packages/cli/tests/prompts/framework-select.test.ts, packages/cli/tests/prompts/options-select.test.ts
- **Verification:** All 18 prompt tests pass
- **Committed in:** c144033 (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All fixes necessary for type correctness and test infrastructure. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Interactive prompt flow fully wired from CLI entry to scaffolder execution
- Plan 03-03 (non-interactive mode) can build on this: detect CI, check if all flags provided, skip prompts
- All 128 tests pass across the monorepo (24 shared + 76 core + 28 cli)
- CLI help shows correct argument structure and all global options
- PM detection fallback prompts user when no lockfile found or binary missing

## Self-Check: PASSED

All 9 created files verified present. All 3 task commits (2efab10, 65eaf74, c144033) verified in git log.

---
*Phase: 03-interactive-ux-package-manager-detection*
*Completed: 2026-02-17*
