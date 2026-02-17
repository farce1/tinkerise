---
phase: 06-core-enhancements-add-command
plan: 01
subsystem: enhancements
tags: [eslint, flat-config, execa, enhancement-modules]

requires:
  - phase: 05-enhancement-module-system
    provides: defineEnhancement, types, version-map, executor pipeline
provides:
  - _utils.ts shared helpers (installPackages, writeConfigFile, addScript, readPackageJson)
  - ESLint flat config enhancement module with framework detection
  - globals package in dependencyVersionMap
affects: [06-02, 06-03, 06-04]

tech-stack:
  added: [globals]
  patterns: [enhancement module pattern with detect/install, PM-aware installPackages helper]

key-files:
  created:
    - packages/core/src/enhancements/modules/_utils.ts
    - packages/core/src/enhancements/modules/eslint.ts
    - packages/core/tests/enhancements/modules/eslint.test.ts
  modified:
    - packages/core/src/enhancements/version-map.ts
    - packages/core/tests/enhancements/define.test.ts

key-decisions:
  - "FRAMEWORK_ESLINT_MAP as static config object mapping framework IDs to packages/imports/spreads"
  - "Vue/Nuxt with TypeScript gets extra SFC parser config block (tseslint.parser)"
  - "React frameworks (next, react, remix) get settings.react.version: 'detect'"
  - "Config filename: .js for type:module, .mjs otherwise"

patterns-established:
  - "Enhancement module pattern: defineEnhancement({ id, name, description, dependsOn, detect, install })"
  - "Shared _utils.ts helpers: installPackages/writeConfigFile/addScript/readPackageJson"
  - "Version from dependencyVersionMap formatted as pkg@version for installs"

requirements-completed: [ADD-01]

duration: 4min
completed: 2026-02-17
---

# Plan 06-01: Shared Module Helpers & ESLint Enhancement Summary

**Shared installPackages/writeConfigFile/addScript helpers and ESLint flat config module with framework-specific plugins for React/Vue/Svelte/Astro**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T22:44:00Z
- **Completed:** 2026-02-17T22:48:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created _utils.ts with 4 shared helpers used by all enhancement modules
- ESLint module detects 9 config file locations + package.json eslintConfig field
- ESLint module generates framework-appropriate flat config (React, Vue, Nuxt, Svelte, Astro)
- 10 unit tests pass covering detect and install for multiple frameworks

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Shared helpers, ESLint module, and unit tests** - `6a3feff` (feat)

## Files Created/Modified
- `packages/core/src/enhancements/modules/_utils.ts` - installPackages, writeConfigFile, addScript, readPackageJson
- `packages/core/src/enhancements/modules/eslint.ts` - ESLint flat config enhancement module
- `packages/core/src/enhancements/version-map.ts` - Added globals ^17.3.0
- `packages/core/tests/enhancements/modules/eslint.test.ts` - 10 unit tests
- `packages/core/tests/enhancements/define.test.ts` - Updated expectedKeys with globals

## Decisions Made
- FRAMEWORK_ESLINT_MAP as static config object (not dynamic lookup)
- Vue SFC parser config block only added when TypeScript is present
- defineConfig from eslint/config used as wrapper (ESLint 9+ pattern)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated define.test.ts expectedKeys**
- **Found during:** Task 1 (pre-commit hook)
- **Issue:** Adding globals to version-map changed key count from 15 to 16
- **Fix:** Added 'globals' to expectedKeys array in define.test.ts
- **Verification:** All 245 core tests pass
- **Committed in:** 6a3feff (combined with task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test fixture update necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- _utils.ts helpers ready for Prettier and Husky modules (Plan 06-02)
- ESLint module pattern established for all future modules

---
*Phase: 06-core-enhancements-add-command*
*Completed: 2026-02-17*
