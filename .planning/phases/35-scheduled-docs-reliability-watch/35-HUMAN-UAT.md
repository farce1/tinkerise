---
status: partial
phase: 35-scheduled-docs-reliability-watch
source: [35-VERIFICATION.md]
started: 2026-05-14T12:35:00Z
updated: 2026-05-14T12:35:00Z
---

## Current Test

[awaiting human testing — requires merged workflow on `main` so GitHub Actions honours `workflow_dispatch` and the cron schedule]

## Tests

### 1. Dispatch `force_failure=true` — verify failure creates GitHub Issue
expected: A new issue is created with label `docs-reliability`, title starting with `Docs reliability watch: scheduled smoke failed`, body containing the run link and a markdown table of failed checks. Run is marked failed.
command: `gh workflow run docs-reliability-watch.yml -f force_failure=true`
result: [pending]

### 2. Dispatch without inputs (smoke green) — verify auto-close
expected: If any open `docs-reliability` issue exists with the matching title prefix, it is closed with `Resolved by passing scheduled smoke run: <url>` comment and `--reason completed`. If no matching issue exists, step logs `No open docs-reliability issues to close.`.
command: `gh workflow run docs-reliability-watch.yml`
result: [pending]

### 3. Verify cron actually fires Thursday 09:00 UTC
expected: After merge, `gh run list --workflow=docs-reliability-watch.yml` shows a scheduled run completing on the first Thursday at or shortly after 09:00 UTC.
command: `gh run list --workflow=docs-reliability-watch.yml --limit 5`
result: [pending]

### 4. Confirm `issues: write` permission succeeds at runtime
expected: Steps 9 (Create or update reliability-watch issue) and 10 (Auto-close any open reliability-watch issues) complete without HTTP 403 during tests 1 and 2 above. Proves the `permissions: issues: write` block is effective.
command: `gh run view <run-id> --log` (after dispatching tests 1 + 2)
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
