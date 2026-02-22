---
phase: 27-vhs-terminal-demos
plan: 01
subsystem: docs
tags: [vhs, terminal-demos, ffmpeg, ttyd]
requires: []
provides:
  - Deterministic VHS workspace conventions and contributor render workflow
  - Canonical tape sources for scaffold, add, list, and doctor narratives
  - Single command render orchestration with prerequisite validation
affects: [README media updates, docs demo embedding, phase-27-plan-02]
tech-stack:
  added: []
  patterns: [vhs-tape-source-control, deterministic-render-order, single-command-demo-regeneration]
key-files:
  created:
    - demos/vhs/README.md
    - demos/vhs/scripts/render-all.sh
    - demos/vhs/tapes/scaffold-next-golden-path.tape
    - demos/vhs/tapes/add-quality-tooling.tape
    - demos/vhs/tapes/list-web-catalog.tape
    - demos/vhs/tapes/doctor-recovery-check.tape
  modified:
    - package.json
key-decisions:
  - "Render all demo tapes through one canonical script exposed as bun run demos:render."
  - "Use a shared 1280x720 Builtin Dark visual profile across every tape for consistent docs and README playback."
  - "Keep tapes deterministic with hidden setup/reset steps and single-take outcome-focused narratives."
patterns-established:
  - "VHS tapes reset state first, then show one workflow outcome per file."
  - "Render orchestration validates vhs/ffmpeg/ttyd before any tape execution."
requirements-completed: [VIS-03]
duration: 21 min
completed: 2026-02-22
---

# Phase 27 Plan 01: VHS Source Pipeline Summary

**Deterministic VHS tape sources now cover scaffold, add, list, and doctor workflows with a single render command for reproducible regeneration.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-02-22T11:22:50Z
- **Completed:** 2026-02-22T11:43:30Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Established `demos/vhs/` workspace conventions plus contributor docs for style, pacing, and deterministic setup.
- Added `demos/vhs/scripts/render-all.sh` with dependency checks and stable execution order, wired to `bun run demos:render`.
- Authored four canonical tape sources for scaffold, add, list, and doctor workflows aligned to phase narrative constraints.

## Task Commits

Each task was committed atomically:

1. **Task 1: Establish VHS workspace conventions and deterministic render entrypoint** - `cb0a396` (feat)
2. **Task 2: Author scaffold and add workflow tapes with curated prompt depth** - `dab9ffa` (feat)
3. **Task 3: Author list and doctor tapes including controlled recovery story** - `d613b18` (feat)

Additional auto-fix commit:

- `3abf463` (fix): quote doctor tape status lines to avoid shell redirection side effects

## Files Created/Modified
- `demos/vhs/README.md` - Workspace conventions, prerequisites, and render commands.
- `demos/vhs/scripts/render-all.sh` - Deterministic batch render script with tool checks and ordered tape execution.
- `demos/vhs/tapes/scaffold-next-golden-path.tape` - Next.js scaffold narrative tape source.
- `demos/vhs/tapes/add-quality-tooling.tape` - Enhancement add workflow tape source.
- `demos/vhs/tapes/list-web-catalog.tape` - List workflow discoverability tape source.
- `demos/vhs/tapes/doctor-recovery-check.tape` - Doctor issue-and-recovery tape source.
- `package.json` - Added `demos:render` script alias.

## Decisions Made
- Chose one canonical render entrypoint (`bun run demos:render`) to avoid per-demo command drift.
- Standardized all tapes on one visual profile and framing to keep README/docs presentation cohesive.
- Kept tape setup and cleanup hidden so visible output stays high-signal and repeatable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing VHS dependencies**
- **Found during:** Task 1 (render command verification)
- **Issue:** `vhs`, `ffmpeg`, and `ttyd` were unavailable, blocking render verification.
- **Fix:** Installed required tools via `brew install vhs ffmpeg ttyd`.
- **Files modified:** None (system tools only)
- **Verification:** `bun run demos:render -- --dry-run` and full `bun run demos:render` succeeded.
- **Committed in:** N/A (environment dependency)

**2. [Rule 1 - Bug] Fixed doctor tape output redirection side effect**
- **Found during:** Post-task full render verification
- **Issue:** Unquoted `>=` text in `echo` created unintended file `=3.10`.
- **Fix:** Quoted doctor status message lines in tape.
- **Files modified:** `demos/vhs/tapes/doctor-recovery-check.tape`
- **Verification:** `vhs demos/vhs/tapes/doctor-recovery-check.tape` and `bun run demos:render` succeeded without extra files.
- **Committed in:** `3abf463`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were required for deterministic execution and successful verification; no scope creep.

## Issues Encountered
- VHS regex wait matching proved brittle for command-output parsing in this environment, so tapes were simplified to deterministic command narratives with explicit pacing.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Source-controlled tape pipeline is in place and reproducibly renders all four required workflows.
- Phase 27 plan 02 can now focus on committing generated GIF assets and wiring README/docs embeds.

---
*Phase: 27-vhs-terminal-demos*
*Completed: 2026-02-22*

## Self-Check: PASSED

- Verified key files exist on disk.
- Verified all task and auto-fix commits exist in git history.
