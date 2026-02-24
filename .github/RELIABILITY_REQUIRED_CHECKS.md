# Reliability Required Checks

This record tracks required-check configuration for reliability enforcement on `main`.

## Configuration Record

- **Configuration location:** Branch protection (`repos/farce1/tinkerise/branches/main/protection`)
- **Branch:** `main`
- **Required check names:** `CI / Reliability Gates`
- **Configured by:** `farce1`
- **Configured at (UTC):** `2026-02-24T11:44:33Z`
- **Configuration evidence:** `gh api repos/farce1/tinkerise/branches/main/protection --jq '.required_status_checks.contexts'` returned `["CI / Reliability Gates"]`

## Verification Evidence

- A pull request with a failing `CI / Reliability Gates` check is blocked from merge.
- A pull request with a passing `CI / Reliability Gates` check is merge-eligible.

## Stability Note

Do not rename the `reliability-gates` CI job or its displayed check name after ruleset linkage.
