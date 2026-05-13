---
phase: 34-shell-completions
plan: 01
subsystem: errors
tags: [errors, hierarchy, COMPLETION_UNKNOWN_SHELL, fuzzy-match, tinkerise-error, vitest]

# Dependency graph
requires:
  - phase: 24-error-handling-cli-polish
    provides: TinkeriseError base class, centralized errors module, handleError() boundary
  - phase: 31-cli-runtime-error-ux-reliability
    provides: 3-line failure UX contract, stable uppercase error codes
provides:
  - UnknownShellError subclass with code COMPLETION_UNKNOWN_SHELL appended to packages/core/src/errors/base.ts
  - Constructor signature `(shell: string, closestMatch?: string)` mirroring InvalidCategoryError
  - Default suggestion "Supported shells: bash, zsh, fish." and "Did you mean '<match>'?" fuzzy variant
  - Re-export from packages/core/src/errors/index.ts in alphabetical order after UnknownEnhancementError
  - Package-surface re-export from packages/core/src/index.ts so downstream plans can `import { UnknownShellError } from '@tinkerise/core'`
  - Co-located unit test at packages/core/src/errors/__tests__/unknown-shell-error.test.ts (3 vitest cases)
  - Extended packages/core/vitest.config.ts to discover co-located `src/**/__tests__/**/*.test.ts` (matches @tinkerise/cli convention)
affects: [34-02, 34-03, completion, __complete, shell-completions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TinkeriseError subclass with code + optional closest-match suggestion (mirrors InvalidCategoryError)
    - Co-located vitest `__tests__/` directory pattern extended to @tinkerise/core

key-files:
  created:
    - packages/core/src/errors/__tests__/unknown-shell-error.test.ts
  modified:
    - packages/core/src/errors/base.ts
    - packages/core/src/errors/index.ts
    - packages/core/src/index.ts
    - packages/core/vitest.config.ts

key-decisions:
  - "Append UnknownShellError to base.ts rather than creating unknown-shell-error.ts — matches the established 'all error subclasses in one file' convention in errors/base.ts"
  - "Re-export UnknownShellError from packages/core/src/index.ts (package surface) so Plans 02/03 can `import { UnknownShellError } from '@tinkerise/core'` per the plan's <done> clause; mirrors how InvalidCategoryError and other peers are already surfaced"
  - "Extend packages/core/vitest.config.ts to include `src/**/__tests__/**/*.test.ts` so the plan-required co-located test path is discovered (matches @tinkerise/cli convention; CLAUDE.md says 'Tests co-located with source in __tests__ directories')"
  - "Lower-case the describe title to satisfy @antfu/eslint-config rule test/prefer-lowercase-title"

patterns-established:
  - "Pattern: package-level export of error subclasses — when adding a new TinkeriseError subclass, re-export from BOTH packages/core/src/errors/index.ts AND packages/core/src/index.ts so downstream packages can import via the `@tinkerise/core` entry point"
  - "Pattern: co-located vitest in @tinkerise/core — co-located `src/**/__tests__/**/*.test.ts` is now discoverable in core, matching @tinkerise/cli"

requirements-completed: [CLI-09]

# Metrics
duration: ~10min
completed: 2026-05-13
---

# Phase 34 Plan 01: Add UnknownShellError to centralized error hierarchy Summary

**UnknownShellError subclass (code COMPLETION_UNKNOWN_SHELL) added to @tinkerise/core's error hierarchy, re-exported on the package surface, and locked behind a 3-case co-located vitest — unblocks Wave 2 completion command and Wave 1 __complete handler.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-13T09:53:00Z
- **Completed:** 2026-05-13T09:59:39Z
- **Tasks:** 2
- **Files modified:** 4 (3 modified + 1 created)

## Accomplishments

- New `UnknownShellError extends TinkeriseError` class at `packages/core/src/errors/base.ts:254` with stable code `COMPLETION_UNKNOWN_SHELL`, canonical message wording `Unknown shell: '<shell>'. Supported shells: bash, zsh, fish.`, default fallback suggestion, and fuzzy "Did you mean '<match>'?" variant when a closestMatch argument is supplied.
- Re-exported from `packages/core/src/errors/index.ts:20` in correct alphabetical order between `UnknownEnhancementError` and the closing `} from './base.js'`.
- Surfaced on the package root at `packages/core/src/index.ts:108` so Plan 02 (`__complete` handler) and Plan 03 (`completion` command) can `import { UnknownShellError } from '@tinkerise/core'` without reaching into the internal module.
- Co-located vitest at `packages/core/src/errors/__tests__/unknown-shell-error.test.ts` with 3 passing cases locking the code/message/suggestion contract.
- Routes through the existing `handleError()` boundary unchanged because it extends `TinkeriseError` — no changes to `packages/cli/src/utils/error-handler.ts`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add UnknownShellError to base.ts and re-export it** — `9e891d5` (feat)
2. **Task 2: Co-located unit test for UnknownShellError** — `576c459` (test)

_Plan metadata commit (this SUMMARY) is created by the worktree execute-plan flow before the orchestrator merges the worktree back._

## Files Created/Modified

- `packages/core/src/errors/base.ts` (modified, +17 lines) — appended `UnknownShellError` class at lines 250-266 (JSDoc starts at 250, `export class` at 254, closing brace at 266) after `JsonUnsupportedCommandError`.
- `packages/core/src/errors/index.ts` (modified, +1 line) — added `UnknownShellError,` at line 20 in the alphabetical `export { ... } from './base.js'` block, immediately after `UnknownEnhancementError,`.
- `packages/core/src/index.ts` (modified, +1 line) — added `UnknownShellError,` at line 108 in the `Errors — structured error hierarchy and fuzzy matching utilities` re-export block, so the class is reachable as `@tinkerise/core/UnknownShellError`.
- `packages/core/src/errors/__tests__/unknown-shell-error.test.ts` (created, 22 lines) — 3 vitest cases: (1) code/name/exitCode/message/default-suggestion contract, (2) "Did you mean ..." suggestion when closestMatch passed, (3) `instanceof TinkeriseError`.
- `packages/core/vitest.config.ts` (modified, +4/-1 line) — extended `include` to discover both `tests/**/*.test.ts` and `src/**/__tests__/**/*.test.ts` (matches @tinkerise/cli convention).

## Decisions Made

- **Appended UnknownShellError to base.ts** rather than splitting it into its own file — preserves the established "all TinkeriseError subclasses in one module" convention (already includes 12 subclasses).
- **Surfaced on package root (`packages/core/src/index.ts`)** in addition to the errors submodule. The plan's `<done>` clause states downstream plans can `import { UnknownShellError } from '@tinkerise/core'`, and the existing pattern is to re-export each error class from the package root (see `InvalidCategoryError`, `JsonUnsupportedCommandError`, etc. already listed there). Without this, the import would resolve only via the internal `./errors/index.js` path and the dist bundle's public surface would not contain the class.
- **Extended packages/core/vitest.config.ts** to include `src/**/__tests__/**/*.test.ts`. The plan explicitly requires the test at the co-located path (`packages/core/src/errors/__tests__/unknown-shell-error.test.ts`), but core's vitest config only included `tests/**/*.test.ts` — vitest would not have discovered the new file. The fix mirrors @tinkerise/cli's already-working pattern (one extra glob in the include array).
- **Lower-case describe title** (`'unknownShellError'` rather than `'UnknownShellError'`) — required by `@antfu/eslint-config`'s `test/prefer-lowercase-title` rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Surface UnknownShellError on packages/core/src/index.ts (package root)**

- **Found during:** Task 1 verification (post-build dist surface check)
- **Issue:** Plan adds the class to `packages/core/src/errors/base.ts` and re-exports from `packages/core/src/errors/index.ts`, but the package's main entry point `packages/core/src/index.ts` re-exports a curated subset of error classes (e.g., `InvalidCategoryError`, `JsonUnsupportedCommandError`) and was missing `UnknownShellError`. As a result, the plan's stated outcome — "Plan 02 and Plan 03 can now `import { UnknownShellError } from '@tinkerise/core`'" — would have failed: the dist bundle's public surface did not contain the class. Verified by `grep -c UnknownShellError packages/core/dist/index.js` returning 0 before the fix.
- **Fix:** Added `UnknownShellError,` to the `Errors — structured error hierarchy and fuzzy matching utilities` re-export block in `packages/core/src/index.ts` (line 108), in alphabetical order between `UnknownEnhancementError` and the closing brace. This mirrors how `InvalidCategoryError` (line 102) and `JsonUnsupportedCommandError` (line 104) are already surfaced.
- **Files modified:** `packages/core/src/index.ts`
- **Verification:** `grep -c UnknownShellError packages/core/dist/index.js` returns 3 (export + symbol + reference); `grep -c UnknownShellError packages/core/dist/index.d.ts` returns 2; build and typecheck both green.
- **Committed in:** `9e891d5` (Task 1 commit — bundled with the base.ts and errors/index.ts changes because the plan's `<done>` clause already implies this surface is reachable from `@tinkerise/core`).

**2. [Rule 3 - Blocking] Extend packages/core/vitest.config.ts to discover co-located `__tests__/` tests**

- **Found during:** Task 2 (creating the test file at the plan-required path)
- **Issue:** Plan REQUIRES the test at `packages/core/src/errors/__tests__/unknown-shell-error.test.ts` (per `files_modified`, `must_haves.artifacts.path`, `<files>`, and `<action>`), but `packages/core/vitest.config.ts` only declares `include: ['tests/**/*.test.ts']` — meaning vitest in core would not discover the new co-located file. The plan's `<verify>` and `<acceptance_criteria>` both require `bun run --cwd packages/core test -- unknown-shell-error` to exit 0 with 3 passing cases; with the original include glob, vitest would have reported "No test files found" and exited 1.
- **Fix:** Extended `packages/core/vitest.config.ts` `include` array from `['tests/**/*.test.ts']` to `['tests/**/*.test.ts', 'src/**/__tests__/**/*.test.ts']`. This matches the already-working convention in `packages/cli/vitest.config.ts` (which includes `src/**/__tests__/**/*.test.ts` for the existing `packages/cli/src/utils/__tests__/output-mode.test.ts`) and matches CLAUDE.md's stated convention: "Tests co-located with source in `__tests__` directories".
- **Files modified:** `packages/core/vitest.config.ts`
- **Verification:** `bun run --cwd packages/core test -- unknown-shell-error` exits 0 with 3 passing cases; full core suite still passes (51 test files / 655 tests); `bun run lint` exits 0.
- **Committed in:** `576c459` (Task 2 commit — bundled with the test file because the include extension only exists to make the new file discoverable).

**3. [Rule 1 - Bug] Lower-case describe title to satisfy @antfu/eslint-config**

- **Found during:** Task 2 final lint gate
- **Issue:** Test file used `describe('UnknownShellError', ...)`; `@antfu/eslint-config`'s `test/prefer-lowercase-title` rule flagged it as an error. The plan's `<action>` block prescribed the exact PascalCase title verbatim; following it as-written would fail the project's lint gate.
- **Fix:** Changed `describe('UnknownShellError', ...)` to `describe('unknownShellError', ...)`. Vitest test names are arbitrary strings — the change has no effect on the assertion contract.
- **Files modified:** `packages/core/src/errors/__tests__/unknown-shell-error.test.ts`
- **Verification:** `bun run --cwd packages/core lint` exits 0; tests still report 3 passing cases.
- **Committed in:** `576c459` (Task 2 commit — applied before the test commit landed).

---

**Total deviations:** 3 auto-fixed (3 blocking / config gaps — Rule 1 × 1, Rule 3 × 2)

**Impact on plan:** All three deviations are required to make the plan's stated `<done>` clause, `<verification>` block, and `<acceptance_criteria>` actually pass. No scope creep: changes are confined to (a) one additional re-export line in an existing curated block, (b) one additional glob in the vitest include array, and (c) a single character casing change in a test title. The error class itself, its message wording, its code, and its constructor signature match the plan verbatim. Plan 02 and Plan 03 can now import `UnknownShellError` from `@tinkerise/core` as the plan's `<done>` clause promised.

## Issues Encountered

- **Misrouted commit on main branch (recovered)** — At the start of Task 1 I `cd /Users/impera/Documents/GitHub/tinkerise && git commit ...`, which executed inside the main repository rather than the worktree at `.claude/worktrees/agent-a7ca13de6358b5173/`. The commit (now-obsolete `613b652`) landed on `main` instead of `worktree-agent-a7ca13de6358b5173`. Recovered safely with a `git reset --soft HEAD~1` on main (non-destructive, keeps working tree), then `git restore --staged` to unstage and `git checkout -- <specific file>` for each of the three task-modified files (allowed per `<destructive_git_prohibition>` — "discard changes to a specific file you modified during this task"). Main repo HEAD is now back at the pre-execution `a850eb8`; the worktree contains the only copy of the Task 1 + Task 2 work, committed as `9e891d5` and `576c459` on `worktree-agent-a7ca13de6358b5173`. Pre-existing dirty files on main (`.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`) were untouched.
- No other issues.

## Threat Surface Scan

Plan threat model assigned `mitigate` dispositions to T-34-01 (Tampering on `UnknownShellError.message`) and T-34-03 (Spoofing on stable code identifier). Both mitigations are present:

- **T-34-01:** Shell-name input is interpolated only into a single-quoted plain-text error string (`message: \`Unknown shell: '${shell}'. ...\``); rendered downstream by `handleError()`'s `renderAndExit()` via `process.stderr.write` — no eval, no shell exec. Verified by source inspection.
- **T-34-03:** `code: 'COMPLETION_UNKNOWN_SHELL'` is a hard-coded TypeScript string literal — cannot be set by user input. Locked by Task 2's first test case (`expect(err.code).toBe('COMPLETION_UNKNOWN_SHELL')`).

No new threat surface introduced beyond the plan's documented register.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 1 sibling plan (`__complete` handler, Plan 02 in this phase) and Wave 2 plan (`completion` command, Plan 03 in this phase) can now `import { UnknownShellError } from '@tinkerise/core'` — verified by inspecting `packages/core/dist/index.js` and `packages/core/dist/index.d.ts` for the export.
- Error class round-trips through `handleError()` automatically because it extends `TinkeriseError` — no changes to `packages/cli/src/utils/error-handler.ts` and none required.
- No blockers.

## Self-Check: PASSED

**Files exist:**

- FOUND: `packages/core/src/errors/__tests__/unknown-shell-error.test.ts` (22 lines, 3 vitest cases)
- FOUND: edits in `packages/core/src/errors/base.ts` (lines 250-266 — UnknownShellError class)
- FOUND: edits in `packages/core/src/errors/index.ts` (line 20 — UnknownShellError, in re-export)
- FOUND: edits in `packages/core/src/index.ts` (line 108 — UnknownShellError, in re-export)
- FOUND: edits in `packages/core/vitest.config.ts` (include glob extended)

**Commits exist on `worktree-agent-a7ca13de6358b5173`:**

- FOUND: `9e891d5` — feat(34-01): add UnknownShellError to centralized error hierarchy
- FOUND: `576c459` — test(34-01): lock UnknownShellError code, message and suggestion contract

**Verification gates green:**

- `bun run --cwd packages/core build` → exit 0 (dist contains UnknownShellError)
- `bun run --cwd packages/core typecheck` → exit 0
- `bun run --cwd packages/core test -- unknown-shell-error` → exit 0, 3 passing cases
- `bun run --cwd packages/core test` → exit 0, 51 test files / 655 tests passing
- `bun run lint` → exit 0

---

*Phase: 34-shell-completions*
*Completed: 2026-05-13*
