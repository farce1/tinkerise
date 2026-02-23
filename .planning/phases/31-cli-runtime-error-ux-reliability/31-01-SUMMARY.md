---
phase: 31-cli-runtime-error-ux-reliability
plan: 01
subsystem: cli
tags: [error-ux, commander, runtime-boundary, reliability, vitest]

# Dependency graph
requires:
  - phase: 24-error-handling-cli-polish
    provides: single parseAsync catch boundary and TinkeriseError hierarchy integration
provides:
  - shared runtime formatter contract for all boundary error branches
  - centralized 3-part failure rendering with stable visible error codes
  - regression coverage for stack suppression and debug-only stack disclosure
affects: [31-02, 31-04, cli-runtime-error-ux]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Error UX contract: headline/cause/next-step with visible code"
    - "Boundary owns stderr failure output for Commander + domain + unknown errors"

key-files:
  created:
    - packages/cli/src/utils/error-ux-contract.ts
    - packages/cli/tests/utils/error-handler.test.ts
  modified:
    - packages/cli/src/index.ts
    - packages/cli/src/utils/error-handler.ts

key-decisions:
  - "Disable Commander default suggestion/error rendering so one boundary contract owns output"
  - "Normalize all user-facing boundary error codes into a stable uppercase display format"

patterns-established:
  - "Single formatter module is the source for 3-part runtime failure rendering"
  - "Stack traces are hidden by default and shown only for --verbose/DEBUG"

requirements-completed: [CLI-01, CLI-04, CLI-05]

# Metrics
duration: 4 min
completed: 2026-02-23
---

# Phase 31 Plan 01: CLI Runtime Error UX Contract Summary

**Locked CLI runtime failure contract shipped with shared 3-part formatting, visible stable error codes, and debug-gated stack disclosure across all boundary branches.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-23T20:03:19Z
- **Completed:** 2026-02-23T20:07:02Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added `error-ux-contract.ts` as the shared typed formatter for headline, cause, and next-step output with stable code rendering.
- Routed Commander, TinkeriseError, validation, and unknown runtime failures through one boundary formatting path with stderr output.
- Disabled Commander built-in suggestion/error rendering in this phase so boundary behavior is deterministic and centralized.
- Added focused regression tests for contract shape, code visibility, and default-vs-debug stack behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the shared 3-part error UX formatter contract** - `b9f7829` (feat)
2. **Task 2: Route boundary branches through the formatter and enforce default-safe output** - `88b1d8c` (feat)
3. **Task 3: Add boundary contract regression tests for output shape and stack policy** - `583af6b` (test)

## Files Created/Modified
- `packages/cli/src/utils/error-ux-contract.ts` - shared typed formatter for boundary error UX contract.
- `packages/cli/src/index.ts` - disables Commander default typo/error output so boundary owns rendering.
- `packages/cli/src/utils/error-handler.ts` - unified boundary adapter for Commander/domain/validation/unknown failures.
- `packages/cli/tests/utils/error-handler.test.ts` - regression tests for contract markers, code visibility, and stack policy.

## Decisions Made
- Kept one top-level runtime boundary and delegated all user-facing failure text to a shared formatter contract.
- Chose explicit stderr rendering in the boundary to keep failure channel behavior deterministic for future conformance matrix gating.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected scoped test filter paths in verification commands**
- **Found during:** Task 2 and Task 3 verification
- **Issue:** `bun --filter @tinkerise/cli test -- packages/cli/...` resolves from package root and matched no tests.
- **Fix:** Re-ran verification with package-relative paths under `tests/...`.
- **Files modified:** None (command-level fix)
- **Verification:** `bun run --filter @tinkerise/cli test -- tests/integration/cli.test.ts` and `tests/utils/error-handler.test.ts` passed.
- **Committed in:** n/a (no file changes)

**2. [Rule 1 - Bug] Made debug-mode detection dynamic at runtime**
- **Found during:** Task 3 test implementation
- **Issue:** Debug detection was computed once at module load, which could stale stack-disclosure behavior.
- **Fix:** Replaced static flag with `isDebugEnabled()` evaluated on each `handleError()` call.
- **Files modified:** `packages/cli/src/utils/error-handler.ts`
- **Verification:** `bun run --filter @tinkerise/cli test -- tests/utils/error-handler.test.ts`
- **Committed in:** `583af6b` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes directly supported reliable execution and contract correctness; no scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Runtime failure contract is now centralized and test-covered, ready for typo suggestion work in `31-02`.
- Boundary contract markers and stack policy are stable inputs for the conformance matrix plan (`31-04`).

## Self-Check: PASSED
- FOUND: `.planning/phases/31-cli-runtime-error-ux-reliability/31-01-SUMMARY.md`
- FOUND: `b9f7829`
- FOUND: `88b1d8c`
- FOUND: `583af6b`

---
*Phase: 31-cli-runtime-error-ux-reliability*
*Completed: 2026-02-23*
