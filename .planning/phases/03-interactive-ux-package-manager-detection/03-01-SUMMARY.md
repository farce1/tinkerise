---
phase: 03-interactive-ux-package-manager-detection
plan: 01
subsystem: pm-detection
tags: [package-manager, lockfile, ci-info, which, detection]

# Dependency graph
requires:
  - phase: 02-scaffolder-registry-execution
    provides: "which dependency already installed in @tinkerise/core"
provides:
  - "detectPackageManager() with flag > lockfile > packageManager > default precedence"
  - "verifyPmBinary() binary existence check via which"
  - "detectFromLockfile() and detectFromPackageJson() individual detectors"
  - "isCI boolean and ciName string from ci-info"
  - "PackageManager type and DetectResult interface"
affects: [03-02-interactive-prompt-flow, 03-03-non-interactive-mode]

# Tech tracking
tech-stack:
  added: [ci-info@4.4.0]
  patterns: [createRequire-for-cjs-in-esm, lockfile-precedence-ordering, binary-missing-source-pattern]

key-files:
  created:
    - packages/core/src/pm/detect.ts
    - packages/core/src/pm/verify.ts
    - packages/core/src/pm/index.ts
    - packages/core/src/ci/index.ts
    - packages/core/tests/pm/detect.test.ts
    - packages/core/tests/pm/verify.test.ts
    - packages/core/tests/ci/ci.test.ts
  modified:
    - packages/core/src/index.ts
    - packages/core/package.json

key-decisions:
  - "createRequire for ci-info import -- CJS package in ESM project, avoids interop edge cases"
  - "LOCKFILE_MAP as ordered tuple array (not Record) -- preserves precedence iteration order"
  - "binary-missing source does NOT fall through to next detection -- preserves detected PM for caller warning"

patterns-established:
  - "Lockfile precedence: pnpm > bun > yarn > npm (less common PMs first)"
  - "Binary-missing pattern: return detected PM name with source: binary-missing so caller can warn specifically"
  - "createRequire pattern for CJS dependencies in ESM modules"

requirements-completed: [PM-01, PM-02, PM-03, PM-04, UX-05]

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 3 Plan 01: PM Detection & CI Detection Summary

**PM detection pipeline with flag>lockfile>packageManager>default precedence, binary verification via which, and CI detection wrapping ci-info**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T11:20:15Z
- **Completed:** 2026-02-17T11:24:07Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- PM detection module with full antfu/ni-style precedence chain (flag > lockfile > packageManager field > default)
- Binary-missing detection pattern: when a PM is detected but not installed, returns specific source so caller can warn and prompt
- CI environment detection via ci-info with createRequire for CJS-in-ESM compatibility
- 31 new tests covering lockfile detection, packageManager field parsing, flag override, binary verification, and CI smoke tests

## Task Commits

Each task was committed atomically:

1. **Task 1: PM detection module and CI detection** - `2ac24dc` (feat)
2. **Task 2: TDD tests for PM detection and CI detection** - `16e1d03` (test)

## Files Created/Modified
- `packages/core/src/pm/detect.ts` - Lockfile detection, packageManager field parsing, full detection pipeline with precedence chain
- `packages/core/src/pm/verify.ts` - Binary existence verification via which
- `packages/core/src/pm/index.ts` - Public API re-exports and types
- `packages/core/src/ci/index.ts` - CI environment detection wrapping ci-info via createRequire
- `packages/core/src/index.ts` - Added PM detection and CI detection exports to public API
- `packages/core/package.json` - Added ci-info@^4.4.0 dependency
- `packages/core/tests/pm/detect.test.ts` - 24 tests for lockfile, packageManager, and full pipeline
- `packages/core/tests/pm/verify.test.ts` - 3 tests for binary verification
- `packages/core/tests/ci/ci.test.ts` - 4 smoke tests for CI detection

## Decisions Made
- Used createRequire for ci-info import (CJS package in ESM project) instead of default import to avoid interop edge cases
- Used ordered tuple array for LOCKFILE_MAP instead of Record to guarantee iteration order for precedence
- binary-missing source does NOT fall through to next detection step -- preserves detected PM name so the caller can warn "pnpm detected but not installed" before prompting

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict array indexing error**
- **Found during:** Task 1 (PM detection module)
- **Issue:** `split('@')[0]` returns `string | undefined` under strict TypeScript noUncheckedIndexedAccess, causing DTS build failure
- **Fix:** Added nullish coalescing: `parts[0] ?? ''`
- **Files modified:** packages/core/src/pm/detect.ts
- **Verification:** Build succeeds with DTS generation
- **Committed in:** 2ac24dc (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed pre-commit hook using wrong test runner**
- **Found during:** Task 1 (commit attempt)
- **Issue:** `.husky/pre-commit` ran `bun test` (bun's native runner) instead of `bun run test` (vitest via turbo). Pre-existing issue causing test failures on commit.
- **Fix:** Changed `bun test` to `bun run test` in `.husky/pre-commit`
- **Files modified:** .husky/pre-commit
- **Verification:** Pre-commit hook passes, all vitest tests run successfully
- **Committed in:** 2ac24dc (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness and ability to commit. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PM detection pipeline ready for consumption by Plan 03-02 (interactive prompt flow)
- `detectPackageManager()` returns `DetectResult` with `source: 'binary-missing'` for Plan 03-02's prompt fallback logic
- `isCI` boolean ready for Plan 03-03 (non-interactive mode detection)
- All 76 core tests pass, build clean

## Self-Check: PASSED

All 7 created files verified present. Both task commits (2ac24dc, 16e1d03) verified in git log.

---
*Phase: 03-interactive-ux-package-manager-detection*
*Completed: 2026-02-17*
