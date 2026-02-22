---
phase: 27-vhs-terminal-demos
plan: 02
subsystem: docs
tags: [vhs, terminal-demos, readme, starlight]
requires:
  - phase: 27-vhs-terminal-demos
    provides: canonical VHS tapes and render pipeline from plan 27-01
provides:
  - Committed GIF artifacts for scaffold, add, list, and doctor workflows
  - README hero terminal demo embed with command context
  - Dedicated docs gallery page with all workflow demos and captions
affects: [README onboarding, docs discoverability, phase-28-readme-overhaul]
tech-stack:
  added: []
  patterns: [public-media-gif-embedding, outcome-captioned-terminal-workflows]
key-files:
  created:
    - apps/docs/public/media/demos/scaffold-next-golden-path.gif
    - apps/docs/public/media/demos/add-quality-tooling.gif
    - apps/docs/public/media/demos/list-web-catalog.gif
    - apps/docs/public/media/demos/doctor-recovery-check.gif
    - apps/docs/src/content/docs/guides/terminal-demos.mdx
  modified:
    - README.md
    - apps/docs/src/content/docs/index.mdx
key-decisions:
  - "Keep README scoped to one hero GIF while publishing the full workflow set in docs."
  - "Use /media/demos/* paths in docs so assets resolve through Starlight public serving."
patterns-established:
  - "GIF artifacts are committed under apps/docs/public/media/demos and reused across README + docs."
  - "Terminal demo docs pair command framing with concise outcome-focused captions."
requirements-completed: [VIS-04]
duration: 1h 6m
completed: 2026-02-22
---

# Phase 27 Plan 02: VHS Terminal Demo Publishing Summary

**Phase 27 demo media now ships end-to-end: four generated GIFs are committed, one hero workflow is embedded in README, and the full gallery is discoverable from docs.**

## Performance

- **Duration:** 1h 6m
- **Started:** 2026-02-22T10:46:28Z
- **Completed:** 2026-02-22T11:53:01Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Generated and committed all required workflow GIF artifacts from canonical VHS tapes.
- Added a single high-signal README hero demo with meaningful alt text and command context.
- Published a dedicated terminal demo gallery page and linked it from the docs index for discoverability.

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate and commit all GIF artifacts from canonical tapes** - `86a7f4e` (feat)
2. **Task 2: Embed one hero GIF in README with concise command context** - `d427882` (docs)
3. **Task 3: Publish full workflow gallery in docs and verify build** - `5fb6c33` (docs)

Additional verification sync commit:

- `289167c` (fix): refresh rendered GIF binaries after final verification rerender

**Plan metadata:** pending

## Files Created/Modified
- `apps/docs/public/media/demos/scaffold-next-golden-path.gif` - Hero scaffold workflow artifact.
- `apps/docs/public/media/demos/add-quality-tooling.gif` - Enhancement workflow artifact.
- `apps/docs/public/media/demos/list-web-catalog.gif` - Scaffolder discovery workflow artifact.
- `apps/docs/public/media/demos/doctor-recovery-check.gif` - Reliability/recovery workflow artifact.
- `apps/docs/src/content/docs/guides/terminal-demos.mdx` - Full terminal demo gallery with framing and alt text.
- `apps/docs/src/content/docs/index.mdx` - Added discoverability links to the terminal demos page.
- `README.md` - Added one hero terminal demo embed and concise context.

## Decisions Made
- Kept README intentionally focused on one hero GIF to satisfy visibility without pre-empting Phase 28 README restructuring.
- Used a dedicated `guides/terminal-demos` page to present all four workflows with command-first framing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Re-render verification changed committed GIF binaries**
- **Found during:** Post-task final verification (`bun run demos:render`)
- **Issue:** Final rerender produced updated binary outputs, leaving committed media stale relative to verification run.
- **Fix:** Committed refreshed GIF binaries so repository artifacts exactly match the latest verified render output.
- **Files modified:** `apps/docs/public/media/demos/scaffold-next-golden-path.gif`, `apps/docs/public/media/demos/add-quality-tooling.gif`, `apps/docs/public/media/demos/list-web-catalog.gif`, `apps/docs/public/media/demos/doctor-recovery-check.gif`
- **Verification:** Re-ran `bun run demos:render` and `bun run docs:build` successfully after refresh.
- **Committed in:** `289167c`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Kept generated artifacts aligned with verified output; no scope expansion.

## Issues Encountered
- First full render verification attempt timed out in the shell tool before the fourth tape completed; rerunning with a longer timeout completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- VIS-04 is satisfied with committed media embedded in both docs and README.
- Phase 28 can proceed with broader README/documentation polish using these finalized demo assets.

---
*Phase: 27-vhs-terminal-demos*
*Completed: 2026-02-22*

## Self-Check: PASSED

- Verified `27-02-SUMMARY.md` exists on disk.
- Verified all task and verification-sync commits exist in git history.
