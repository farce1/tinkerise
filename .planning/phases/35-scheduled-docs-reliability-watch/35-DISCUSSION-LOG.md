# Phase 35: Scheduled Docs Reliability Watch - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 35-scheduled-docs-reliability-watch
**Areas discussed:** Smoke target, Issue lifecycle, Schedule timing, Issue body content

---

## Smoke target

| Option | Description | Selected |
|--------|-------------|----------|
| Production URL only (Recommended) | Hit the live deployed canonical URL (`https://farce1.github.io/tinkerise` via `vars.DOCS_CANONICAL_URL` / `astro.config`). Mirrors the `docs-deploy.yml` post-deploy smoke exactly — same checks, same target. Catches: production drift, deploys that slipped past path filters, external regressions (CDN, GH Pages config). Fast — no build needed. | ✓ |
| Preview build only | Build docs from main HEAD locally and smoke against the preview server (`reliability:docs-preview-smoke` pattern). Catches: code-vs-build drift at HEAD even if production was last shipped fine. Misses: actual production drift. Slower (full build). | |
| Both (production + preview) | Run both targets sequentially in one job, or as parallel jobs. Maximum coverage but ~2x runtime and effectively duplicates `ci.yml`'s preview gate when main is the trigger source. | |

**User's choice:** Production URL only.
**Notes:** Aligns directly with success criterion #2 ("same checks as the gated post-deploy smoke run"). Preview-build coverage is already provided by `ci.yml reliability-gates` on every push/PR.

---

## Issue lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Rolling issue + auto-close on green (Recommended) | Mirror `upstream-drift.yml`: search for an open issue by stable title prefix; if found, comment on it; if not, create new. Additionally, on a subsequent green run, auto-close any open issue with this label/title prefix and post a "resolved by run #X" comment. | ✓ |
| Rolling issue, no auto-close | Same comment-vs-create dedupe as drift, but never auto-close — maintainer manually closes after confirming. Safer if you want a human ack of resolution. Tradeoff: stale open issues if a transient failure self-heals. | |
| New issue per failure | Always open a fresh issue on each failed run. Maximum history granularity but very noisy — a multi-week regression spawns multiple issues. | |

**User's choice:** Rolling issue + auto-close on green.
**Notes:** Adds a success-path step the drift workflow does not have; planner can decide whether to implement as a separate `if: success()` job or as branches inside one always-run job.

---

## Schedule timing

| Option | Description | Selected |
|--------|-------------|----------|
| Monday 09:00 UTC (same as drift) | Cron `0 9 * * 1`. Identical to `upstream-drift.yml`. Pro: one mental model for "weekly reliability checks fire Monday morning UTC." Con: both workflows compete for runners and noise lands in maintainer inbox at the same time. | |
| Thursday 09:00 UTC (Recommended) | Cron `0 9 * * 4`. Mid-week stagger so drift (Mon) and docs-watch (Thu) spread coverage — if Monday's prod is healthy and a flaky external dep breaks docs Tuesday, catch it within ~48h instead of next Monday. | ✓ |
| Sunday 18:00 UTC | Cron `0 18 * * 0`. Pre-week-start signal — maintainer wakes Monday with a clean or already-known-bad state. Tradeoff: lower runner contention, but weekend failures may sit unaddressed for hours. | |

**User's choice:** Thursday 09:00 UTC.
**Notes:** Same hour-of-day as drift for predictability; mid-week stagger for coverage spread.

---

## Issue body content

| Option | Description | Selected |
|--------|-------------|----------|
| Structured summary + artifact link (Recommended) | Body contains: run link, run timestamp, target URL, parsed failure summary from `docs-smoke-report.json` (per-check pass/fail rows + which required check failed), explicit "why this matters" note about path-filter trigger gaps, and a link to the uploaded artifact bundle for log/screenshots. | ✓ |
| Minimal: run link + failed-check names only | One line per failed check + run URL. Maintainer must open the run + download artifact to diagnose. Cleanest signal but extra hops to investigate. | |
| Verbose: summary + inline log tail | Structured summary PLUS the last ~80 lines of `docs-smoke.log` inlined in a fenced block. Self-contained for triage on mobile/email — at the cost of long, sometimes noisy issue bodies. | |

**User's choice:** Structured summary + artifact link.
**Notes:** Body generated inline from `docs-smoke-report.json` (jq or small node snippet inside the workflow step). Fallback to minimal body if the report file is missing.

---

## Claude's Discretion

- Exact YAML structure, step order, and step names within the new workflow.
- Recommended workflow filename (`.github/workflows/docs-reliability-watch.yml`).
- Bun version pin and Playwright install flags — match `docs-deploy.yml`'s smoke job verbatim.
- Artifact retention days — match the existing docs-deploy smoke pattern (14 days) unless researcher finds a reason to bump.
- Whether the failure-write and success-close branches live in two separate jobs (`if: failure()` / `if: success()`) or one always-run job with internal branching.
- Whether to add a `concurrency:` group to prevent overlapping manual + cron runs.
- Permissions block contents (must include `contents: read` and `issues: write`).
- Exact wording of the GitHub Issue body and the "resolved by run #X" close comment.

## Deferred Ideas

- Notification surfaces beyond GitHub Issue (Slack / email / webhook).
- Auto-bisect on failure to find the commit that introduced the regression.
- Trend reporting (monthly summary of scheduled-run failures).
- Promoting the watch workflow to a required branch-protection context.
- Expanding check coverage in the smoke fixture (more routes / queries / code-render variants).
