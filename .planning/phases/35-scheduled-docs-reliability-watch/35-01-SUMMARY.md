---
phase: 35-scheduled-docs-reliability-watch
plan: 01
subsystem: infra
tags: [github-actions, ci, docs, smoke, reliability, scheduled]

# Dependency graph
requires:
  - phase: 30-docs-production-reliability-verification
    provides: docs-deploy.yml smoke job (canonical structure mirrored verbatim)
  - phase: 32-reliability-closure-evidence-ci-enforcement
    provides: required-check semantics for smoke runner (--inject-required-failure path)
provides:
  - Scheduled (Thu 09:00 UTC) + manual-dispatch docs reliability watch workflow skeleton
  - Canonical-only smoke invocation (no DEPLOY_URL dependency)
  - Boolean force_failure dispatch input that drives --inject-required-failure (Dim 3/5 lever, no fixture churn)
  - Hard-coded canonical URL fallback (vars.DOCS_CANONICAL_URL || https://farce1.github.io/tinkerise/) — unset-variable safety net (D-02)
  - Two artifact uploads (report always; failure-evidence on failure) ready to be referenced by plan 02's issue body renderer
  - Ref-agnostic queue-not-cancel concurrency group (eliminates the dedupe race that plan 02's multi-issue auto-close is the secondary safety net for)
affects:
  - 35-02 (issue lifecycle layered onto same scheduled-smoke job)
  - REL-04 (sole requirement — partial coverage at this plan; full coverage after plan 02)

# Tech tracking
tech-stack:
  added:
    - GitHub Actions workflow .github/workflows/docs-reliability-watch.yml (third workflow under .github/workflows/, additive to docs-deploy.yml + upstream-drift.yml)
  patterns:
    - "Canonical-only smoke invocation: bun run --filter @tinkerise/docs docs:smoke -- --canonical-only (skips DEPLOY_URL resolution for non-deploying workflows)"
    - "Conditional CLI flag via inputs ternary: ${{ inputs.X && '--flag' || '' }} appended to the command line"
    - "Repo-variable fallback: ${{ vars.X || 'hard-coded-default' }} — short-circuits on unset/empty"
    - "Ref-agnostic concurrency group with cancel-in-progress: false (queue-not-cancel) for repo-global single-instance workflows"

key-files:
  created:
    - .github/workflows/docs-reliability-watch.yml
  modified: []

key-decisions:
  - "Implemented D-01 (canonical-only smoke target — no fresh build, no DEPLOY_URL)"
  - "Implemented D-02 (canonical URL fallback to https://farce1.github.io/tinkerise/ when vars.DOCS_CANONICAL_URL unset, derived from astro.config.mjs site+base)"
  - "Implemented D-03 (failure-before-smoke = job failure; no special-casing — bun install / Playwright install failures naturally trip if: failure() artifact upload)"
  - "Implemented D-08 (Thursday 09:00 UTC cron — staggered 3 days from upstream-drift.yml's Monday cron to spread reliability-watch coverage across the week)"
  - "Implemented D-09 (workflow_dispatch with boolean force_failure input — single dispatch lever bakes in the answer to RESEARCH Open Q1 and unblocks Dim 3/5 revalidation without temp fixture changes)"
  - "Used ref-agnostic concurrency group docs-reliability-watch with cancel-in-progress: false — eliminates dedupe race that plan 02's multi-issue auto-close (D-04) is defensive about"

patterns-established:
  - "Pattern: Canonical-only smoke for non-deploying workflows — avoids DEPLOY_URL coupling and re-uses existing smoke runner via --canonical-only flag"
  - "Pattern: Boolean dispatch input as Dim 3/5 validation lever — single boolean drives an in-script failure injection deterministically (no temp commits, no fixture churn)"
  - "Pattern: Hard-coded canonical fallback derived from astro.config.mjs (site + base) — single source of truth even when repo variable is accidentally unset"
  - "Pattern: Ref-agnostic queue-not-cancel concurrency for repo-global workflows where ref-scoping makes no sense (issue lifecycle is repo-global)"

requirements-completed: [REL-04]

# Metrics
duration: 4 min
completed: 2026-05-14
---

# Phase 35 Plan 01: Docs Reliability Watch Workflow Skeleton Summary

**Additive scheduled GitHub Actions workflow that runs `docs:smoke --canonical-only` weekly (Thu 09:00 UTC) against production, with a `force_failure` dispatch input wired to `--inject-required-failure` for Dim 3/5 validation; issue lifecycle layered in plan 02.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-14T10:38:04Z
- **Completed:** 2026-05-14T10:42:12Z
- **Tasks:** 2
- **Files modified:** 1 (created)

## Accomplishments

- Created `.github/workflows/docs-reliability-watch.yml` (93 lines, 7-step single job `scheduled-smoke`)
- Triggers wired: `schedule: '0 9 * * 4'` (Thu 09:00 UTC, per D-08) + `workflow_dispatch` with boolean `force_failure` input (per D-09 + RESEARCH Open Q1)
- Permissions exact: `contents: read` + `issues: write` (no `pages:`, no `write-all`) — T-35-01 mitigation
- Concurrency: ref-agnostic group `docs-reliability-watch` with `cancel-in-progress: false` (queue-not-cancel) — T-35-03 mitigation + RESEARCH §Pattern 6
- Smoke equivalence with `docs-deploy.yml`: identical Bun setup (1.1.9 pinned), Playwright Chromium install, `set -o pipefail` + `tee` invocation pattern, two artifact uploads with 14-day retention and `if-no-files-found: warn`
- Canonical URL fallback: `vars.DOCS_CANONICAL_URL || 'https://farce1.github.io/tinkerise/'` — D-02 unset-variable safety net derived from `astro.config.mjs:5-6`
- `force_failure` dispatch input wired through `${{ inputs.force_failure && '--inject-required-failure' || '' }}` ternary — empty for cron runs, drives a deterministic required-check failure on demand

## Final YAML Structure

```
jobs.scheduled-smoke:
  steps:
    1. Checkout                                              (actions/checkout@v4)
    2. Setup Bun                                             (oven-sh/setup-bun@v2, bun-version: 1.1.9)
    3. Install dependencies                                  (bun install --frozen-lockfile)
    4. Install Playwright Chromium runtime                   (bunx playwright install --with-deps chromium)
    5. Run docs:smoke against canonical production URL ...   (set -o pipefail; bun run ... --canonical-only ...)
    6. Upload smoke report (always)                          (actions/upload-artifact@v4, if: always())
    7. Upload smoke failure evidence (on failure)            (actions/upload-artifact@v4, if: failure())
```

Total file lines: 93 (above the `must_haves.artifacts.min_lines: 60` floor).

## Validation Dimensions Exercised

| Dim | Property | Status | Evidence |
|-----|----------|--------|----------|
| 1   | Trigger fires (cron + dispatch) | STATIC PASS | YAML parse: `on.schedule == [{cron: '0 9 * * 4'}]` and `on.workflow_dispatch.inputs.force_failure` present with `type: boolean`. Dispatch confirmation deferred to post-merge `gh workflow run` per VALIDATION matrix. |
| 2   | Smoke equivalence with docs-deploy.yml | STATIC PASS | `grep -A2 docs:smoke` diff between the two workflows shows ONLY the expected three deltas: `--canonical-only` flag, conditional `--inject-required-failure` tail, and absence of `DEPLOY_URL` env. Bun version, Playwright install command, `set -o pipefail`, `tee` log path, artifact paths, retention, and `if-no-files-found: warn` are byte-for-byte equivalent. |
| 6   | Permissions block exact | STATIC PASS | YAML parse: `permissions == {contents: 'read', issues: 'write'}`. No `pages:`, no `actions:`, no `write-all`. (Full validation that `issues: write` actually succeeds at runtime requires plan 02's `gh issue` calls.) |

Dim 3 (force-failure dispatch end-to-end), Dim 4 (multi-issue auto-close), Dim 5 (issue body rendering), Dim 7 (fork gate) require either plan 02's issue lifecycle steps OR a post-merge dispatch and are NOT exercised in this plan.

## Task Commits

1. **Task 1: Create workflow skeleton with triggers, permissions, concurrency, and dispatch input** — `4a79f83` (feat)
2. **Task 2: Add Bun setup, Playwright install, canonical-only smoke invocation, and two artifact uploads** — `0078513` (feat)

**Plan metadata:** _committed alongside this SUMMARY (final commit hash recorded in commit log)_

## Files Created/Modified

- `.github/workflows/docs-reliability-watch.yml` — new third workflow under `.github/workflows/`. Single `scheduled-smoke` job, 7 steps, 93 lines. Header (triggers, permissions, concurrency) + body (Bun setup, Playwright install, canonical-only smoke, two artifact uploads). Issue-lifecycle steps reserved for plan 02.

## Decisions Made

All decisions in this plan were CONTEXT-prescribed (D-01, D-02, D-03, D-08, D-09 implemented; D-04, D-05, D-06, D-07, D-10, D-11 explicitly deferred to plan 02 per the plan's `<success_criteria>` block). One Open Question from RESEARCH (Q1: how to drive Dim 3/5 revalidation) was resolved by the planner by baking in `workflow_dispatch.inputs.force_failure` as the validation lever — the executor implemented this verbatim with no further decisions needed.

## Deviations from Plan

None - plan executed exactly as written.

The two tasks were executed using the prescribed tools (Write for task 1 to create the file; Edit for task 2 to append steps without disturbing the task-1 header). All 11 task-1 acceptance criteria and all 15 task-2 acceptance criteria pass via the plan-prescribed `grep` commands. The plan-level `<verify><automated>` blocks for both tasks pass. The plan-level `<verification>` static checks (YAML parse, Dim 1 cron, Dim 2 smoke equivalence diff, Dim 6 exact permissions) all PASS via `bun --eval` + `js-yaml` (yq not available in the worktree environment, equivalent parser used).

## Authentication Gates

None — no external authentication required for this plan (the workflow file is static YAML; runtime auth via `${{ github.token }}` is added in plan 02's issue-lifecycle steps).

## Issues Encountered

**Worktree path resolution quirk (resolved transparently):** Initial Write tool call landed the file at the canonical (main repo) path rather than the worktree path; macOS case-insensitive filesystem made this invisible to short relative-path checks. Resolved by using the explicit worktree-prefixed absolute path (`/Users/impera/Documents/GitHub/tinkerise/.claude/worktrees/agent-a010c8894fe510f04/...`) for the rewrite. The misplaced file in the main repo was deleted before the worktree write. No commits ever staged the misplaced copy. Net effect on plan output: zero — the file is correctly committed to the worktree branch.

## User Setup Required

None - the workflow uses `${{ vars.DOCS_CANONICAL_URL }}` if present and falls back to the hard-coded canonical URL when unset. No new secrets, no new repo variables required.

The maintainer-only manual verifications in `35-VALIDATION.md` (cron timing observation after merge, optional fork dispatch) are runtime observations after merge, not user setup.

## Next Phase Readiness

- **Plan 35-02 unblocked.** The single-job topology is in place; plan 02 will extend the SAME `scheduled-smoke` job with: (a) dynamic label create (`gh label create docs-reliability ... 2>/dev/null || true`), (b) `id: body` step that runs the four-branch report-state renderer (RESEARCH §Pattern 3) on `if: failure() && github.repository == 'farce1/tinkerise'`, (c) `gh issue list` dedupe + `gh issue comment`/`gh issue create` branch on failure, (d) multi-issue auto-close with atomic `gh issue close --comment ... --reason completed` on success. All steps must inherit the existing `concurrency:` block and the `if: github.repository == 'farce1/tinkerise'` fork gate (D-07).
- **REL-04 partially satisfied.** Trigger surface and smoke invocation are live; issue-creation/auto-close behavior — the requirement's distinguishing capability — lands in plan 02. After plan 02 merges, REL-04 is fully satisfied.
- **No blockers.** No deferred items, no architectural questions, no auth gates outstanding.

## Self-Check: PASSED

- [x] `.github/workflows/docs-reliability-watch.yml` exists on disk (93 lines, 7-step `scheduled-smoke` job — verified via `wc -l` + `bun --eval` YAML parse)
- [x] Both task commits present in `git log` (`4a79f83` for task 1, `0078513` for task 2 — verified via `git log --oneline --all | grep`)
- [x] All 11 task-1 acceptance criteria PASS via plan-prescribed grep commands
- [x] All 15 task-2 acceptance criteria PASS via plan-prescribed grep commands
- [x] Both `<verify><automated>` plan blocks return success
- [x] Plan-level `<verification>` checks (YAML parse, cron presence, smoke equivalence diff, permissions exactness) all PASS

---
*Phase: 35-scheduled-docs-reliability-watch*
*Completed: 2026-05-14*
