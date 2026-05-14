# Phase 35: Scheduled Docs Reliability Watch - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship a new GitHub Actions workflow that runs the existing `docs:smoke` verification suite against the deployed production docs on a weekly schedule (independent of any push or path filter), and that automatically opens a GitHub Issue when a scheduled run fails — so docs production regressions cannot hide behind path-filter trigger gaps in `docs-deploy.yml`.

**In scope:**
- One new workflow file (separate from `docs-deploy.yml` and `ci.yml`) triggered by `schedule:` + `workflow_dispatch:`, with no `paths:` filter.
- Invocation of the existing post-deploy smoke runner (`apps/docs/scripts/smoke-production-docs.mjs` via `bun run --filter @tinkerise/docs docs:smoke`) so the scheduled run executes the same required checks as the gated post-deploy smoke job in `docs-deploy.yml` (success criterion #2).
- Target: production canonical URL only (no fresh build, no preview server).
- Failure path: parse `docs-smoke-report.json`, find an existing open issue by stable title prefix; comment if found, create new with a stable label otherwise.
- Recovery path: on a passing scheduled run, auto-close any open issue matching the stable title prefix/label with a "resolved by run #X" comment.
- Artifact upload mirroring the existing `docs-deploy.yml` smoke job (`docs-smoke-report.json` always; failure evidence bundle on failure).

**Out of scope:**
- Changes to `.github/workflows/docs-deploy.yml` (its path-filtered smoke remains; the scheduled watch is additive, not a replacement).
- Changes to `apps/docs/scripts/smoke-production-docs.mjs` itself or its fixtures — the scheduled workflow consumes the runner as-is. New check coverage belongs in a separate phase.
- Adding the new workflow to required branch-protection contexts (the scheduled watch reports drift; it does not gate merges — the post-deploy + CI gates already do that).
- Preview-build smoke or any non-production target (covered by `ci.yml` reliability gates).
- PowerShell / Slack / email notification surfaces beyond the GitHub Issue (revisit in a later milestone if needed).
- Changes to the v3.1 closure bundle scripts under `scripts/reliability/` — the scheduled watch is a v3.2 reliability-operations layer, not part of v3.1 closure.

</domain>

<decisions>
## Implementation Decisions

### Smoke target
- **D-01:** Scheduled run targets the **deployed production URL only** — no fresh build, no preview server. Mirrors the `docs-deploy.yml` smoke job behavior so success criterion #2 ("same checks as the gated post-deploy smoke run") is trivially satisfied: same script, same fixtures, same required-check semantics.
- **D-02:** Resolution order for the target URL: prefer `vars.DOCS_CANONICAL_URL` (the same repo variable already wired into `docs-deploy.yml:106`); fall back to the hard-coded canonical `https://farce1.github.io/tinkerise/` (derived from `apps/docs/astro.config.mjs:5-6` `site` + `base`) when the variable is unset. Use `CANONICAL_URL` env + `--canonical-only` flag on `smoke-production-docs.mjs` so the runner doesn't expect a `DEPLOY_URL` (there is no deploy job in this workflow).
- **D-03:** Catching failure-before-smoke: if `bun install` / Playwright install steps fail, the job fails — that itself triggers the issue path (failure is failure). No special-casing required.

### Issue lifecycle
- **D-04:** **Rolling open issue, auto-close on green** — mirror the dedupe pattern in `.github/workflows/upstream-drift.yml:170-194` (search open issues by stable title prefix; comment on existing or create new with label). On a subsequent **passing** scheduled run, the workflow auto-closes any open issue matching the same title prefix/label and posts a single "resolved by run #X" comment before closing. Keeps the inbox clean and gives a clear pass→fail→resolved signal.
- **D-05:** Stable title prefix: `Docs reliability watch: scheduled smoke failed` (suffix `(YYYY-MM-DD)` for human readability; dedupe matches on the prefix only — same convention as drift workflow).
- **D-06:** Stable issue label: `docs-reliability` (new label, distinct from `drift`). Workflow ensures the label exists via `gh label create ... 2>/dev/null || true` on first failing run — same idempotent pattern as drift workflow's "Ensure drift label exists" step.
- **D-07:** Both failure and success branches must be **scoped to the canonical repo** to avoid forks opening issues against this repo on schedule. Gate the issue-create/close steps on `github.repository == 'farce1/tinkerise'` (consistent with current single-canonical-repo posture; drift workflow's silence on this is acceptable because forks rarely run actions on schedule, but the explicit gate is cheap insurance for issue-creating workflows).

### Schedule timing
- **D-08:** Cron `0 9 * * 4` — **Thursday 09:00 UTC**, weekly. Staggered from `upstream-drift.yml`'s Monday 09:00 UTC to spread reliability-watch coverage across the week; if Monday's prod is healthy and an external dependency or CDN regression hits docs Tuesday, the watch surfaces it within ~48h instead of next Monday.
- **D-09:** Include `workflow_dispatch:` for ad-hoc manual reruns (e.g., maintainer wants to verify a hotfix without waiting for Thursday). Matches `upstream-drift.yml` and `docs-deploy.yml`.

### Issue body content
- **D-10:** **Structured summary + artifact link.** Issue body contains, in this order:
  1. Heading and stable title `Docs reliability watch: scheduled smoke failed (YYYY-MM-DD)`.
  2. **Run metadata:** run link (`${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`), timestamp (UTC), target URL used, commit SHA on `main` at time of run.
  3. **Failure summary table** — parsed from `apps/docs/scripts/artifacts/docs-smoke-report.json`: one row per failed required check (check name, target route/query, error message). Required-check failures are the gate; non-required failures listed but not the trigger.
  4. **"Why this matters" footer** — short note (1-2 lines) that this is a scheduled unfiltered check intended to catch path-filter trigger gaps in `docs-deploy.yml`, with a link to REL-04 in `.planning/REQUIREMENTS.md`.
  5. **Artifact link** — point to the uploaded artifact bundle (`docs-smoke-failure-evidence-${{ github.run_id }}` and `docs-smoke-report-${{ github.run_id }}`) for log tail and screenshots.
- **D-11:** Body is generated by a small inline `node` snippet (or inline shell + `jq`) that reads `docs-smoke-report.json` and emits the markdown — kept inside the workflow step to avoid adding new files under `scripts/reliability/` for a 30-line transform. If the report file is missing (catastrophic pre-smoke failure), fall back to a minimal body: run link + "smoke runner did not produce a report — see run logs."

### Claude's Discretion
- Exact YAML structure, step order, and step names within the new workflow (planner/researcher will produce). Recommended file path: `.github/workflows/docs-reliability-watch.yml` (parallel naming to `upstream-drift.yml` and `docs-deploy.yml`).
- Bun version pin and Playwright install flags — match `docs-deploy.yml`'s smoke job exactly (`bun-version: 1.1.9`, `bunx playwright install --with-deps chromium`).
- Artifact retention days — match the existing docs-deploy smoke pattern (14 days for report + failure evidence) unless researcher finds a reason to bump for scheduled-run history.
- Whether the failure-path issue write and success-path issue close live in two separate jobs (driven by `if: failure()` / `if: success()`) or one always-run job with internal branching. Either is acceptable.
- Whether to also `concurrency:` group the scheduled workflow to prevent overlapping manual + cron runs.
- Permissions block contents (must include `contents: read` and `issues: write`; do not include `pages: write` — this workflow does not deploy).
- Exact wording of the GitHub Issue body and the "resolved by run #X" close comment.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` §"Phase 35: Scheduled Docs Reliability Watch" — phase goal, success criteria (3 truths), depends-on Phase 33.
- `.planning/REQUIREMENTS.md` §"REL-04" — sole requirement: scheduled GitHub Actions workflow runs full unfiltered docs verification weekly and opens a GitHub Issue on failure (covers path-filter trigger gaps from REL-03).
- `.planning/PROJECT.md` §"Active" + §"Next Milestone Goals" — REL-03 motivation (scheduled unfiltered docs verification to catch path-filter trigger gaps) and v3.2 reliability-operations positioning.

### Existing workflows to mirror or extend (do NOT modify in this phase)
- `.github/workflows/docs-deploy.yml` §`smoke` job (lines 74-128) — canonical source of truth for "the gated post-deploy smoke run" referenced in success criterion #2. Scheduled run MUST invoke the same `docs:smoke` script with the same target-resolution strategy (deploy URL + canonical URL; scheduled run uses canonical only). Mirror `bun-version: 1.1.9`, Playwright install, artifact upload patterns.
- `.github/workflows/upstream-drift.yml` (full file, especially lines 162-194) — template for the issue dedupe/create/comment pattern. Reusable bits: `gh label create ... || true`, search-by-title-prefix with `gh issue list --state open --search`, `gh issue comment` vs `gh issue create`, `permissions: issues: write`, `workflow_dispatch:` co-presence.
- `.github/workflows/ci.yml` §`reliability-gates` (lines 17-67) — reference only for the *preview* smoke path (`reliability:docs-preview-smoke`). Scheduled watch deliberately does NOT use this path (production target, not preview).

### Existing scripts the workflow invokes (do NOT modify in this phase)
- `apps/docs/scripts/smoke-production-docs.mjs` — entry point for `docs:smoke` (`apps/docs/package.json:13`). Accepts `--canonical-only` and `CANONICAL_URL` env. Writes `apps/docs/scripts/artifacts/docs-smoke-report.json` and per-route screenshots on failure.
- `apps/docs/scripts/fixtures/docs-smoke-fixtures.json` — required-route / search-query / code-route fixture set the runner verifies. Adding checks belongs in a separate phase.
- `apps/docs/astro.config.mjs:5-6` — canonical `site` (`https://farce1.github.io`) + `base` (`/tinkerise`) values used as the hard-coded fallback when `vars.DOCS_CANONICAL_URL` is unset.

### Prior-phase artifacts informing the design
- `.planning/phases/30-docs-production-reliability-verification/30-CONTEXT.md` + `30-02-PLAN.md` — origin of the post-deploy smoke job and the deploy URL + canonical URL strategy this phase inherits.
- `.planning/phases/32-reliability-closure-evidence-ci-enforcement/32-VERIFICATION.md` — confirms `docs-deploy.yml smoke` and `ci.yml reliability-gates` are wired and required; the scheduled watch is the unfiltered-coverage complement to those two.
- `.planning/milestones/v3.1-REQUIREMENTS.md` §"REL-03" — defines the trigger-gap problem this phase closes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Issue dedupe pattern** in `.github/workflows/upstream-drift.yml:162-194` — search-by-title-prefix + comment-or-create + label creation. Lift this pattern wholesale; only the title prefix, label name, and body content change.
- **Production smoke invocation** in `.github/workflows/docs-deploy.yml:74-128` — `bun-version: 1.1.9`, Playwright Chromium install, `set -o pipefail` + `tee` to `docs-smoke.log`, artifact upload of `docs-smoke-report.json` (always) and failure-evidence bundle (on failure). Mirror this verbatim minus the `needs: deploy` wiring.
- **Smoke runner CLI surface** in `apps/docs/scripts/smoke-production-docs.mjs` — `--canonical-only` flag and `CANONICAL_URL` env are already supported, so the scheduled workflow needs no script changes to target canonical-only.

### Established Patterns
- **Cron scheduling cadence** — `upstream-drift.yml` uses `0 9 * * 1` (Mon 09:00 UTC). New workflow uses `0 9 * * 4` (Thu 09:00 UTC) — same hour, staggered day, to spread reliability-watch coverage.
- **Single-source canonical URL** — `vars.DOCS_CANONICAL_URL` is the existing repo-level variable that `docs-deploy.yml` reads. Reuse it; do not introduce a parallel variable.
- **Label-first issue creation** — drift workflow runs `gh label create "drift" ... 2>/dev/null || true` before `gh issue create --label "drift"`. New workflow follows the same pattern with label `docs-reliability`.
- **Body via `printf '%s\n'` HEREDOC** — drift workflow uses `BODY=$(printf '%s\n' "## ..." "**Tool:** ..." ...)`. Same approach works for the structured-summary body; the parsed failure table can be built with `jq` over `docs-smoke-report.json`.

### Integration Points
- The scheduled workflow shares **zero code** with `docs-deploy.yml` and `ci.yml` — it is a third, additive workflow. The only shared surfaces are:
  - `apps/docs/scripts/smoke-production-docs.mjs` (read-only invocation).
  - `apps/docs/scripts/fixtures/docs-smoke-fixtures.json` (read-only fixture).
  - `vars.DOCS_CANONICAL_URL` (read-only repo variable).
  - `bun.lock` (frozen install).
- Branch protection: this workflow is intentionally NOT added to required-check contexts. Required gates already enforce reliability on PR/release paths (see `.planning/phases/32-reliability-closure-evidence-ci-enforcement/`). The watch reports drift; it does not block merges.

</code_context>

<specifics>
## Specific Ideas

- User explicitly referenced the upstream-drift workflow pattern (rolling open issue, comment-vs-create dedupe) and confirmed it as the model for this phase's issue handling.
- User preferred staggering the schedule (Thursday) rather than collocating with the existing Monday drift watch — explicit signal that mid-week coverage matters.
- User chose a structured-summary issue body with artifact link (parsed failures inline; deep evidence in the uploaded bundle) rather than minimal or verbose-log-tail variants.

</specifics>

<deferred>
## Deferred Ideas

- **Notification surfaces beyond GitHub Issue** (Slack/email/webhook) — out of scope for REL-04; revisit if maintainer review latency proves too high.
- **Auto-bisect on failure** (find the commit that introduced the regression) — interesting but well beyond REL-04's "open an issue" mandate; potential future reliability-ops phase.
- **Trend reporting** (e.g., monthly summary of how many scheduled runs failed) — defer until there's enough data to justify and a maintainer asks for it.
- **Required-check promotion** of the watch workflow — explicitly NOT done in this phase; the watch is a detection tool, not a gate. Revisit only if the watch proves itself stable over multiple milestones.
- **Expanding check coverage** (more routes, more queries, more code-render variants) — belongs in the fixture file, not in this phase's workflow file. Future phase if/when needed.

</deferred>

---

*Phase: 35-scheduled-docs-reliability-watch*
*Context gathered: 2026-05-14*
