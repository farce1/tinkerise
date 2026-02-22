---
phase: 29-deployment-release
plan: 02
subsystem: infra
tags: [github-actions, changesets, github-releases, automation]

requires:
  - phase: 29-deployment-release
    provides: Existing changesets publish workflow on main
provides:
  - Deterministic release note category source-of-truth config
  - Post-publish normalization script enforcing four required buckets
  - Release workflow wiring that normalizes notes only after published releases
affects: [release-automation, docs-changelog, distribution]

tech-stack:
  added: []
  patterns: [release-note normalization contract, post-publish workflow gating]

key-files:
  created:
    - .github/release.yml
    - scripts/release/normalize-release-notes.mjs
  modified:
    - package.json
    - .github/workflows/release.yml

key-decisions:
  - "Use .github/release.yml as label-driven category source-of-truth with Maintenance catch-all."
  - "Normalize the latest published release body into exactly Features, Fixes, Docs, Maintenance via idempotent script."

patterns-established:
  - "Post-publish release transformations must be gated by changesets published output."
  - "Release-note outputs are rebuilt deterministically from metadata-derived bullet signals."

requirements-completed: [DIST-02]

duration: 2 min
completed: 2026-02-22
---

# Phase 29 Plan 02: Release note categorization automation Summary

**Changesets publish now auto-creates releases and immediately normalizes each published release body into deterministic Features/Fixes/Docs/Maintenance sections.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T15:01:50Z
- **Completed:** 2026-02-22T15:03:15Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added `.github/release.yml` with deterministic category mappings for Features, Fixes, Docs, and Maintenance.
- Implemented `scripts/release/normalize-release-notes.mjs` to read release data, normalize bullets into required buckets, and patch release body idempotently.
- Wired normalization into `.github/workflows/release.yml` behind `steps.changesets.outputs.published == 'true'` while preserving Homebrew trigger behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add release category source-of-truth configuration** - `3666afe` (feat)
2. **Task 2: Implement release-note normalization script and root script entry** - `c70b0d5` (feat)
3. **Task 3: Wire normalization into release publish workflow** - `84a108e` (feat)

## Files Created/Modified
- `.github/release.yml` - Declarative generated-notes category mapping with Maintenance fallback.
- `scripts/release/normalize-release-notes.mjs` - Deterministic and idempotent release-note normalization script.
- `package.json` - Added reusable `ci:release:normalize` root script alias.
- `.github/workflows/release.yml` - Added post-publish normalization step gated on changesets publish output.

## Decisions Made
- Chose label/category configuration plus script normalization so category output remains stable even when upstream release body structure varies.
- Kept normalization as a post-publish action rather than replacing `changesets/action@v1`, preserving existing release and Homebrew flow behavior.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- DIST-02 automation is in place with deterministic category output and reusable workflow script entry.
- Ready for `29-03` to consume categorized release output for docs changelog surfacing.

---
*Phase: 29-deployment-release*
*Completed: 2026-02-22*

## Self-Check: PASSED
