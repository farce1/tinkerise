---
phase: 04-web-framework-scaffolders
plan: 02
subsystem: ui, registry
tags: [clack-prompts, vite, t3, metadata, summary-card, variant-select]

# Dependency graph
requires:
  - phase: 03-interactive-ux
    provides: "@clack/prompts patterns, flag-if-provided/prompt-if-omitted, cancel handling"
provides:
  - "selectViteTemplate() prompt with 8 templates and flag bypass"
  - "resolveViteTemplate() pure function for TypeScript suffix merging"
  - "selectT3Components() multiselect prompt with 5 components and flag bypass"
  - "SCAFFOLDER_METADATA map with display info for all 7 frameworks"
  - "tinkeriseSummaryCard() enhanced post-scaffold output with suggestions"
affects: [04-03, 04-04, 04-05, 05-enhancement-scaffolders]

# Tech tracking
tech-stack:
  added: []
  patterns: [variant-selection-prompts, scaffolder-metadata-map, summary-card-pattern]

key-files:
  created:
    - packages/cli/src/prompts/variant-select.ts
    - packages/core/src/registry/metadata.ts
    - packages/cli/tests/prompts/variant-select.test.ts
    - packages/core/tests/registry/metadata.test.ts
  modified:
    - packages/core/src/executor/framing.ts
    - packages/core/src/executor/index.ts
    - packages/core/src/index.ts
    - packages/core/tests/executor/framing.test.ts

key-decisions:
  - "Separated metadata map from Zod registry schema to keep display concerns from execution"
  - "Used 'as const' with 'in' operator for type-safe hint access on optional properties"

patterns-established:
  - "Variant selection: flag-if-provided, prompt-if-omitted pattern from Phase 3 applied to template/component selection"
  - "Metadata separation: display info (names, descriptions, suggestions) in metadata.ts, execution info in registry schema"
  - "Summary card: tinkeriseSummaryCard() replaces tinkeriseSummary() as enhanced post-scaffold output"

requirements-completed: [WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07]

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 04 Plan 02: Variant Selection & Metadata Summary

**Vite template select, T3 component multiselect, scaffolder metadata map, and enhanced summary card with framework-aware suggestions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T13:43:43Z
- **Completed:** 2026-02-17T13:47:10Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Vite template selection prompt with all 8 templates, popular ones highlighted at top, and --template flag bypass
- T3 component multiselect with 5 options (tRPC, Prisma, Drizzle, NextAuth, App Router), flag bypass
- resolveViteTemplate handles all edge cases: double-suffix prevention, react-swc special case, no-TS passthrough
- SCAFFOLDER_METADATA map with display names, descriptions, and framework-aware suggestions for all 7 scaffolders
- tinkeriseSummaryCard shows project info, options used, and actionable next steps from metadata
- 27 new tests (17 variant-select, 6 metadata, 4 summary card)

## Task Commits

Each task was committed atomically:

1. **Task 1: Variant selection prompts and scaffolder metadata** - `89d8742` (feat)
2. **Task 2: Summary card and tests for variant select + metadata** - `30b143c` (feat)

## Files Created/Modified
- `packages/cli/src/prompts/variant-select.ts` - Vite template select, T3 component multiselect, template TS resolution
- `packages/core/src/registry/metadata.ts` - ScaffolderMetadata interface, SCAFFOLDER_METADATA map, getScaffolderMetadata()
- `packages/core/src/executor/framing.ts` - Added tinkeriseSummaryCard() with metadata-driven suggestions
- `packages/core/src/executor/index.ts` - Re-exports tinkeriseSummaryCard
- `packages/core/src/index.ts` - Exports metadata and summary card from @tinkerise/core
- `packages/cli/tests/prompts/variant-select.test.ts` - 17 tests for template merging, preselection, cancel
- `packages/core/tests/registry/metadata.test.ts` - 6 tests for metadata completeness
- `packages/core/tests/executor/framing.test.ts` - 4 new tests for summary card

## Decisions Made
- Separated metadata map from Zod-validated registry schema to keep display concerns from execution concerns
- Used `as const` with `'hint' in t` operator for type-safe optional hint property access (auto-fixed TS error)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error with optional hint property on const tuples**
- **Found during:** Task 1 (variant-select.ts creation)
- **Issue:** `as const` arrays with optional `hint` property caused TS2339 when mapping with `.hint` -- property doesn't exist on union members without hint
- **Fix:** Used `'hint' in t ? t.hint : undefined` for type-safe access
- **Files modified:** packages/cli/src/prompts/variant-select.ts
- **Verification:** `bun run typecheck` passes
- **Committed in:** 89d8742 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor type safety fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Variant selection prompts ready for integration into Vite and T3 scaffold commands (Plans 03-05)
- Metadata map ready for `tinkerise list` command display and summary card rendering
- tinkeriseSummaryCard ready to replace tinkeriseSummary in scaffold execution pipeline

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (89d8742, 30b143c) verified in git log.

---
*Phase: 04-web-framework-scaffolders*
*Completed: 2026-02-17*
