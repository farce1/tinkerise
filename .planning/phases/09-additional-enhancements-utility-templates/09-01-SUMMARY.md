---
phase: 09-additional-enhancements-utility-templates
plan: 01
subsystem: enhancements
tags: [docker, dockerfile, env, t3-env, zod, multi-stage, gitignore]

# Dependency graph
requires:
  - phase: 05-enhancement-system
    provides: defineEnhancement() pattern, EnhancementModule interface, _utils.ts helpers
  - phase: 06-core-enhancements-add-command
    provides: existing enhancement modules (eslint, prettier, husky, ci) as reference pattern
provides:
  - Docker enhancement module with framework-aware multi-stage Dockerfile generation
  - Env enhancement module with t3-env validation, .env/.env.example generation, .gitignore management
  - Both modules registered in enhancementRegistry for tinkerise add docker/env
affects: [09-02, 09-03, 09-04, 09-05, cli-add-command]

# Tech tracking
tech-stack:
  added: ["@t3-oss/env-core ^0.13.10 (user project)", "zod ^3.24.0 (user project)"]
  patterns: ["Docker framework detection beyond web FrameworkIds via filesystem inspection", "Robust .gitignore append with dedup and newline handling"]

key-files:
  created:
    - packages/core/src/enhancements/modules/docker.ts
    - packages/core/src/enhancements/modules/env.ts
    - packages/core/tests/enhancements/modules/docker.test.ts
    - packages/core/tests/enhancements/modules/env.test.ts
  modified:
    - packages/core/src/enhancements/version-map.ts
    - packages/core/src/enhancements/modules/index.ts

key-decisions:
  - "Docker module uses its own detectDockerFramework() instead of extending FrameworkId type -- keeps backend detection self-contained"
  - "Zod ^3.24.0 in version-map for user projects (t3-env requires Zod 3.x, tinkerise itself uses Zod 4)"
  - "Env module places env.ts in src/ when src/ directory exists, root otherwise"
  - "VITE_FRAMEWORKS Set for O(1) static build framework lookup"

patterns-established:
  - "DockerFramework type: extended framework detection beyond web FrameworkIds for Docker-relevant projects"
  - "addToGitignore pattern: robust line-by-line dedup with newline edge case handling"

requirements-completed: [ADD-05, ADD-06]

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 9 Plan 1: Docker & Env Enhancement Modules Summary

**Docker module generates framework-aware multi-stage Dockerfiles for 7 project types; Env module generates t3-env Zod validation with .gitignore management**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T10:16:04Z
- **Completed:** 2026-02-18T10:20:19Z
- **Tasks:** 2
- **Files modified:** 6 (plan scope)

## Accomplishments
- Docker enhancement module detects Next.js, Vite/SPA, FastAPI, Django, Go, Rust, and generic Node.js projects and generates optimized multi-stage Dockerfiles with framework-specific .dockerignore patterns
- Env enhancement module generates t3-env createEnv() validation with Zod schemas, .env and .env.example files, and robust .gitignore management
- Both modules registered in allEnhancementModules and enhancementRegistry, enabling `tinkerise add docker` and `tinkerise add env`
- 29 new unit tests (16 docker + 13 env) covering detect/install for all frameworks and edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Docker enhancement module** - `1aedcb0` (feat) -- docker.ts and docker.test.ts
2. **Task 2: Env enhancement module with registry update** - `7d84fa1` (feat) -- env.ts, env.test.ts, version-map.ts, index.ts

## Files Created/Modified
- `packages/core/src/enhancements/modules/docker.ts` - Docker enhancement with detectDockerFramework(), FRAMEWORK_DOCKER_MAP, multi-stage Dockerfiles for 7 frameworks
- `packages/core/src/enhancements/modules/env.ts` - Env enhancement with t3-env createEnv() generation, .env/.env.example, .gitignore append
- `packages/core/src/enhancements/version-map.ts` - Added @t3-oss/env-core ^0.13.10 and zod ^3.24.0
- `packages/core/src/enhancements/modules/index.ts` - Registered dockerModule and envModule in allEnhancementModules
- `packages/core/tests/enhancements/modules/docker.test.ts` - 16 tests for Docker detect/install across all frameworks
- `packages/core/tests/enhancements/modules/env.test.ts` - 13 tests for Env detect/install including .gitignore edge cases

## Decisions Made
- Docker module implements its own `detectDockerFramework()` rather than extending the `FrameworkId` type -- backend frameworks (FastAPI, Django, Go, Rust) are Docker-specific concerns not needed by other enhancement modules
- Zod version in dependencyVersionMap set to `^3.24.0` (Zod 3.x) for user projects because @t3-oss/env-core depends on Zod 3, even though tinkerise itself uses Zod 4
- Env module auto-detects `src/` directory existence to place `env.ts` in the appropriate location
- Used `VITE_FRAMEWORKS` Set for O(1) framework lookup instead of array includes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test assertion for generic Node.js Dockerfile**
- **Found during:** Task 1 (Docker module tests)
- **Issue:** Test checked for `node dist/index.js` as continuous string, but Dockerfile uses CMD JSON array format `["node", "dist/index.js"]` which breaks the substring match
- **Fix:** Changed assertion to check for `dist/index.js` (without `node` prefix)
- **Files modified:** packages/core/tests/enhancements/modules/docker.test.ts
- **Verification:** All 16 docker tests pass
- **Committed in:** a89fd34 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test assertion fix. No scope creep.

## Issues Encountered
- Pre-existing uncommitted files from a previous session (renovate, editorconfig, templates modules) were picked up by the pre-commit hook and included in the Task 1 commit. These are from other plans in phase 9 and do not affect correctness.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Docker and env modules complete and registered
- Enhancement registry now includes 10 modules total (eslint, prettier, husky, commitlint, ci, testing, docker, env, renovate, editorconfig)
- Ready for plans 09-02 through 09-05 (utility templates and remaining enhancements)

## Self-Check: PASSED

All 6 key files verified present on disk. Commits `1aedcb0` and `7d84fa1` verified in git log. All 487 core tests pass. Build succeeds.

---
*Phase: 09-additional-enhancements-utility-templates*
*Completed: 2026-02-18*
