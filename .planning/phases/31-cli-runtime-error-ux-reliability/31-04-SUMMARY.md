---
phase: 31-cli-runtime-error-ux-reliability
plan: 04
subsystem: cli
tags: [cli, conformance, vitest, runtime-errors, reliability]

# Dependency graph
requires:
  - phase: 31-cli-runtime-error-ux-reliability
    provides: deterministic runtime error boundary behavior, typo confidence guidance, and help example policy
provides:
  - deterministic 8-scenario runtime error conformance fixture for phase sign-off
  - fixture-driven conformance runner with strict exit/channel/output assertions and report emission
  - stable maintainer command for conformance execution with explicit failure-path verification mode
affects: [32-01, reliability-evidence, ci-gates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixture-first conformance contracts with required and forbidden transcript patterns"
    - "Scenario-level report artifacts for human sign-off plus machine-readable gating"

key-files:
  created:
    - packages/cli/tests/conformance/fixtures/runtime-error-matrix.json
    - packages/cli/tests/conformance/runtime-error-matrix.test.ts
    - packages/cli/tests/conformance/artifacts/.gitkeep
  modified:
    - packages/cli/package.json
    - packages/cli/vitest.config.ts

key-decisions:
  - "Keep conformance deterministic by executing fixture scenarios in a fixed order and validating explicit channel contracts"
  - "Use a dedicated non-error harness scenario to verify unknown runtime fallback behavior in the same matrix"
  - "Expose a single test:conformance script and an env-driven forced mismatch mode to validate non-zero gating"

patterns-established:
  - "Conformance reports always emit to packages/cli/tests/conformance/artifacts/runtime-error-report.json"
  - "Matrix fixture owns scenario definitions so runner logic stays generic"

requirements-completed: [CLI-08]

# Metrics
duration: 6 min
completed: 2026-02-23
---

# Phase 31 Plan 04: CLI Runtime Error UX Reliability Summary

**A deterministic 8-scenario runtime error conformance matrix now enforces exit codes, output channels, and UX transcript contracts with auditable JSON evidence for phase sign-off.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-23T20:18:41Z
- **Completed:** 2026-02-23T20:25:27Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added an explicit fixture contract with exactly eight required scenarios spanning structured errors, typo confidence behavior, help examples, and unknown runtime fallback.
- Implemented a fixture-driven Vitest conformance runner that executes each scenario via process-level CLI invocation, validates required/forbidden output patterns, and hard-fails on drift.
- Added a stable `test:conformance` package script and verified both pass-path and forced mismatch non-zero behavior for CI gating confidence.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define required 8-scenario runtime error matrix fixture** - `f6f4973` (feat)
2. **Task 2: Implement fixture-driven conformance runner with hard-fail evidence output** - `b6fa867` (feat)
3. **Task 3: Expose stable maintainer conformance command and validate full matrix run** - `ef77743` (feat)

## Files Created/Modified
- `packages/cli/tests/conformance/fixtures/runtime-error-matrix.json` - source-of-truth conformance contract with requirement mapping and scenario expectations.
- `packages/cli/tests/conformance/runtime-error-matrix.test.ts` - generic fixture runner, transcript assertions, scenario table output, and report artifact emission.
- `packages/cli/tests/conformance/artifacts/.gitkeep` - keeps artifact directory present for report output in clean clones.
- `packages/cli/vitest.config.ts` - adds conformance test glob so suite is discoverable by package tests.
- `packages/cli/package.json` - adds `test:conformance` maintainer command.

## Decisions Made
- Kept assertion semantics in fixture data (`required`/`forbidden`, literal + `re:` patterns) so future scenario expansion remains data-only.
- Added an explicit `harness-non-error` scenario entry type to cover unknown non-Error fallback contract without introducing app runtime side effects.
- Added `TINKERISE_CONFORMANCE_FORCE_MISMATCH=1` as a deterministic failure-path check for CI/non-zero verification.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Enabled Vitest discovery for conformance tests**
- **Found during:** Task 2 verification
- **Issue:** `bun run --filter @tinkerise/cli test -- ...` could not discover conformance tests because `tests/conformance/**/*.test.ts` was not in `vitest.config.ts` include globs.
- **Fix:** Added conformance include pattern to CLI Vitest config.
- **Files modified:** `packages/cli/vitest.config.ts`
- **Verification:** `bun run --filter @tinkerise/cli test -- tests/conformance/runtime-error-matrix.test.ts`
- **Committed in:** `b6fa867`

**2. [Rule 1 - Bug] Prevented harness artifact leakage on failure-path verification**
- **Found during:** Task 3 forced-mismatch validation
- **Issue:** Failure-mode assertions could leave the temporary harness file in artifacts.
- **Fix:** Moved harness cleanup to run before assertions so cleanup still occurs when the suite fails intentionally.
- **Files modified:** `packages/cli/tests/conformance/runtime-error-matrix.test.ts`
- **Verification:** Re-ran both passing and forced-failure conformance commands; only report artifact remains.
- **Committed in:** `ef77743`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Fixes were required for deterministic execution and clean artifact behavior; no scope creep.

## Issues Encountered
- Commitlint rejected one Task 2 commit message for body line length; message body was shortened and commit retried successfully.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLI-08 now has enforceable conformance evidence and a stable maintainer command suitable for CI gate integration in Phase 32.
- Runtime error transcript contracts are now centralized in one fixture, enabling requirement-to-evidence bundling work.

## Self-Check: PASSED
- FOUND: `.planning/phases/31-cli-runtime-error-ux-reliability/31-04-SUMMARY.md`
- FOUND: `packages/cli/tests/conformance/fixtures/runtime-error-matrix.json`
- FOUND: `packages/cli/tests/conformance/runtime-error-matrix.test.ts`
- FOUND: `f6f4973`
- FOUND: `b6fa867`
- FOUND: `ef77743`

---
*Phase: 31-cli-runtime-error-ux-reliability*
*Completed: 2026-02-23*
