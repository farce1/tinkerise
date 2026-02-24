---
phase: 32-reliability-closure-evidence-ci-enforcement
plan: 02
subsystem: infra
tags: [reliability, github-actions, ci, release, branch-protection]

# Dependency graph
requires:
  - phase: 32-reliability-closure-evidence-ci-enforcement
    provides: closure bundle command and requirement evidence mapping from 32-01
  - phase: 30-docs-production-reliability-verification
    provides: docs smoke runner contract and report artifact format
  - phase: 31-cli-runtime-error-ux-reliability
    provides: CLI conformance gate command and report artifact format
provides:
  - deterministic docs preview smoke runner for local and CI reliability gating
  - stable CI required-check surface via Reliability Gates job
  - release preflight reliability gate that blocks publish path on failure
  - auditable required-check configuration record for ruleset enforcement
affects: [main-protection, release-publish-path, reliability-signoff]

# Tech tracking
tech-stack:
  added: []
  patterns: [fixed-target-preview-smoke, stable-required-check-naming, release-preflight-gating]

key-files:
  created:
    - scripts/reliability/run-docs-smoke-preview.mjs
    - .github/RELIABILITY_REQUIRED_CHECKS.md
    - .planning/phases/32-reliability-closure-evidence-ci-enforcement/32-02-SUMMARY.md
  modified:
    - package.json
    - .github/workflows/ci.yml
    - .github/workflows/release.yml

key-decisions:
  - "Set CI reliability gate job id to reliability-gates with stable displayed name Reliability Gates for branch protection linkage"
  - "Add release-reliability-preflight as a separate release workflow dependency to prevent publish when reliability checks fail"
  - "Record required-check policy details in-repo under .github/RELIABILITY_REQUIRED_CHECKS.md for auditability"

patterns-established:
  - "Reliability gates always run CLI conformance, docs preview smoke, then closure bundle generation in that order"
  - "Reliability evidence artifacts are uploaded with run-id-suffixed names for traceable CI/release audit trails"

requirements-completed: [REL-02]

# Metrics
duration: 6 min
completed: 2026-02-24
---

# Phase 32 Plan 02: Reliability CI/Release Enforcement Summary

**REL-02 is now enforced through stable CI and release reliability gates plus an auditable required-check policy record for main branch protection.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-24T11:38:56+01:00
- **Completed:** 2026-02-24T11:44:54+01:00
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added `reliability:docs-preview-smoke` and a deterministic preview runner that builds docs, starts fixed localhost preview, runs smoke, and guarantees cleanup.
- Added a blocking `reliability-gates` CI job (PR + push) that runs CLI conformance, docs smoke, closure generation, and uploads reliability evidence artifacts.
- Added a blocking `release-reliability-preflight` job and wired `release` to depend on it so publish path cannot continue when reliability checks fail.
- Added `.github/RELIABILITY_REQUIRED_CHECKS.md` to track required-check settings, actor/timestamp fields, and enforcement expectations.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add deterministic local-preview docs smoke runner for gating workflows** - `261a06e` (feat)
2. **Task 2: Wire stable reliability gate jobs into CI and release workflows** - `15d40d3` (feat)
3. **Task 3: Configure GitHub required-check enforcement for reliability gate** - `907d0e2` (docs)

**Plan metadata:** Pending final docs commit

## Files Created/Modified
- `scripts/reliability/run-docs-smoke-preview.mjs` - deterministic docs preview smoke gate runner with strict-port and cleanup behavior.
- `package.json` - adds `reliability:docs-preview-smoke` root command.
- `.github/workflows/ci.yml` - adds `reliability-gates` required-check job and run-id evidence uploads.
- `.github/workflows/release.yml` - adds `release-reliability-preflight` and gates `release` job via `needs`.
- `.github/RELIABILITY_REQUIRED_CHECKS.md` - in-repo required-check policy record for `main`.

## Decisions Made
- Kept CI job naming stable (`reliability-gates` / `Reliability Gates`) to preserve required-check linkage reliability.
- Mirrored reliability command sequence in both CI and release preflight to avoid policy drift between merge and publish paths.
- Stored required-check policy metadata in-repo so REL-02 enforcement remains auditable over time.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected docs preview smoke target path for Astro base URL**
- **Found during:** Task 1 verification
- **Issue:** Smoke initially targeted root host without `/tinkerise` base path, producing false 404 failures.
- **Fix:** Defaulted smoke target to `http://127.0.0.1:4321/tinkerise` and waited on the same target path.
- **Files modified:** `scripts/reliability/run-docs-smoke-preview.mjs`
- **Verification:** `bun run reliability:docs-preview-smoke`
- **Committed in:** `261a06e`

**2. [Rule 1 - Bug] Enforced deterministic preview port behavior**
- **Found during:** Task 1 verification
- **Issue:** Preview could auto-shift to another port when 4321 was occupied, breaking deterministic target assumptions.
- **Fix:** Added preflight free-port assertion and `--strictPort` to fail fast instead of silently switching ports.
- **Files modified:** `scripts/reliability/run-docs-smoke-preview.mjs`
- **Verification:** `bun run reliability:docs-preview-smoke`
- **Committed in:** `261a06e`

**3. [Rule 3 - Blocking] Replaced unavailable workflow verifier command with YAML parse validation**
- **Found during:** Task 2 verification
- **Issue:** `gsd-tools verify workflow` subcommand is unavailable in this repository tooling.
- **Fix:** Validated `.github/workflows/ci.yml` and `.github/workflows/release.yml` using Ruby `YAML.safe_load` syntax checks.
- **Files modified:** none
- **Verification:** `ruby -e "require 'yaml'; YAML.safe_load(File.read('.github/workflows/ci.yml'), aliases: true); YAML.safe_load(File.read('.github/workflows/release.yml'), aliases: true); puts 'workflow yaml ok'"`
- **Committed in:** `15d40d3`

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking)
**Impact on plan:** All deviations were required for deterministic reliability gating and executable verification in this repo.

## Issues Encountered
- Commitlint rejected the initial Task 2 commit body length; commit message was shortened and retried successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CI and release now both enforce REL-02 reliability gates before merge/publish progression.
- Required-check policy is documented in-repo and tied to stable check naming for ongoing enforcement.

---
*Phase: 32-reliability-closure-evidence-ci-enforcement*
*Completed: 2026-02-24*

## Self-Check: PASSED

- FOUND: `.planning/phases/32-reliability-closure-evidence-ci-enforcement/32-02-SUMMARY.md`
- FOUND: `scripts/reliability/run-docs-smoke-preview.mjs`
- FOUND: `.github/RELIABILITY_REQUIRED_CHECKS.md`
- FOUND: `261a06e`
- FOUND: `15d40d3`
- FOUND: `907d0e2`
