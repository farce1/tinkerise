---
phase: 20-cli-test-coverage
plan: 01
subsystem: testing
tags: [vitest, update-check, install-method, semver, fetch-mock]

requires:
  - phase: 19-core-test-coverage
    provides: Test patterns and vi.hoisted + vi.mock conventions
provides:
  - Comprehensive test suite for update-check.ts (cache, fetch, semver, opt-out)
  - Test suite for install-method.ts (homebrew, npx, npm-global, unknown detection)
affects: [20-02, cli-test-coverage]

tech-stack:
  added: []
  patterns: [vi.resetModules with dynamic import for per-test module isolation, vi.stubGlobal for fetch mocking, vi.doMock for import.meta.dirname workarounds]

key-files:
  created:
    - packages/cli/tests/utils/update-check.test.ts
    - packages/cli/tests/utils/install-method.test.ts
  modified: []

key-decisions:
  - "Used vi.resetModules + dynamic import for update-check tests to ensure clean module state per test"
  - "Used vi.doMock with reimplemented function for Homebrew/npx dirname tests since import.meta.dirname cannot be directly mocked"
  - "Kept real semver for accurate comparison testing instead of mocking"

patterns-established:
  - "Dynamic import pattern: vi.resetModules() + await import() for modules with top-level state"
  - "vi.doMock with factory reimplementation for testing import.meta.dirname branches"

requirements-completed: [TEST-03, TEST-04]

duration: 3min
completed: 2026-02-19
---

# Plan 20-01: Update-Check and Install-Method Test Suites

**14 update-check tests covering cache/fetch/semver/opt-out and 7 install-method tests covering all 4 detection branches**

## Performance

- **Duration:** 3 min
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- update-check.test.ts with 14 tests: cache read/write, fresh/stale cache, HTTP fetch mock, semver comparison (newer/same/older), opt-out env var, network failure resilience, abort timeout, and printUpdateNudge output
- install-method.test.ts with 7 tests: npx via npm_execpath, Homebrew via Cellar/homebrew dirname, npm-global prefix matching, unknown fallback, execSync error handling

## Task Commits

Each task was committed atomically:

1. **Task 1+2: update-check and install-method tests** - `02618b7` (test)

## Files Created/Modified
- `packages/cli/tests/utils/update-check.test.ts` - 14 tests for checkForUpdate and printUpdateNudge
- `packages/cli/tests/utils/install-method.test.ts` - 7 tests for detectInstallMethod covering all InstallMethod values

## Decisions Made
- Combined both tasks into a single commit since they share the same utility test category and were developed together
- Used vi.doMock with factory reimplementation for Homebrew/npx dirname detection since import.meta.dirname cannot be mocked directly in Vitest

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLI utility tests complete, ready for plan 20-02 (prompt and command tests)

---
*Phase: 20-cli-test-coverage*
*Completed: 2026-02-19*
