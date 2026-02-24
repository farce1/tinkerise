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

- **Policy proof (required check configured on `main`):**
  - Branch protection API: `https://api.github.com/repos/farce1/tinkerise/branches/main/protection`
  - Required contexts response includes `CI / Reliability Gates`.
- **Failing reliability evidence (blocks merge eligibility when required):**
  - PR reference: `https://github.com/farce1/tinkerise/pull/12`
  - Failing workflow run: `https://github.com/farce1/tinkerise/actions/runs/22309900770` (`conclusion: failure`)
- **Passing reliability evidence (allows merge eligibility when required):**
  - PR reference: `https://github.com/farce1/tinkerise/pull/12`
  - Passing workflow run: `https://github.com/farce1/tinkerise/actions/runs/22310216264` (`conclusion: success`)

## Stability Note

Do not rename the `reliability-gates` CI job or its displayed check name after ruleset linkage.
