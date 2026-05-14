---
phase: 35-scheduled-docs-reliability-watch
verified: 2026-05-14T12:00:00Z
status: human_needed
score: 10/10 must-haves verified (static)
overrides_applied: 0
re_verification: false
gaps: []
human_verification:
  - test: "Dispatch force_failure=true — verify failure creates GitHub Issue"
    expected: "A new issue is created with label docs-reliability, title starting with 'Docs reliability watch: scheduled smoke failed', body containing run link and markdown table of failed checks, run is marked failed."
    why_human: "Requires a merged workflow branch that GitHub Actions will honour for workflow_dispatch. Cannot execute gh workflow run in a static verification context."
  - test: "Dispatch without inputs (smoke green) — verify auto-close"
    expected: "If any open docs-reliability issue exists with the matching title prefix, it is closed with 'Resolved by passing scheduled smoke run: <url>' comment and --reason completed. If no such issue exists, step logs 'No open docs-reliability issues to close.'"
    why_human: "Requires a live merged workflow and an open matching issue to observe close behaviour. Static checks confirm the code paths exist but cannot exercise the GitHub API calls."
  - test: "Verify cron actually fires Thursday 09:00 UTC"
    expected: "After merge, gh run list --workflow=docs-reliability-watch.yml shows a scheduled run completing on the first Thursday at or shortly after 09:00 UTC."
    why_human: "GitHub cron scheduling cannot be verified without waiting for the first scheduled trigger post-merge."
  - test: "Confirm issues: write permission succeeds at runtime"
    expected: "Steps 9 and 10 (create-or-update, auto-close) complete without HTTP 403. This proves the permissions: issues: write block is effective in the actual repo environment."
    why_human: "Permission scope effectiveness requires a live Actions run — static YAML parse only confirms the block is declared correctly."
---

# Phase 35: Scheduled Docs Reliability Watch — Verification Report

**Phase Goal:** Maintainers detect docs production regressions even when path-filter triggers fail to fire on the relevant commits.
**Verified:** 2026-05-14T12:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

All three phase success criteria are statically satisfied by the implemented workflow file. Four runtime behaviours (issue creation on failure, issue auto-close on success, cron timing, live permission scope) require post-merge manual dispatch and are documented under Human Verification.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Workflow file exists at `.github/workflows/docs-reliability-watch.yml` | VERIFIED | File present, 304 lines |
| 2 | Triggers on schedule `'0 9 * * 4'` AND `workflow_dispatch` | VERIFIED | `on.schedule[0].cron = '0 9 * * 4'`; `on.workflow_dispatch` present; no `paths:` filter |
| 3 | `workflow_dispatch` exposes boolean input `force_failure` (default false) that conditionally appends `--inject-required-failure` | VERIFIED | `type: boolean`, `default: false`, ternary `inputs.force_failure && '--inject-required-failure' \|\| ''` present in smoke step |
| 4 | Permissions exactly `{contents: read, issues: write}` — no `pages:`, no `write-all` | VERIFIED | YAML parse: `{"contents":"read","issues":"write"}`; `grep -c "pages:" = 0` |
| 5 | Concurrency group `docs-reliability-watch` with `cancel-in-progress: false` | VERIFIED | Both keys present at workflow level |
| 6 | Smoke step invokes `bun run --filter @tinkerise/docs docs:smoke -- --canonical-only` with bun 1.1.9 + Playwright Chromium | VERIFIED | Exact string found; `bun-version: 1.1.9`; `bunx playwright install --with-deps chromium` |
| 7 | `CANONICAL_URL` resolves via `vars.DOCS_CANONICAL_URL \|\| 'https://farce1.github.io/tinkerise/'` | VERIFIED | Exact expression found in smoke step env block |
| 8 | `set -o pipefail` + `tee apps/docs/scripts/artifacts/docs-smoke.log` | VERIFIED | Both present in smoke step `run:` block |
| 9 | `if: failure()` on artifact upload and body renderer steps — no special-casing | VERIFIED | Upload step 7 has `if: failure()`; body step 8 has `if: failure() && github.repository == 'farce1/tinkerise'`; no pre-smoke-specific conditional |
| 10 | Two artifact uploads with `if-no-files-found: warn`, `retention-days: 14` (report always, evidence on failure) | VERIFIED | `grep -c 'retention-days: 14' = 2`; `grep -c 'if-no-files-found: warn' = 2`; `if: always()` on report; `if: failure()` on evidence |
| 11 | Four-branch body renderer (`id: body`) with all four states (missing / malformed / zero-failures / structured), `BODY_EOF` heredoc, `jq empty`, `jq -r '.summary.failed // 0'` | VERIFIED | All four `state=` values present; `jq empty` and `jq -r '.summary.failed // 0'` confirmed; `BODY_EOF` count = 10 (8 from body step + 2 from body indirection) |
| 12 | Label `docs-reliability` created idempotently via `2>/dev/null \|\| true`, color `B60205` | VERIFIED | `gh label create "docs-reliability" ... --color "B60205" 2>/dev/null \|\| true` |
| 13 | Dedupe via `--label docs-reliability` + `--search "in:title \"<prefix>\""` + client-side `startswith` jq filter | VERIFIED | `select(.title \| startswith(` appears 2 times (failure dedupe + success enumeration); `--label docs-reliability` appears 3 times |
| 14 | Stable title prefix `Docs reliability watch: scheduled smoke failed` with UTC date suffix | VERIFIED | `TITLE_PREFIX="Docs reliability watch: scheduled smoke failed"` present in both steps 9 and 10 |
| 15 | Failure path branches: `gh issue comment $EXISTING` if found, else `gh issue create` | VERIFIED | Both branches present in step 9 |
| 16 | Success path closes ALL open matching issues with atomic `gh issue close "$N" --comment "..." --reason completed` | VERIFIED | `while read -r N` loop; atomic `gh issue close "$N" \ --comment "Resolved by passing scheduled smoke run: ${RUN_URL}" \ --reason completed`; `[ -z "$N" ] && continue` guard |
| 17 | Forks gate `github.repository == 'farce1/tinkerise'` appears ≥ 3 times | VERIFIED | Count = 3 (body step + create-or-update + auto-close) |
| 18 | `GH_TOKEN` env on every `gh`-using step | VERIFIED | Count = 2 (steps 9 and 10 only; step 8 does not invoke `gh`) |
| 19 | No `\|\| true` on `gh issue create` or `gh issue close` | VERIFIED | Pattern absent |
| 20 | Step count in `scheduled-smoke` job ≥ 10 | VERIFIED | 10 steps exactly |
| 21 | File parses as valid YAML | VERIFIED | `js-yaml` parse succeeds; all structural fields accessible |

**Score:** 21/21 truths statically verified

---

## Phase Success Criteria

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| SC1 | A GitHub Actions workflow runs the full unfiltered docs verification suite on a weekly schedule independent of push/path-filter triggers | VERIFIED | `on.schedule: cron: '0 9 * * 4'` (Thursday 09:00 UTC); no `paths:` filter; invokes `docs:smoke` unconditionally |
| SC2 | Maintainer can review the most recent scheduled run output and confirm it exercised the same checks as the gated post-deploy smoke run | VERIFIED | Identical script (`docs:smoke` via `--filter @tinkerise/docs`), identical Bun 1.1.9, identical Playwright Chromium install, identical `set -o pipefail` + `tee` pattern, identical artifact uploads (always + on-failure, 14-day retention, `if-no-files-found: warn`). Only expected deltas: `--canonical-only` flag (no deploy job), conditional `--inject-required-failure` (dispatch input), absent `DEPLOY_URL` env. |
| SC3 | On scheduled-run failure, the workflow automatically opens a GitHub Issue with run link, failure summary, and a stable issue label so it does not silently fail | VERIFIED (static) / human_needed (runtime) | Static: `RUN_URL` constructed from `github.server_url/github.repository/actions/runs/github.run_id`; `### Failed required checks` markdown table in structured branch; `docs-reliability` label on `gh issue create`; `BODY_EOF` heredoc wires body to `gh issue comment/create`. Runtime: post-merge dispatch required to confirm GitHub API accepts the calls. |

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.github/workflows/docs-reliability-watch.yml` | Complete scheduled docs reliability watch workflow, 150+ lines, single `scheduled-smoke` job | VERIFIED | 304 lines, 10-step `scheduled-smoke` job, parses as valid YAML, contains all required content |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scheduled-smoke` job → smoke runner | `apps/docs/scripts/smoke-production-docs.mjs` | `bun run --filter @tinkerise/docs docs:smoke -- --canonical-only` | VERIFIED | Exact invocation string present; `--canonical-only` flag correctly restricts to canonical target |
| `scheduled-smoke` job → canonical URL | `vars.DOCS_CANONICAL_URL` repo variable | `env: CANONICAL_URL: ${{ vars.DOCS_CANONICAL_URL \|\| 'https://farce1.github.io/tinkerise/' }}` | VERIFIED | Exact expression present; fallback URL matches `astro.config.mjs:5-6` concatenation |
| `scheduled-smoke` job → artifact storage | `actions/upload-artifact@v4` (×2) | `if: always()` (report) + `if: failure()` (evidence bundle) | VERIFIED | Both upload steps confirmed with correct conditions and retention |
| `id: body` step → `$GITHUB_OUTPUT` | `echo body<<BODY_EOF ... BODY_EOF` heredoc | Multi-line output per RESEARCH Pitfall 1 | VERIFIED | Heredoc pattern confirmed; `BODY_EOF` delimiter (not bare `EOF`) used throughout |
| `id: body` output → `gh issue create/comment` | `BODY=$(cat <<'BODY_EOF' ${{ steps.body.outputs.body }} BODY_EOF)` | Body indirection via single-quoted heredoc | VERIFIED | `cat <<'BODY_EOF'` and `steps.body.outputs.body` reference both present in step 9 |
| `gh issue list` search → exact issue | `--jq ".[] \| select(.title \| startswith(...))"` | Client-side `startswith` filter (RESEARCH Pitfall 2 mitigation) | VERIFIED | `select(.title \| startswith(` present twice (step 9 dedupe + step 10 enumeration) |

---

## Data-Flow Trace (Level 4)

Not applicable: this phase delivers a GitHub Actions workflow YAML file, not a component or page that renders dynamic data. The data flow (smoke report → jq → issue body → GitHub API) is wired statically in the YAML and exercisable only at workflow runtime.

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for the GitHub API write paths (issue create, issue close) — these require a live merged workflow and cannot be invoked without side effects in this verification context.

The following checks were executed statically:

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| YAML parses without error | `node -e "require('js-yaml').load(fs.readFileSync(...))"` | No error thrown | PASS |
| Step count ≥ 10 | YAML parse → `d.jobs['scheduled-smoke'].steps.length` | 10 | PASS |
| Forks gate count ≥ 3 | `grep -c "github.repository == 'farce1/tinkerise'"` | 3 | PASS |
| GH_TOKEN on every gh step | `grep -c "GH_TOKEN:"` | 2 (steps 9 and 10 only; step 8 has no gh calls) | PASS |
| No DEPLOY_URL in reliability-watch workflow | `grep "DEPLOY_URL:"` | absent | PASS |
| BODY_EOF count = 10 | `grep -c "BODY_EOF"` | 10 (8 from four-branch renderer + 2 from body indirection) | PASS |
| Four state discriminators present | `grep -c "state="` | 4 (missing, malformed, job-failed-after-smoke-passed, structured) | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REL-04 | 35-01, 35-02 | Scheduled GitHub Actions workflow runs full unfiltered docs verification weekly and opens a GitHub Issue on failure (covers path-filter trigger gaps from REL-03) | VERIFIED (static) | Schedule trigger without paths filter; same `docs:smoke` invocation; issue create/comment on failure; auto-close on success; all static checks pass. Runtime portion (live dispatch) is human_verification_pending. |

---

## D-ID Coverage (All 11 from CONTEXT.md)

| D-ID | Decision | Status | Evidence (file:line) |
|------|----------|--------|----------------------|
| D-01 | Canonical-only smoke, no fresh build, no DEPLOY_URL | VERIFIED | `--canonical-only` in smoke step (line 65); `DEPLOY_URL` absent from entire file |
| D-02 | `vars.DOCS_CANONICAL_URL \|\| 'https://farce1.github.io/tinkerise/'` fallback | VERIFIED | Line 72: `CANONICAL_URL: ${{ vars.DOCS_CANONICAL_URL \|\| 'https://farce1.github.io/tinkerise/' }}` |
| D-03 | Failure-before-smoke = job failure; no special-casing | VERIFIED | `if: failure()` on upload step 7 and body step 8 naturally catches all upstream failures; no conditional branching based on which step failed |
| D-04 | Rolling open issue; auto-close ALL matching open issues | VERIFIED | Step 9: comment-or-create dedupe; Step 10: `while read -r N` enumerate-all, atomic `gh issue close "$N" --comment ... --reason completed` (lines 298-303) |
| D-05 | Stable title prefix `Docs reliability watch: scheduled smoke failed (YYYY-MM-DD)`; dedupe on prefix only | VERIFIED | `TITLE_PREFIX` constant in steps 9 and 10 (lines 239, 283); `startswith("${TITLE_PREFIX}")` in both steps |
| D-06 | Label `docs-reliability`, color `B60205`, idempotent create | VERIFIED | Lines 234-236: `gh label create "docs-reliability" ... --color "B60205" 2>/dev/null \|\| true` |
| D-07 | Forks gate `github.repository == 'farce1/tinkerise'` on every issue-writing step (≥ 2, got 3) | VERIFIED | Lines 105, 228, 279: three occurrences across body step, create-or-update, auto-close |
| D-08 | Cron `0 9 * * 4` (Thursday 09:00 UTC) | VERIFIED | Line 17: `cron: '0 9 * * 4'` |
| D-09 | `workflow_dispatch` with boolean `force_failure` input | VERIFIED | Lines 18-24: `workflow_dispatch.inputs.force_failure.type: boolean, default: false` |
| D-10 | Structured body: heading, run metadata, failure table, why-this-matters, artifact links | VERIFIED | Lines 191-216: branch 4 constructs full structured markdown body with all five required sections |
| D-11 | Four-branch body renderer: missing / malformed / zero-failures / structured | VERIFIED | Lines 112-217: all four branches with distinct `state=` outputs and `exit 0` on branches 1-3 |

---

## Anti-Patterns Found

None detected.

| File | Pattern | Result |
|------|---------|--------|
| `docs-reliability-watch.yml` | TODO/FIXME/placeholder comments | None found |
| `docs-reliability-watch.yml` | `return null` / empty stubs | Not applicable (YAML, not source code) |
| `docs-reliability-watch.yml` | `\|\| true` on `gh issue create` or `gh issue close` | Absent (correct; only on `gh label create` which is intentional idempotency) |
| `docs-reliability-watch.yml` | Separate `gh issue comment` then `gh issue close` (non-atomic anti-pattern) | Absent; atomic `gh issue close --comment ... --reason completed` used |
| `docs-reliability-watch.yml` | `pages:` permission key | Absent |
| `docs-reliability-watch.yml` | `DEPLOY_URL` env variable | Absent |
| `docs-reliability-watch.yml` | Bare `EOF` heredoc delimiter (collision risk) | Absent; `BODY_EOF` used throughout |

---

## Human Verification Required

Four items require post-merge runtime validation. These are not gaps — the static implementation is complete and correct. These items confirm live GitHub API integration.

### 1. Failure path: Issue creation end-to-end

**Test:** After merging to a branch GitHub Actions trusts, run: `gh workflow run docs-reliability-watch.yml -f force_failure=true` and wait for completion.
**Expected:**
- Workflow run is marked failed (smoke step exits non-zero).
- A new GitHub Issue is created with:
  - Label: `docs-reliability` (red, `#B60205`)
  - Title starting with `Docs reliability watch: scheduled smoke failed`
  - Body containing: run link, date, target URL, commit SHA, `### Failed required checks` table with the injected failure, `### Why this matters` section, artifact links.
- Both artifact uploads succeed: `docs-smoke-report-<run_id>` and `docs-smoke-failure-evidence-<run_id>`.
**Why human:** Requires a live merged workflow and GitHub Actions runner.

### 2. Success path: Issue auto-close end-to-end

**Test:** With at least one open `docs-reliability` issue having a title starting with `Docs reliability watch: scheduled smoke failed`, run: `gh workflow run docs-reliability-watch.yml` (no inputs). Wait for completion.
**Expected:**
- Workflow run is marked succeeded.
- The auto-close step closes every open matching issue with comment: `Resolved by passing scheduled smoke run: <run_url>` and closes with reason `completed`.
- `gh issue list --label docs-reliability --state open --json number | jq length` returns `0`.
**Why human:** Requires a live runner and an open issue to close.

### 3. Cron timing observation

**Test:** After merge to main, wait for the first Thursday at or after 09:00 UTC. Run: `gh run list --workflow=docs-reliability-watch.yml`.
**Expected:** A completed run appears triggered by `schedule` (not `workflow_dispatch`), timestamped around 09:00 UTC Thursday.
**Why human:** GitHub cron scheduling cannot be synthetically triggered.

### 4. Live `issues: write` permission confirmation

**Test:** Observing that items 1 or 2 above complete without HTTP 403 errors on any `gh issue` call confirms the `permissions: issues: write` block is effective.
**Expected:** No 403 errors in any step 8, 9, or 10 logs.
**Why human:** Permission scope enforcement requires a live Actions run against the actual repo.

---

## Gaps Summary

No static gaps found. All 21 observable truths are verified, all 11 D-IDs are implemented, all acceptance criteria in both plans pass their prescribed grep checks, REL-04 is fully covered by the implementation, and no anti-patterns were detected.

The `human_needed` status reflects four runtime validations that are intentionally deferred to post-merge maintainer dispatch per the plan's `<verification>` block and the VALIDATION.md "Manual-Only Verifications" section. These are not implementation gaps — they are the expected final acceptance steps for a GitHub Actions workflow that cannot be run without merging.

---

_Verified: 2026-05-14T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
