# Reliability Required Checks

This record tracks required-check configuration for reliability enforcement on `main`.

## Configuration Record

- **Configuration location:** Ruleset
- **Branch:** `main`
- **Required check names:** `CI / Reliability Gates`
- **Configured by:** `<your-github-handle>`
- **Configured at (UTC):** `<current-utc-iso>`

## Verification Evidence

- A pull request with a failing `CI / Reliability Gates` check is blocked from merge.
- A pull request with a passing `CI / Reliability Gates` check is merge-eligible.

## Stability Note

Do not rename the `reliability-gates` CI job or its displayed check name after ruleset linkage.
