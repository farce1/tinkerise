---
phase: 28-readme-overhaul
plan: 01
subsystem: docs
tags: [readme, conversion, onboarding, docs]
requires:
  - phase: 27-vhs-terminal-demos
    provides: hero GIF asset for above-the-fold proof
  - phase: 25-docs-site-infrastructure
    provides: canonical docs URL and reference structure
provides:
  - Conversion-first README funnel: value, proof, action
  - npx-first quickstart path with concrete scaffold follow-up
  - Concise README sections that offload depth to docs links
affects: [repository-discovery, first-run-onboarding, phase-29-release-positioning]
tech-stack:
  added: []
  patterns: [npx-first-readme-flow, docs-forward-detail-compression]
key-files:
  created: []
  modified:
    - README.md
key-decisions:
  - "Keep README as a conversion hook, not a full reference manual."
  - "Anchor trust messaging to official-scaffolder wrapping with source-validated counts."
patterns-established:
  - "Top-of-README order is value proposition -> hero GIF -> quickstart -> docs CTA -> install alternatives."
  - "Framework and enhancement depth is summarized in README and delegated to docs pages."
requirements-completed: [VIS-01, VIS-02]
duration: 2 min
completed: 2026-02-22
---

# Phase 28 Plan 01: README Conversion Funnel Summary

**README now ships as a concise landing page with a hero scaffold GIF, npx-first quickstart path, and docs-forward navigation for deeper detail.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T13:35:37Z
- **Completed:** 2026-02-22T13:37:50Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Rebuilt the above-the-fold flow into value -> proof -> action with the hero GIF directly before commands.
- Moved README body to high-signal capability framing with accurate breadth counts and minimal command surface.
- Verified core conversion links and trust numbers against source-of-truth files before finalizing copy.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite above-the-fold conversion funnel with locked hierarchy** - `08efce7` (docs)
2. **Task 2: Compress remaining content into feature-first, docs-linked sections** - `ccb6173` (docs)
3. **Task 3: Verify rendering, link integrity, and requirement alignment** - `c74fd98` (docs)

**Plan metadata:** pending

## Files Created/Modified
- `README.md` - Rewritten into a conversion-oriented README with concise docs-linked structure.

## Decisions Made
- Kept `npx tinkerise` as the first command and made concrete follow-up scaffolding command npx-prefixed for copy-paste reliability.
- Reduced in-README catalogs/tables and moved framework/enhancement/command depth to docs URLs.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- VIS-01 and VIS-02 are satisfied in `README.md` with proof, quickstart, and docs CTA coverage.
- Phase 28 is complete and ready for milestone transition work in Phase 29.

---
*Phase: 28-readme-overhaul*
*Completed: 2026-02-22*

## Self-Check: PASSED

- Verified `.planning/phases/28-readme-overhaul/28-01-SUMMARY.md` exists on disk.
- Verified task commits `08efce7`, `ccb6173`, and `c74fd98` exist in git history.
