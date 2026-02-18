---
phase: 10-distribution-release-automation
plan: 03
subsystem: infra
tags: [changesets, release, github-actions, homebrew, npm-publish]

requires:
  - phase: 10-distribution-release-automation
    provides: Wrapper package with all 4 packages ready for publishing
provides:
  - Changesets config with fixed versioning and beta pre-release mode
  - GitHub Actions release workflow (Version PRs + npm publish)
  - Homebrew tap formula and automation templates
affects: [distribution, release-pipeline]

tech-stack:
  added: [@changesets/cli, @changesets/changelog-github]
  patterns: [fixed-versioning, changesets-action, workflow-dispatch-trigger]

key-files:
  created:
    - .changeset/config.json
    - .changeset/pre.json
    - .github/workflows/release.yml
    - homebrew/tinkerise.rb
    - homebrew/update-formula.yml
  modified:
    - package.json

key-decisions:
  - "Fixed versioning array lists all 4 packages explicitly (glob @tinkerise/* doesn't match unscoped tinkerise)"
  - "ci:version runs bun update after changeset version (workspace:* workaround for Bun)"
  - "Beta pre-release mode active for initial development releases"
  - "Homebrew trigger only fires when changesets outputs.published == 'true'"
  - "Separate HOMEBREW_TAP_TOKEN PAT for cross-repo workflow_dispatch"

patterns-established:
  - "Fixed versioning: all 4 packages share one version, changeset version bumps all"
  - "Release pipeline: push to main -> Version PR or publish -> Homebrew trigger"
  - "Tap templates: formula + automation workflow stored in homebrew/ for reference"

requirements-completed: [QA-08, DIST-03, DIST-04]

duration: 3min
completed: 2026-02-18
---

# Plan 10-03: Changesets and Release Pipeline Summary

**Changesets with fixed versioning across 4 packages, GitHub Actions release workflow with npm publish, and Homebrew tap formula automation templates**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18
- **Completed:** 2026-02-18
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Changesets initialized with fixed versioning group containing all 4 packages
- Beta pre-release mode active for initial development releases
- Release workflow creates "Version Packages" PRs and publishes to npm on merge
- After successful publish, triggers Homebrew tap formula update via workflow_dispatch
- Homebrew formula template includes Node.js caveats and test block
- Tap automation workflow downloads tarball, computes sha256, creates auto-merged PR

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Changesets with fixed versioning** - `8b64572` (feat)
2. **Task 2: Release workflow and Homebrew templates** - `90ab9da` (feat)

## Files Created/Modified
- `.changeset/config.json` - Fixed versioning with all 4 packages and GitHub changelog
- `.changeset/pre.json` - Beta pre-release mode active
- `.changeset/README.md` - Changesets usage documentation
- `package.json` - Added changeset, ci:version, ci:publish scripts
- `.github/workflows/release.yml` - Complete release pipeline
- `homebrew/tinkerise.rb` - Formula template for tap repository
- `homebrew/update-formula.yml` - Tap automation workflow template

## Decisions Made
- Fixed versioning array lists all 4 packages explicitly (glob doesn't match unscoped)
- ci:version uses bun update workaround for workspace:* references
- Beta pre-release mode for initial development period
- HOMEBREW_TAP_TOKEN is a separate PAT with actions:write on tap repo (cross-repo auth)
- Homebrew trigger conditioned on published == 'true' (not Version PR creation)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
**Before first release, these secrets must be configured in GitHub:**
- `NPM_TOKEN` - npm access token for publishing
- `HOMEBREW_TAP_TOKEN` - GitHub PAT with `actions:write` permission on `tinkerise/homebrew-tap` repo

## Next Phase Readiness
- Release pipeline is fully configured and ready for first publish
- First release: create a changeset (`bunx changeset`), merge to main, workflow creates Version PR
- Homebrew tap repository needs to be created with the template files from `homebrew/`

---
*Phase: 10-distribution-release-automation*
*Completed: 2026-02-18*
