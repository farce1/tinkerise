---
phase: 11-cross-phase-integration-wiring
plan: 01
subsystem: cli
tags: [config, preset, commander, scaffold, integration-wiring]

# Dependency graph
requires:
  - phase: 08-configuration-system
    provides: resolveConfig, loadPreset, mergeConfigChain, TinkeriseUserConfig, PresetData
  - phase: 03-scaffold-pipeline
    provides: scaffold command entry points, detectPackageManager, buildUserFlags
provides:
  - resolveConfig() called in all scaffold entry points (interactive, category, direct)
  - --preset flag loads preset data and feeds scaffold.framework/flags into prompt flow
  - --verbose flag controls config-override messaging
  - Config packageManager as fallback when no lockfile and no CLI flag
  - Config typescript pre-selects TypeScript option in buildUserFlags
  - Preset scaffold.framework pre-fills framework prompt
  - Preset scaffold.flags merge into preselected options
affects: [12-orphaned-requirements-coverage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "resolveConfigAndPreset helper for config+preset resolution in all entry modes"
    - "mergePresetFlags helper for preset scaffold.flags to preselected options conversion"
    - "Config PM applies only when detectPackageManager returns source 'default'"
    - "Preset framework ignored in category flow when categories do not match"

key-files:
  created:
    - packages/cli/tests/commands/scaffold-config-preset.test.ts
  modified:
    - packages/cli/src/commands/scaffold.ts
    - packages/cli/src/index.ts
    - packages/cli/tests/commands/scaffold.test.ts
    - packages/cli/tests/commands/scaffold-wiring.test.ts

key-decisions:
  - "Config packageManager only applies when source === 'default' (no lockfile, no flag) -- lockfile always wins"
  - "Config typescript is a pre-selection layer in buildUserFlags, not an override -- CLI flags still win"
  - "Preset framework ignored in category flow when preset category does not match user-provided category (Pitfall 2)"
  - "Verbose flag controls config-override messaging (Overriding config X -> Y only shown with --verbose)"
  - "resolveConfigAndPreset helper calls resolveConfig + loadPreset once per entry mode for consistent integration"

patterns-established:
  - "resolveConfigAndPreset: single helper resolving config+preset tuple for all scaffold entry modes"
  - "mergePresetFlags: converts preset scaffold.flags boolean entries to preselected option array"
  - "Config PM fallback: check pmResult.source before applying config value (never pass config as flagValue)"

requirements-completed: [CFG-03, PRE-02]

# Metrics
duration: 6min
completed: 2026-02-18
---

# Phase 11 Plan 01: Config-to-Scaffold + Preset-to-Scaffold Wiring Summary

**resolveConfig() and --preset flag wired into all scaffold entry points with config PM fallback, typescript pre-selection, and preset framework/flags pre-fill**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-18T14:07:19Z
- **Completed:** 2026-02-18T14:13:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Wired resolveConfig() into all three scaffold entry modes (interactive, category, direct) so config actually affects package manager detection and TypeScript pre-selection
- Added --preset and --verbose global options to Commander, with preset loading feeding scaffold.framework/flags/category into the prompt flow
- Added 15 focused unit tests verifying the complete override chain (CLI > preset > config > default)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire resolveConfig and --preset/--verbose into scaffold command** - `fff151a` (feat)
2. **Task 2: Add unit tests for config and preset scaffold integration** - `faf487e` (test)

## Files Created/Modified
- `packages/cli/src/commands/scaffold.ts` - Added resolveConfig/loadPreset imports, resolveConfigAndPreset helper, mergePresetFlags helper, config PM fallback in resolvePackageManager, config TS pre-selection in buildUserFlags, config param in executePipeline, preset/config wiring in all three entry modes
- `packages/cli/src/index.ts` - Added --preset and --verbose global options, added --preset help example
- `packages/cli/tests/commands/scaffold.test.ts` - Updated mocks with resolveConfig/loadPreset for existing tests
- `packages/cli/tests/commands/scaffold-wiring.test.ts` - Updated mocks with resolveConfig/loadPreset for existing tests
- `packages/cli/tests/commands/scaffold-config-preset.test.ts` - New test file with 15 tests covering config PM fallback, lockfile override, CLI override, verbose messaging, config typescript pre-selection, preset framework pre-fill, preset category mismatch, preset flags merge, resolveConfig called in all entry modes

## Decisions Made
- Config PM only applies when detectPackageManager returns source 'default' -- never passed as flagValue to avoid overriding lockfile detection
- Config typescript is a pre-selection in buildUserFlags that applies when CLI --typescript not explicitly set
- Preset framework is ignored in category flow when preset.scaffold.category does not match user-provided category (prevents cross-category misapplication)
- Verbose flag controls config-override messaging ("Overriding config (X -> Y)" only shown with --verbose)
- resolveConfigAndPreset is a single helper called once per entry mode for clean, consistent integration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated existing test mocks to include resolveConfig and loadPreset**
- **Found during:** Task 1 (after modifying scaffold.ts)
- **Issue:** Existing test files for scaffold.test.ts and scaffold-wiring.test.ts had incomplete @tinkerise/core mocks that did not include resolveConfig or loadPreset, causing all tests to fail with "No export defined on mock" errors
- **Fix:** Added mockResolveConfig and mockLoadPreset to vi.hoisted in both test files, added them to the @tinkerise/core vi.mock factory, added mockLogInfo to @clack/prompts mock, and set default mock values in all beforeEach blocks
- **Files modified:** packages/cli/tests/commands/scaffold.test.ts, packages/cli/tests/commands/scaffold-wiring.test.ts
- **Verification:** All existing tests pass (176 -> 191 with new tests)
- **Committed in:** fff151a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to keep existing tests passing after adding new imports to scaffold.ts. No scope creep.

## Issues Encountered
None beyond the expected mock update documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Config-to-scaffold wiring complete -- resolveConfig() feeds into PM detection and flag building
- Preset-to-scaffold wiring complete -- --preset flag loads preset data and feeds into prompt flow
- Ready for Plan 02 (session context persistence, list enhancement display)

## Self-Check: PASSED

All files verified present. All commit hashes found in git log.

---
*Phase: 11-cross-phase-integration-wiring*
*Completed: 2026-02-18*
