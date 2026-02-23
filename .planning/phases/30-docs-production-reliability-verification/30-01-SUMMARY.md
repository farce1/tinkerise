---
phase: 30-docs-production-reliability-verification
plan: 01
subsystem: testing
tags: [docs, playwright, smoke-tests, github-pages, starlight]

requires:
  - phase: 29-deployment-release
    provides: GitHub Pages deployment target and canonical docs URL configuration
provides:
  - Deterministic fixture contract for production route, search, and code rendering checks
  - Playwright browser smoke runner with hard-fail requirement checks and JSON evidence output
  - Docs workspace smoke command wired for local and CI execution
affects: [docs-deploy, release-gates, production-reliability]

tech-stack:
  added: [@playwright/test]
  patterns:
    - Fixture-driven requirement mapping for smoke checks
    - Hard-fail semantics for required search/code checks
    - Structured JSON smoke evidence with failure screenshots

key-files:
  created:
    - apps/docs/scripts/fixtures/docs-smoke-fixtures.json
    - apps/docs/scripts/smoke-production-docs.mjs
  modified:
    - apps/docs/package.json
    - bun.lockb

key-decisions:
  - "Run smoke checks against explicit targets with canonical fallback and CI deploy URL support."
  - "Treat every required route/search/code fixture miss as hard-fail with non-zero exit status."
  - "Emit requirement-tagged JSON evidence plus screenshots for failed checks."

patterns-established:
  - "Production docs smoke checks are fixture-driven instead of hardcoded in script logic."
  - "Smoke scripts must map checks back to requirement IDs for auditable release gating."

requirements-completed: [DOCS-01, DOCS-08, DOCS-09]

duration: 7 min
completed: 2026-02-23
---

# Phase 30 Plan 01: Production Docs Smoke Runner Summary

**Deterministic Playwright smoke coverage now validates production docs availability, interactive search relevance, and Expressive Code rendering with requirement-mapped hard-fail evidence.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-23T19:10:23+01:00
- **Completed:** 2026-02-23T18:16:58Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added a deterministic fixture contract for required production routes, search queries, and code-render checks mapped to DOCS-01/DOCS-08/DOCS-09.
- Implemented a browser-based smoke runner that enforces hard-fail semantics, supports deploy/canonical target inputs, retries route availability, and emits JSON evidence.
- Wired a stable `docs:smoke` workspace command and installed Playwright test tooling for local and CI usage.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define deterministic production smoke fixtures** - `ca09c0a` (feat)
2. **Task 2: Implement browser smoke runner with locked hard-fail semantics** - `b48b6ed` (feat)
3. **Task 3: Wire docs workspace smoke command and dependencies** - `2c4a814` (chore)

Additional deviation fix commit:

- `10cdaff` (fix): corrected canonical URL parsing and route URL joining for base-path deploys.

## Files Created/Modified

- `apps/docs/scripts/fixtures/docs-smoke-fixtures.json` - Requirement-mapped deterministic route/search/code fixtures.
- `apps/docs/scripts/smoke-production-docs.mjs` - Playwright production smoke runner, retries, hard-fail checks, and JSON report output.
- `apps/docs/package.json` - Added `docs:smoke` script and Playwright dev dependency.
- `bun.lockb` - Workspace lockfile update for Playwright dependency resolution.

## Decisions Made

- Verified checks run against explicit `--target` values with canonical URL fallback resolved from docs config when targets are not provided.
- Kept required checks strict: any miss in required routes, search queries, or code-render routes exits non-zero.
- Added an explicit `--inject-required-failure` option to validate hard-fail behavior and CI evidence handling deterministically.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed canonical URL resolution and base-path route joining in smoke runner**
- **Found during:** Task 3 verification while running production smoke checks.
- **Issue:** Dynamic import of `astro.config.mjs` failed due transitive TypeScript import in Starlight, and route URL joining escaped docs base path on GitHub Pages.
- **Fix:** Parse `site`/`base` directly from `apps/docs/astro.config.mjs` text and normalize fixture route joining against the target base URL.
- **Files modified:** `apps/docs/scripts/smoke-production-docs.mjs`
- **Verification:** `bun run --filter @tinkerise/docs docs:smoke -- --target https://farce1.github.io/tinkerise` and injected failure run both behaved as expected.
- **Committed in:** `10cdaff`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was required for correctness on base-path production deploys and did not expand scope.

## Issues Encountered

- Initial canonical URL import strategy was incompatible with runtime module loading; switched to deterministic config parsing to keep the smoke script ESM-safe.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Production docs smoke checks are executable and requirement-mapped for deployment reliability verification.
- Ready for `30-02-PLAN.md`.

---
*Phase: 30-docs-production-reliability-verification*
*Completed: 2026-02-23*

## Self-Check: PASSED

- Found `.planning/phases/30-docs-production-reliability-verification/30-01-SUMMARY.md`
- Found commit `ca09c0a`
- Found commit `b48b6ed`
- Found commit `2c4a814`
- Found commit `10cdaff`
