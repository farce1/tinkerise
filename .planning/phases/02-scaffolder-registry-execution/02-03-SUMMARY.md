---
phase: 02-scaffolder-registry-execution
plan: 03
subsystem: executor
tags: [execa, stdio-inherit, output-framing, pipeline, subprocess]

requires:
  - phase: 02-scaffolder-registry-execution
    provides: registry loader, flag resolver, prerequisite checker
provides:
  - Process executor with inherited stdio
  - Output framing with dimmed [tinkerise] prefix
  - Upstream version detection
  - End-to-end executeScaffolder() pipeline
affects: [phase-3-interactive-ux, phase-4-web-scaffolders]

tech-stack:
  added: []
  patterns: [stdio-inherit, dimmed-prefix-framing, detect-map-execute-pipeline]

key-files:
  created:
    - packages/core/src/executor/framing.ts
    - packages/core/src/executor/version.ts
    - packages/core/src/executor/process.ts
    - packages/core/src/executor/index.ts
  modified:
    - packages/core/src/index.ts

key-decisions:
  - "stdio: inherit for all scaffolder execution -- upstream gets direct terminal access"
  - "Version detection is non-fatal -- falls back to base flags silently"
  - "Template strategy uses projectName directly (no command prefix)"

patterns-established:
  - "tinkeriseLog() for all orchestration output"
  - "executeScaffolder() as the single entry point for the pipeline"
  - "buildCommandArgs() driven by integration strategy discriminated union"

requirements-completed: [REG-04, UX-06, UX-07]

duration: 4min
completed: 2026-02-17
---

# Plan 02-03 Summary: Process executor and pipeline wiring

**End-to-end executeScaffolder() pipeline with inherited stdio for terminal passthrough and dimmed [tinkerise] prefix framing**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-17T09:54:00Z
- **Completed:** 2026-02-17T09:57:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- spawnScaffolder() with execa stdio: inherit for direct terminal passthrough
- tinkeriseLog() with dimmed [tinkerise] prefix distinguishing orchestration from upstream output
- detectUpstreamVersion() for version-aware flag mapping
- executeScaffolder() wiring full pipeline: registry -> flags -> prereqs -> version -> spawn -> summary
- buildCommandArgs() handling all three integration strategies
- 11 new tests all passing

## Task Commits

1. **Tasks 1-2: Executor code** - `9e61a56` (feat)
2. **Task 3: Tests** - `b7086c7` (test)

## Decisions Made
- Template integration strategy builds args differently (no command prefix) -- just projectName
- Version detection is non-fatal, returns null on failure

## Deviations from Plan
None - plan executed exactly as written.

## Self-Check: PASSED
