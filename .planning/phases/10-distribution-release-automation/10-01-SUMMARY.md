---
phase: 10-distribution-release-automation
plan: 01
subsystem: infra
tags: [npm, publishing, wrapper, bin, postinstall]

requires:
  - phase: 09-additional-enhancements-utility-templates
    provides: All CLI commands and enhancement modules to publish
provides:
  - publishConfig.access="public" on all scoped packages
  - Unscoped tinkerise wrapper package with bin entries
  - Postinstall welcome message for global installs
affects: [10-02, 10-03, distribution]

tech-stack:
  added: []
  patterns: [thin-wrapper-reexport, global-install-detection]

key-files:
  created:
    - packages/tinkerise/package.json
    - packages/tinkerise/bin.mjs
    - packages/tinkerise/postinstall.mjs
  modified:
    - packages/cli/package.json
    - packages/core/package.json
    - packages/shared/package.json

key-decisions:
  - "Wrapper package is plain .mjs files -- no build step, no TypeScript, no tsup"
  - "postinstall uses npm_config_global/npm_config_location env vars for global detection"
  - "postinstall skips in CI to keep logs clean"
  - "Version not displayed in postinstall to avoid import errors during install lifecycle"

patterns-established:
  - "Thin wrapper pattern: unscoped package re-exports scoped package via dynamic import"
  - "Global-only postinstall: check env vars, skip in CI, purely informational"

requirements-completed: [DIST-01, DIST-02]

duration: 3min
completed: 2026-02-18
---

# Plan 10-01: npm publishConfig and Wrapper Package Summary

**All scoped packages configured for npm public publishing with thin unscoped tinkerise wrapper providing bin entries for tinkerise and tk**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18
- **Completed:** 2026-02-18
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- All three scoped packages have publishConfig.access="public" for npm publishing
- Unscoped tinkerise wrapper package created with bin entries for both `tinkerise` and `tk`
- Postinstall welcome message displays for global installs only (skips CI and npx)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add publishConfig and create wrapper package** - `d3ce676` (feat)
2. **Task 2: Postinstall welcome message** - included in Task 1 commit (single logical unit)

## Files Created/Modified
- `packages/cli/package.json` - Added publishConfig.access="public"
- `packages/core/package.json` - Added publishConfig.access="public"
- `packages/shared/package.json` - Added publishConfig.access="public"
- `packages/tinkerise/package.json` - Unscoped wrapper with bin entries and workspace dependency
- `packages/tinkerise/bin.mjs` - Thin re-export entry point (shebang + import)
- `packages/tinkerise/postinstall.mjs` - Welcome message for global installs only

## Decisions Made
- Wrapper package uses plain .mjs files with no build step (not a TypeScript package)
- postinstall uses npm_config_global/npm_config_location env vars for global detection
- Version not shown in postinstall to avoid import errors during install lifecycle
- postinstall is purely informational -- CLI works identically whether it runs or not

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All packages ready for npm publishing
- Wrapper package enables `npx tinkerise` and `npm install -g tinkerise`
- Homebrew formula can reference the unscoped tinkerise package

---
*Phase: 10-distribution-release-automation*
*Completed: 2026-02-18*
