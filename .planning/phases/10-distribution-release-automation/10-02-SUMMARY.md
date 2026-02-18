---
phase: 10-distribution-release-automation
plan: 02
subsystem: infra
tags: [update, self-update, install-method, version-check, cache]

requires:
  - phase: 10-distribution-release-automation
    provides: Wrapper package with bin entries for install detection
provides:
  - tinkerise update command with install-method detection
  - Background update check with 24h file cache
  - Update nudge after command execution
affects: [distribution, cli-ux]

tech-stack:
  added: [semver]
  patterns: [install-method-detection, background-update-check, file-cache]

key-files:
  created:
    - packages/cli/src/utils/install-method.ts
    - packages/cli/src/commands/update.ts
    - packages/cli/src/utils/update-check.ts
  modified:
    - packages/cli/src/index.ts
    - packages/cli/package.json

key-decisions:
  - "Used node:child_process execFileSync instead of execa to avoid CJS cross-spawn bundling issue with tsup ESM"
  - "Inline global install detection via npm prefix -g instead of is-installed-globally package (avoids bundling issues)"
  - "semver added as direct CLI dependency for version comparison"
  - "Update check fires before program.parse() and collects result after (non-blocking)"
  - "program.parse() changed to program.parseAsync() for proper async command handling"

patterns-established:
  - "Install-method detection: Cellar path for homebrew, npm_execpath/_npx for npx, npm prefix for global"
  - "Background check pattern: fire promise early, await after command completes, swallow errors"
  - "XDG_CACHE_HOME with fallback to ~/.cache for cache directory"

requirements-completed: [DIST-05, DIAG-03]

duration: 4min
completed: 2026-02-18
---

# Plan 10-02: Update Command and Background Check Summary

**Install-method detection distinguishing homebrew/npm-global/npx/unknown with self-update command and non-blocking 24h-cached version check nudge**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18
- **Completed:** 2026-02-18
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Install-method detection correctly identifies homebrew, npm-global, npx, and unknown installations
- `tinkerise update` command runs appropriate update mechanism for detected install method
- Background update check with 24-hour file cache at ~/.cache/tinkerise/update-check.json
- Update nudge appears as one-line message after command output when newer version available
- Respects TINKERISE_NO_UPDATE_CHECK=1 environment variable for opt-out

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Install-method detection, update command, and background check** - `d78d828` (feat)

## Files Created/Modified
- `packages/cli/src/utils/install-method.ts` - Detects homebrew, npm-global, npx, unknown
- `packages/cli/src/commands/update.ts` - tinkerise update command with method-appropriate actions
- `packages/cli/src/utils/update-check.ts` - Background version check with 24h cache and nudge display
- `packages/cli/src/index.ts` - Registered update command, integrated background check, parseAsync
- `packages/cli/package.json` - Added semver dependency

## Decisions Made
- Used execFileSync from node:child_process instead of execa (CJS cross-spawn causes bundling failure with tsup ESM)
- Inline global install detection via `npm prefix -g` instead of `is-installed-globally` package (avoids dependency chain bundling issues)
- Added semver as direct dependency to @tinkerise/cli for version comparison
- program.parse() changed to program.parseAsync() for proper async command flow with update nudge
- Fixed pre-existing typecheck error in preset.ts validate callback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced execa with execFileSync in update command**
- **Found during:** Task 1 (Update command implementation)
- **Issue:** execa depends on cross-spawn (CJS), which cannot be bundled by tsup in ESM format -- causes "Dynamic require of child_process is not supported" runtime error
- **Fix:** Used node:child_process execFileSync with stdio: 'inherit' instead
- **Files modified:** packages/cli/src/commands/update.ts
- **Verification:** Build succeeds, dist/index.js runs without errors
- **Committed in:** d78d828

**2. [Rule 3 - Blocking] Replaced is-installed-globally with inline detection**
- **Found during:** Task 1 (Install-method detection)
- **Issue:** is-installed-globally depends on global-directory which has CJS transitive dependencies causing same bundling failure
- **Fix:** Inline implementation using npm prefix -g and path comparison
- **Files modified:** packages/cli/src/utils/install-method.ts
- **Verification:** Build succeeds, detection logic works correctly
- **Committed in:** d78d828

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for functional bundled output. No scope creep.

## Issues Encountered
- CJS dependency chain (execa -> cross-spawn, is-installed-globally -> global-directory) incompatible with tsup ESM bundling; resolved by using Node.js built-ins instead

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Update command ready for use after npm publishing
- Background check will activate once package is published to npm registry
- Version comparison uses semver for proper pre-release handling

---
*Phase: 10-distribution-release-automation*
*Completed: 2026-02-18*
