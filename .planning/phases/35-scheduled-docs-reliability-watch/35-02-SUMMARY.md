---
phase: 35-scheduled-docs-reliability-watch
plan: 02
subsystem: infra
tags: [github-actions, ci, docs, issue-lifecycle, reliability, gh-cli, jq, scheduled]

# Dependency graph
requires:
  - phase: 35-scheduled-docs-reliability-watch
    provides: scheduled-smoke job skeleton (7 steps from plan 35-01) — checkout, Bun, install, Playwright, smoke, report-upload, evidence-upload
  - phase: 30-docs-production-reliability-verification
    provides: docs-deploy.yml smoke pattern (canonical structure mirrored verbatim by plan 35-01)
  - phase: 32-reliability-closure-evidence-ci-enforcement
    provides: required-check semantics for the smoke runner (--inject-required-failure path)
provides:
  - Four-branch issue-body renderer (failure path) covering all D-11 report states (missing / malformed / zero-failures / structured)
  - Idempotent docs-reliability label create (color B60205, distinct from drift's amber FBCA04)
  - Failure-path dedupe-or-create issue flow (search by label + in:title prefix, client-side startswith filter, comment-or-create branch)
  - Success-path multi-issue auto-close (defensive enumeration via while-read loop, atomic single-call gh issue close --comment ... --reason completed)
  - Forks gate (github.repository == 'farce1/tinkerise') on every issue-writing step (3 occurrences total in the file)
  - GH_TOKEN env wiring on every gh-CLI step (2 occurrences)
  - Complete REL-04 delivery: scheduled unfiltered smoke + Issue on failure + auto-close on green
affects:
  - REL-04 (now fully closed — partial coverage from plan 01 + lifecycle layered here)
  - Future docs-reliability operations work (this is the canonical analog to mirror, alongside upstream-drift.yml, for any future scheduled-watch workflow)

# Tech tracking
tech-stack:
  added: []  # No new dependencies — gh CLI + jq + bash only, all already provisioned by ubuntu-latest runner
  patterns:
    - "Four-branch report-state fallback rendering — jq empty validity probe + .summary.failed // 0 discriminator + // \"unknown\" / // [] defensive defaults; each branch emits a distinct state=... output for observability"
    - "Multi-line $GITHUB_OUTPUT via heredoc with non-default delimiter (BODY_EOF instead of bare EOF) — reduces collision risk with user-content EOF tokens in future fixture body content"
    - "Body indirection across step boundary — `BODY=$(cat <<'BODY_EOF' \\n ${{ steps.body.outputs.body }} \\n BODY_EOF)` — Actions runner interpolates the expression BEFORE the shell sees it, then the single-quoted heredoc reads the already-interpolated content verbatim (no double-expansion of $-tokens in body content)"
    - "Defensive multi-issue close — enumerate ALL matching open issues (not just head -1) with `while read -r N; do [ -z \"$N\" ] && continue; gh issue close \"$N\" --comment \"...\" --reason completed; done` — cleans up any historical duplicate from manual dupes or prior dedupe races, complementing concurrency: cancel-in-progress: false primary defense"
    - "Atomic close+comment single-call — `gh issue close --comment ... --reason completed` is ONE API call; never split into separate `gh issue comment` then `gh issue close` (orphaned-comment-on-still-open-issue anti-pattern)"
    - "Fuzzy-search-plus-client-side-startswith dedupe — `gh issue list --label X --search 'in:title \"PREFIX\"' --jq '.[] | select(.title | startswith(\"PREFIX\")) | .number'` — search:in:title is fuzzy/token-based, the --jq startswith is the required exact post-filter"

key-files:
  created: []
  modified:
    - .github/workflows/docs-reliability-watch.yml  # Appended 3 steps (body, create-or-update, auto-close); 93 → 304 lines

key-decisions:
  - "Implemented D-04 (multi-issue auto-close — enumerate ALL matching open issues, not just head -1) with `while read -r N` and atomic `gh issue close --comment ... --reason completed`"
  - "Implemented D-05 (stable title prefix `Docs reliability watch: scheduled smoke failed` with UTC `(YYYY-MM-DD)` suffix; dedupe matches on prefix only)"
  - "Implemented D-06 (idempotent label `docs-reliability` — color B60205, description per spec — created via `gh label create ... 2>/dev/null || true` mirroring upstream-drift.yml:157)"
  - "Implemented D-07 (forks gate `github.repository == 'farce1/tinkerise'` on body + create-or-update + auto-close steps — 3 occurrences total, well above the ≥2 floor)"
  - "Implemented D-10 (structured-summary issue body — heading, run metadata, failure table parsed from docs-smoke-report.json via jq + awk markdown alignment, why-this-matters footer with REL-04 link, artifact links)"
  - "Implemented D-11 (four-branch body renderer with all three fallback states: missing report, malformed JSON, zero-failures-but-job-failed; only branch 4 emits the structured body)"
  - "Used non-default heredoc delimiter `BODY_EOF` (instead of bare `EOF`) for $GITHUB_OUTPUT writes — collision-resistant against any user-content EOF token in future fixture body content"
  - "Used single-quoted `'BODY_EOF'` for the body indirection heredoc in step 9 — suppresses shell variable expansion of `${{ ... }}`-tokens BEFORE the Actions runner has interpolated them; runner replaces the expression before the shell sees it, then the heredoc copies the interpolated content verbatim"

patterns-established:
  - "Pattern: Four-branch report-state fallback in CI body renderers — jq empty parse probe + `// 0` numeric discriminator + per-state distinct `state=...` output; each minimal-fallback branch terminates with explicit `exit 0` so the shell step succeeds while the workflow's failure status is inherited via `if: failure()`"
  - "Pattern: Cross-step body indirection — `id: body` step writes multi-line content via `echo body<<BODY_EOF ... BODY_EOF` to $GITHUB_OUTPUT; consumer step reads via `BODY=$(cat <<'BODY_EOF' \\n ${{ steps.body.outputs.body }} \\n BODY_EOF)`; passes via argv (`--body \"$BODY\"`) — no shell expansion of body content"
  - "Pattern: Defensive multi-issue close as secondary safety net — primary defense (concurrency group with cancel-in-progress: false) prevents the race; secondary defense (enumerate-all-matches close) cleans up any historical duplicate that snuck through via manual maintainer action or prior race"
  - "Pattern: Forks gate applied at the if-condition level (NOT as a runtime `[ \"$GITHUB_REPOSITORY\" = ... ]` check inside the run block) — Actions runtime evaluates the expression before scheduling the step; on a fork, the step is skipped entirely (no runner cost, no logs, no API calls)"

requirements-completed: [REL-04]

# Metrics
duration: 5 min
completed: 2026-05-14
---

# Phase 35 Plan 02: Docs Reliability Watch Issue Lifecycle Summary

**Three-step append to the scheduled-smoke job that delivers the full issue lifecycle: four-branch failure-path body renderer (missing / malformed / zero-failures / structured), idempotent label-create + dedupe-or-create on failure, defensive multi-issue auto-close on green — closing REL-04 end-to-end.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-14T10:50:00Z (approx — beginning of execution context load)
- **Completed:** 2026-05-14T10:54:09Z
- **Tasks:** 2
- **Files modified:** 1 (.github/workflows/docs-reliability-watch.yml: 93 → 304 lines, +211 lines)

## Accomplishments

- Appended `Build issue body (failure path with three fallbacks)` step (`id: body`) — four-branch renderer covering all D-11 report states (missing / malformed / zero-failures / structured); each branch emits a distinct `state=...` output for observability and a multi-line `body` output via heredoc to `$GITHUB_OUTPUT`.
- Appended `Create or update reliability-watch issue` step — idempotent `gh label create` (color B60205, description per spec, `2>/dev/null || true` swallow), title prefix `Docs reliability watch: scheduled smoke failed (UTC date)`, dedupe via `--label docs-reliability` + fuzzy `in:title` search + client-side `startswith` filter; comment-on-existing or create-new with body sourced from `${{ steps.body.outputs.body }}` via single-quoted heredoc indirection.
- Appended `Auto-close any open reliability-watch issues` step — enumerates ALL matching open issues (defensive multi-issue close per D-04, not just `head -1`), atomic single-call `gh issue close "$N" --comment "Resolved by passing scheduled smoke run: …" --reason completed` (no comment-then-close split, no `|| true` swallowing real failures).
- Forks gate `github.repository == 'farce1/tinkerise'` now appears 3 times across the file (body step + create-or-update + auto-close); plan floor was ≥2 with target 3.
- `GH_TOKEN: ${{ github.token }}` env on both gh-CLI steps (steps 9 and 10).
- All 11 D-IDs from CONTEXT.md (D-01 through D-11) are now implemented across plans 01 + 02; REL-04 is fully closed.

## Final YAML Structure

After this plan, `.github/workflows/docs-reliability-watch.yml` contains 304 lines and one `scheduled-smoke` job with 10 steps:

```
jobs.scheduled-smoke:
  steps:
    1.  Checkout                                              (actions/checkout@v4)
    2.  Setup Bun                                             (oven-sh/setup-bun@v2, bun-version: 1.1.9)
    3.  Install dependencies                                  (bun install --frozen-lockfile)
    4.  Install Playwright Chromium runtime                   (bunx playwright install --with-deps chromium)
    5.  Run docs:smoke against canonical production URL ...   (set -o pipefail; bun run ... --canonical-only ...)
    6.  Upload smoke report (always)                          (actions/upload-artifact@v4, if: always())
    7.  Upload smoke failure evidence (on failure)            (actions/upload-artifact@v4, if: failure())
    8.  Build issue body (failure path with three fallbacks)  (id: body, if: failure() && fork-gate)               ← NEW (this plan)
    9.  Create or update reliability-watch issue              (if: failure() && fork-gate, env: GH_TOKEN)         ← NEW (this plan)
    10. Auto-close any open reliability-watch issues          (if: success() && fork-gate, env: GH_TOKEN)         ← NEW (this plan)
```

Step count satisfies the plan's `≥ 10` floor (must_haves.artifacts.min_lines: 150 also satisfied at 304 lines).

## Five Terminal Branches — Reachability

| Branch | Trigger condition | Step path | Body content |
|--------|---------|-----------|--------------|
| (a) | smoke green + zero open issues | Step 10 only | Logs "No open docs-reliability issues to close." (early `exit 0`); no API write |
| (b) | smoke green + ≥1 open issues | Step 10 (`while read -r N` loop) | Each issue closed with "Resolved by passing scheduled smoke run: <RUN_URL>" comment via atomic `--comment ... --reason completed` |
| (c) | smoke red + report has ≥1 required failure | Steps 8 (branch 4 → `state=structured`) + 9 | Full structured-summary body per D-10: heading + run metadata + failed-checks markdown table + why-this-matters footer + artifact links |
| (d) | smoke red + report parses + zero required failures | Steps 8 (branch 3 → `state=job-failed-after-smoke-passed`) + 9 | Minimal "job failed after smoke checks passed" body |
| (e) | smoke red + report missing OR malformed | Steps 8 (branch 1 → `state=missing` OR branch 2 → `state=malformed`) + 9 | Minimal "smoke runner did not produce a report" or "could not be parsed" body + artifact link (branch 2 only) |

All five branches are statically verifiable (the `if:` conditions and `state=...` outputs are present in the file) and runtime-exercisable post-merge via the manual sequences listed in the plan's `<verification>` block.

## D-IDs Implemented

This plan implements: **D-04, D-05, D-06, D-07, D-10, D-11**.

Combined with plan 01's implementation of **D-01, D-02, D-03, D-08, D-09**, all 11 decisions from `35-CONTEXT.md` are now wired end-to-end.

| D-ID | Description | Implementation in this plan |
|------|-------------|------------------------------|
| D-04 | Rolling open issue + multi-issue auto-close | Step 9 dedupe-or-create + Step 10 enumerate-all-and-close-each |
| D-05 | Stable title prefix `Docs reliability watch: scheduled smoke failed (YYYY-MM-DD)`; dedupe on prefix only | `TITLE_PREFIX` constant in steps 9 + 10; `--jq '.[] \| select(.title \| startswith("$TITLE_PREFIX"))'` in both |
| D-06 | Stable label `docs-reliability` (color B60205, distinct from drift's `FBCA04`) created idempotently | Step 9 `gh label create "docs-reliability" --color "B60205" --description "..." 2>/dev/null \|\| true` |
| D-07 | Forks gate on every issue-writing step | `if: ... && github.repository == 'farce1/tinkerise'` on steps 8 + 9 + 10 (3 occurrences ≥ floor of 2) |
| D-10 | Structured summary body (heading + metadata + failure table + why-this-matters + artifacts) | Step 8 branch 4 `echo` block, including `jq + awk` markdown-table generation |
| D-11 | Three report-state fallbacks before structured rendering | Step 8 branches 1 (missing), 2 (malformed), 3 (zero-failures) — each terminates with explicit `exit 0` |

## Validation Dimensions Exercised

| Dim | Property | Status | Evidence |
|-----|----------|--------|----------|
| 1 | Trigger fires (cron + dispatch) | STATIC PASS (carried from plan 01) | `on.schedule == [{cron: '0 9 * * 4'}]`, `on.workflow_dispatch.inputs.force_failure` present (already verified by plan 01) |
| 2 | Smoke equivalence with docs-deploy.yml | STATIC PASS (carried from plan 01) | Same Bun version, Playwright command, set -o pipefail, tee log, artifact paths/retention (already verified by plan 01) |
| 3 | Failure path produces structured issue | STATIC PASS, RUNTIME DEFERRED | Step 8 branch 4 + step 9 are present and grep-verified. Runtime confirmation requires post-merge `gh workflow run docs-reliability-watch.yml -f force_failure=true` — listed as a maintainer-only manual verification per the plan's `<verification>` block. |
| 4 | Auto-close path closes ALL matching open issues | STATIC PASS, RUNTIME DEFERRED | Step 10 `while read -r N` loop with atomic close+comment is present and grep-verified. Runtime confirmation requires post-merge `gh issue create … --label docs-reliability` followed by `gh workflow run docs-reliability-watch.yml`. |
| 5 | Report-state fallbacks (4 branches) | STATIC PASS | All 4 branches grep-verified via `state=missing`, `state=malformed`, `state=job-failed-after-smoke-passed`, `state=structured`. Branch 4 confirmed runtime-exercisable via `force_failure=true`. Branches 1/2/3 remain code-review-only per the plan's pragmatic alternative (sabotage would require workflow-level modification and is out of scope). |
| 6 | Permissions block exact (`{contents: read, issues: write}`) | STATIC PASS (carried from plan 01) | YAML parse confirms `permissions == {contents: 'read', issues: 'write'}`. The runtime proof requirement ("`issues: write` actually succeeds at runtime") is exercised whenever steps 9 + 10 run and complete without 403 — DEFERRED to post-merge. |
| 7 | Forks gate prevents fork-actor writes | STATIC PASS | `grep -c "github.repository == 'farce1/tinkerise'"` returns 3 (≥ plan floor of 2). All three issue-writing steps are gated. |

Static dimensions 1, 2, 5, 6, 7 are PASS at the file level. Runtime dimensions 3, 4, 6 (the `gh` parts) DEFERRED to post-merge maintainer dispatch — this is intentional per the plan's `<verification>` block (workflow files cannot be runtime-tested without merging to a branch GitHub Actions trusts to run scheduled/dispatched workflows).

## Task Commits

1. **Task 1: Append the four-branch body renderer step** — `ad8daef` (feat)
2. **Task 2: Append the failure-path label-create + dedupe-or-create issue step AND the success-path multi-issue auto-close step** — `ab3d113` (feat)

**Plan metadata:** _committed alongside this SUMMARY (commit hash recorded in commit log after this file is staged)_

## Files Created/Modified

- `.github/workflows/docs-reliability-watch.yml` — appended 3 steps (body renderer, create-or-update issue, auto-close issues) totaling 211 new lines (93 → 304). All edits via the Edit tool, anchored to plan-01's failure-evidence upload step (Task 1) and to the body step's branch-4 closing brace (Task 2). No content from plan 01 was modified.

## Decisions Made

All decisions in this plan were CONTEXT-prescribed (D-04, D-05, D-06, D-07, D-10, D-11) and the planner extracted exact YAML to lift verbatim from the plan's `<action>` blocks. The executor implemented exactly the prescribed snippets — no new decisions were required during execution.

## Deviations from Plan

**None — plan executed exactly as written.**

Both tasks executed using the prescribed Edit tool (preserving plan 01's existing 93-line skeleton). All 14 task-1 acceptance criteria and all 19 task-2 acceptance criteria pass via grep / fixed-string / YAML parse. The plan-level `<verification>` static checks all PASS via `bun --eval` + `js-yaml` (yq is not available in the worktree environment; equivalent JS YAML parser used).

The body-indirection heredoc in step 9 reuses the same `BODY_EOF` delimiter as the body renderer in step 8 — this is per the plan's literal snippet and is safe because the two heredocs live in different `run:` blocks (different shell invocations); no within-script collision is possible. The total `BODY_EOF` token count in the file is 10 (8 from task 1's four branches × 2 open/close + 2 from task 2's body indirection × 1 open/close pair); task 2's plan does not assert a global BODY_EOF count.

## Authentication Gates

None — the workflow file is static YAML. Runtime auth uses `${{ github.token }}` (the Actions-provisioned `secrets.GITHUB_TOKEN`); no maintainer secrets were added or required.

## Issues Encountered

**Worktree branch base mismatch (resolved at agent startup, no commits affected):** On entry the worktree branch `worktree-agent-a9ac87f6efbb79267` was detected to be 3 commits BEHIND main. Plan 35-01's commits (`4a79f83`, `0078513`, `b1dd369`) had been merged into main before this worktree was created, but the worktree branch was created from an older base — the documented Claude Code `EnterWorktree` bug (#2015) where the branch is created from `main` at a stale snapshot. Resolved per the execute-plan.md `<worktree_branch_check>` protocol: hard-reset the worktree branch to `main` (which was the correct expected base for this wave-2 plan) before starting work. HEAD safety re-verified after reset (`worktree-agent-a9ac87f6efbb79267`, matches `^worktree-agent-[A-Za-z0-9._/-]+$` allow-list, no protected-ref drift). Net effect on plan output: zero — both Task 1 and Task 2 commits sit on the worktree branch, on top of plan 35-01's three commits, exactly as the orchestrator's merge step expects.

**Pre-existing main-repo planning dirt (untouched):** The main repo's working tree had pre-existing modifications to `.planning/STATE.md` and `.planning/ROADMAP.md` (visible in this session's gitStatus snapshot) that predate this agent's work. They were left untouched. The worktree itself is clean.

**Husky hooks ignored (cosmetic, not bypass):** Both task commits surfaced `hint: ... was ignored because it's not set as executable`. This is a filesystem-mode artifact in the worktree (same condition as plan 35-01's commits `4a79f83`, `0078513`, `b1dd369`); git itself surfaced the warning rather than the executor using `--no-verify` (which would have been forbidden per execute-plan.md). The hooks would run normally on a fresh `bun install` in the main checkout.

## User Setup Required

None — REL-04 requires no maintainer secrets, no new repo variables, and no external service configuration. The workflow uses `${{ github.token }}` (Actions-provisioned) and either `${{ vars.DOCS_CANONICAL_URL }}` (if already set by plan 35-01's setup, optional) or the hard-coded `https://farce1.github.io/tinkerise/` fallback.

The post-merge maintainer-only runtime verifications (Dim 3 force-failure dispatch, Dim 4 manual-dupe-then-pass) are observation steps, not setup.

## Next Phase Readiness

- **REL-04 fully closed.** All 11 D-IDs from `35-CONTEXT.md` are now implemented across plans 01 + 02. The scheduled docs reliability watch workflow is complete: weekly Thu 09:00 UTC cron + manual dispatch, canonical-only smoke, both artifact uploads, four-branch failure-path body renderer, idempotent label, dedupe-or-create issue, defensive multi-issue auto-close, forks gate on every issue-writing step, GH_TOKEN env on every gh-CLI step.
- **Phase 35 ready for verification.** The next step in the GSD workflow is `/gsd-verify-work 35` (or `/gsd-discuss-phase 36` if the maintainer prefers to advance directly). Phase 35 is the final required-check delivery for v3.2 reliability operations per `.planning/REQUIREMENTS.md` REL-04.
- **No deferred items, no blockers, no architectural questions.** Open Questions Q1 (force_failure lever) was resolved in plan 35-01; Q2 (label distinct from drift) was resolved in this plan via the `B60205` choice; Q3 (no `|| true` on gh issue create/close) was honored — all `gh issue create` and `gh issue close` calls fail loudly on real errors.
- **Runtime validation deferred to post-merge maintainer dispatch.** Validation Dimensions 3, 4, and the runtime portion of Dimension 6 require a merged workflow that GitHub Actions will accept for `schedule`/`workflow_dispatch` triggers. The plan's `<verification>` block lists the exact `gh workflow run …` invocations to execute after merge.

## Self-Check: PASSED

- [x] `.github/workflows/docs-reliability-watch.yml` exists in the worktree at the correct path (304 lines, 10-step `scheduled-smoke` job — verified via `wc -l` + `bun --eval` YAML parse + `js-yaml` step enumeration)
- [x] Both task commits present in `git log` on the worktree branch: `ad8daef` (feat 35-02 task 1: body renderer) + `ab3d113` (feat 35-02 task 2: lifecycle steps) — verified via `git log --oneline -3`
- [x] All 14 task-1 acceptance criteria PASS via plan-prescribed grep / fixed-string / count commands
- [x] All 19 task-2 acceptance criteria PASS via plan-prescribed grep / fixed-string / count commands (note: `GH_TOKEN: ${{ github.token }}` literal grep required `-F` fixed-string mode; the plan's automated verify line has the same shell-quoting trap, semantics-equivalent count = 2 confirmed)
- [x] Both `<verify><automated>` plan blocks return success (after correcting for the shell-quoting artifact noted above)
- [x] Plan-level `<verification>` static checks PASS: YAML parses, step count ≥ 10 (got 10), forks gate count ≥ 3 (got 3), BODY_EOF count = 10 (8 from task 1 + 2 from task 2 body indirection — task 2 plan does not re-assert this), GH_TOKEN env on 2 steps (got 2 via fixed-string), permissions block exact (`{contents: read, issues: write}`)
- [x] No accidental file deletions in either commit (`git diff --diff-filter=D --name-only HEAD~1 HEAD` and `HEAD~2 HEAD~1` both blank)
- [x] HEAD safely on per-agent branch `worktree-agent-a9ac87f6efbb79267` throughout — no protected-ref drift, no `git update-ref` self-recovery attempted

---
*Phase: 35-scheduled-docs-reliability-watch*
*Completed: 2026-05-14*
