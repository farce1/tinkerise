---
phase: 20-cli-test-coverage
plan: 02
subsystem: testing
tags: [vitest, project-name, prompt-flow, update-command, commander, clack-prompts]

requires:
  - phase: 20-cli-test-coverage
    provides: CLI test patterns established in plan 20-01
provides:
  - Test suite for validateProjectName and promptProjectName
  - Test suite for runPromptFlow orchestration with pre-fill and cancel logic
  - Test suite for registerUpdateCommand covering all install-method branches
affects: [cli-test-coverage]

tech-stack:
  added: []
  patterns: [Commander parseAsync for command testing, p.group mock with sequential function execution, exitOverride for Commander test isolation]

key-files:
  created:
    - packages/cli/tests/prompts/project-name.test.ts
    - packages/cli/tests/prompts/flow.test.ts
    - packages/cli/tests/commands/update.test.ts
  modified: []

key-decisions:
  - "Mocked p.group with sequential function executor to mirror real clack behavior"
  - "Used Commander exitOverride() + parseAsync for realistic command testing without process.exit"
  - "Tested validateProjectName as pure function (no mocks needed) for thorough regex coverage"

patterns-established:
  - "Commander command testing: new Command() + exitOverride() + parseAsync(['node', 'test', 'command'])"
  - "p.group mock: execute prompt functions sequentially, capture onCancel callback for cancellation tests"

requirements-completed: [TEST-05, TEST-06, TEST-09]

duration: 3min
completed: 2026-02-19
---

# Plan 20-02: Project-Name, Flow, and Update Command Test Suites

**23 project-name validation tests, 13 prompt flow orchestration tests, and 15 update command branch tests**

## Performance

- **Duration:** 3 min
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- project-name.test.ts with 23 tests: 8 valid name patterns, 10 invalid name patterns, 5 promptProjectName tests including cancellation
- flow.test.ts with 13 tests: happy path (4 tests), pre-fill skip logic for framework/name/options (4 tests), allOptionsResolved edge cases (3 tests), cancellation (2 tests)
- update.test.ts with 15 tests: Homebrew branch (3 tests), npm-global branch (3 tests), npx branch (3 tests), unknown branch (4 tests), error handling (2 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1+2+3: project-name, flow, and update command tests** - `ca90d25` (test)

## Files Created/Modified
- `packages/cli/tests/prompts/project-name.test.ts` - 23 tests for validateProjectName and promptProjectName
- `packages/cli/tests/prompts/flow.test.ts` - 13 tests for runPromptFlow with pre-fill, allOptionsResolved, and cancellation
- `packages/cli/tests/commands/update.test.ts` - 15 tests for registerUpdateCommand covering all 4 InstallMethod branches

## Decisions Made
- Combined all 3 tasks into a single commit since they are all part of the same plan and share the CLI test domain
- Used Commander's exitOverride() to prevent process.exit during tests while still testing command registration and execution

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLI test coverage complete, phase 20 ready for verification

---
*Phase: 20-cli-test-coverage*
*Completed: 2026-02-19*
