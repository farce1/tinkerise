---
phase: 09-additional-enhancements-utility-templates
plan: 05
subsystem: templates
tags: [cli, commander, npm, library, tsup, typescript, vitest, cjs, esm, scaffolder]

# Dependency graph
requires:
  - phase: 09-additional-enhancements-utility-templates
    plan: 04
    provides: "Shared template infrastructure (types, helpers, metadata), MCP template pattern"
  - phase: 01-monorepo-cli-skeleton
    provides: "CLI entry point, Commander.js program, monorepo structure"
provides:
  - "generateCliTool template generator in @tinkerise/core"
  - "generateLib template generator in @tinkerise/core"
  - "registerCliToolCommand CLI command for tinkerise cli"
  - "registerLibCommand CLI command for tinkerise lib"
  - "Complete utility template suite (mcp, cli, lib)"
affects: []

# Tech tracking
tech-stack:
  added: ["commander ^13.0.0 (generated)", "vitest ^3.1.0 (generated)"]
  patterns: ["CLI tool template with Commander.js and bin entry", "npm library template with dual CJS/ESM and Vitest"]

key-files:
  created:
    - packages/core/src/templates/cli-tool.ts
    - packages/core/src/templates/lib.ts
    - packages/cli/src/commands/cli-tool.ts
    - packages/cli/src/commands/lib.ts
    - packages/core/tests/templates/cli-tool.test.ts
    - packages/core/tests/templates/lib.test.ts
    - packages/cli/tests/commands/cli-tool.test.ts
    - packages/cli/tests/commands/lib.test.ts
  modified:
    - packages/core/src/templates/index.ts
    - packages/core/src/index.ts
    - packages/cli/src/index.ts

key-decisions:
  - "CLI tool template uses Commander.js ^13.0.0 with one example greet command and bin entry"
  - "Library template uses dual CJS/ESM format with types field first in exports for TypeScript resolution"
  - "Library template includes Vitest ^3.1.0, declarationMap, sourceMap for library consumers"

patterns-established:
  - "CLI tool template: Commander.js entry with bin, tsup ESM-only build, example command"
  - "npm library template: dual CJS/ESM tsup build, Vitest config, prepublishOnly, proper exports"

requirements-completed: [UTIL-02, UTIL-03]

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 09 Plan 05: CLI Tool & npm Library Templates Summary

**CLI tool scaffolder with Commander.js/tsup and npm library scaffolder with dual CJS/ESM build, Vitest, and publish-ready package.json exports**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T10:25:15Z
- **Completed:** 2026-02-18T10:29:02Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- CLI tool generator creates Commander.js project with bin entry, tsup ESM build, and example greet command
- npm library generator creates publish-ready package with dual CJS/ESM, Vitest, proper exports (types first), declarationMap, sourceMap
- Both templates adapt to --package-manager flag and support --no-install
- `tinkerise cli my-tool` and `tinkerise lib my-lib` registered as top-level CLI commands
- 43 new tests (27 core + 16 CLI) all passing
- Complete utility template suite now available: mcp, cli, lib

## Task Commits

Each task was committed atomically:

1. **Task 1: CLI tool template generator and npm library template generator** - `6eda4c9` (feat)
2. **Task 2: Register CLI and lib commands in CLI entry point** - `e34a6a2` (feat)

## Files Created/Modified
- `packages/core/src/templates/cli-tool.ts` - generateCliTool template generator
- `packages/core/src/templates/lib.ts` - generateLib template generator
- `packages/core/src/templates/index.ts` - Added barrel exports for generateCliTool and generateLib
- `packages/core/src/index.ts` - Re-exports new generators from core barrel
- `packages/cli/src/commands/cli-tool.ts` - registerCliToolCommand CLI command
- `packages/cli/src/commands/lib.ts` - registerLibCommand CLI command
- `packages/cli/src/index.ts` - Register cli and lib commands, add help examples
- `packages/core/tests/templates/cli-tool.test.ts` - 12 CLI tool generator unit tests
- `packages/core/tests/templates/lib.test.ts` - 15 library generator unit tests
- `packages/cli/tests/commands/cli-tool.test.ts` - 8 CLI command tests
- `packages/cli/tests/commands/lib.test.ts` - 8 CLI command tests

## Decisions Made
- CLI tool template uses Commander.js ^13.0.0 with one example greet command and bin entry
- Library template uses dual CJS/ESM format (["esm", "cjs"]) with types field first in exports for TypeScript resolution
- Library template includes Vitest ^3.1.0, declarationMap, and sourceMap for library consumers
- Library template has prepublishOnly script for safe npm publish workflow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 5 plans in Phase 09 complete
- Full utility template suite available: mcp, cli, lib
- Phase 09 (Additional Enhancements & Utility Templates) fully complete
- Ready for Phase 10

## Self-Check: PASSED

All 11 key files verified on disk. Both commit hashes (6eda4c9, e34a6a2) found in git log.

---
*Phase: 09-additional-enhancements-utility-templates*
*Completed: 2026-02-18*
