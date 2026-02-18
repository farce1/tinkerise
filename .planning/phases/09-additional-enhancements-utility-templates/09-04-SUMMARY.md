---
phase: 09-additional-enhancements-utility-templates
plan: 04
subsystem: templates
tags: [mcp, modelcontextprotocol, typescript, tsup, zod, commander, scaffolder]

# Dependency graph
requires:
  - phase: 01-monorepo-cli-skeleton
    provides: "CLI entry point, Commander.js program, monorepo structure"
  - phase: 05-enhancement-module-system
    provides: "Enhancement module pattern, dependencyVersionMap"
provides:
  - "generateMcpServer template generator in @tinkerise/core"
  - "TemplateOptions shared interface for all template generators"
  - "writeProjectFile, runInstall, printTemplateSummary shared helpers"
  - "TEMPLATE_METADATA array for list command display"
  - "registerMcpCommand CLI command for tinkerise mcp"
  - "Templates section in tinkerise list output"
affects: [09-05-cli-lib-templates]

# Tech tracking
tech-stack:
  added: ["@modelcontextprotocol/sdk ^1.26.0 (generated)", "zod ^3.24.0 (generated)"]
  patterns: ["Template generator pattern with shared helpers", "Top-level CLI command registration for templates"]

key-files:
  created:
    - packages/core/src/templates/types.ts
    - packages/core/src/templates/shared.ts
    - packages/core/src/templates/mcp.ts
    - packages/core/src/templates/index.ts
    - packages/cli/src/commands/mcp.ts
    - packages/core/tests/templates/mcp.test.ts
    - packages/cli/tests/commands/mcp.test.ts
  modified:
    - packages/core/src/index.ts
    - packages/cli/src/index.ts
    - packages/cli/src/commands/list.ts
    - packages/cli/tests/commands/list.test.ts
    - packages/core/tests/enhancements/define.test.ts

key-decisions:
  - "Template generators use shared helpers (writeProjectFile, runInstall, printTemplateSummary) for DRY reuse across mcp/cli/lib"
  - "TEMPLATE_METADATA includes all 3 entries upfront (mcp, cli, lib) so list shows them before generators exist"
  - "Templates always show checkmark in list (no prerequisite checks -- only need Node.js)"

patterns-established:
  - "Template generator pattern: async function generating package.json via JSON.stringify, config files, source files, optional install, summary card"
  - "Top-level command registration via registerXCommand(program) pattern for template commands"

requirements-completed: [UTIL-01]

# Metrics
duration: 6min
completed: 2026-02-18
---

# Phase 09 Plan 04: MCP Server Template Summary

**MCP server template scaffolder with shared template infrastructure, CLI command, and list integration**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-18T10:16:06Z
- **Completed:** 2026-02-18T10:21:58Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- MCP server generator creates complete project with package.json, tsconfig, tsup config, src/index.ts with example tool, README
- Shared template infrastructure (types, helpers, metadata) established for reuse by CLI and lib templates
- `tinkerise mcp my-server` registered as top-level CLI command with --package-manager and --no-install flags
- Templates section added to `tinkerise list` output showing mcp, cli, lib entries
- 22 new tests (14 core + 8 CLI) all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared template infrastructure and MCP server generator** - `6617a59` (feat)
   - Note: Template source files committed in `1aedcb0` due to parallel plan execution; test fix in `6617a59`
2. **Task 2: MCP CLI command registration and list command integration** - `f6e819a` (feat)
   - Note: CLI files committed in `f6e819a` alongside other plan's barrel exports due to parallel execution

## Files Created/Modified
- `packages/core/src/templates/types.ts` - TemplateOptions shared interface
- `packages/core/src/templates/shared.ts` - writeProjectFile, runInstall, printTemplateSummary helpers
- `packages/core/src/templates/mcp.ts` - generateMcpServer template generator
- `packages/core/src/templates/index.ts` - Barrel export with TEMPLATE_METADATA
- `packages/core/src/index.ts` - Re-exports templates from core barrel
- `packages/cli/src/commands/mcp.ts` - registerMcpCommand CLI command
- `packages/cli/src/index.ts` - Register mcp command, add help example
- `packages/cli/src/commands/list.ts` - Templates section in list output
- `packages/core/tests/templates/mcp.test.ts` - 14 MCP generator unit tests
- `packages/cli/tests/commands/mcp.test.ts` - 8 CLI command tests
- `packages/cli/tests/commands/list.test.ts` - Added TEMPLATE_METADATA to mock
- `packages/core/tests/enhancements/define.test.ts` - Fixed dependencyVersionMap count

## Decisions Made
- Template generators use shared helpers (writeProjectFile, runInstall, printTemplateSummary) for DRY reuse across mcp/cli/lib
- TEMPLATE_METADATA includes all 3 entries upfront so list shows them before generators exist
- Templates always show checkmark in list (no prerequisite checks needed -- only Node.js required)
- MCP generated project uses ESM-only format (per SDK requirements)
- Generated src/index.ts uses v1 SDK import paths (@modelcontextprotocol/sdk/server/mcp.js)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed dependencyVersionMap test count**
- **Found during:** Task 1 (commit blocked by pre-commit hook)
- **Issue:** `define.test.ts` expected 16 entries but map now has 18 (added @t3-oss/env-core and zod in prior plans 09-01/09-02)
- **Fix:** Added '@t3-oss/env-core' and 'zod' to expectedKeys array
- **Files modified:** packages/core/tests/enhancements/define.test.ts
- **Verification:** All 474 core tests pass
- **Committed in:** 6617a59

**2. [Rule 3 - Blocking] Fixed list.test.ts mock missing TEMPLATE_METADATA**
- **Found during:** Task 2 (commit blocked by pre-commit hook)
- **Issue:** Existing list.test.ts mocked @tinkerise/core without TEMPLATE_METADATA export
- **Fix:** Added TEMPLATE_METADATA array to vi.mock factory
- **Files modified:** packages/cli/tests/commands/list.test.ts
- **Verification:** All 6 list tests pass
- **Committed in:** f6e819a

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary to unblock pre-commit hooks. No scope creep.

## Issues Encountered
- Parallel plan execution caused commits to include files from multiple plans in single commits (1aedcb0, f6e819a). All files are correctly committed and verified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Shared template infrastructure ready for CLI tool and npm library generators (plan 09-05)
- TEMPLATE_METADATA already includes cli and lib entries
- writeProjectFile, runInstall, printTemplateSummary helpers available for reuse
- registerXCommand pattern established for adding more template commands

## Self-Check: PASSED

All 7 key files verified on disk. All 3 commit hashes found in git log.

---
*Phase: 09-additional-enhancements-utility-templates*
*Completed: 2026-02-18*
