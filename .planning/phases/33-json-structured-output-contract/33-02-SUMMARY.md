---
phase: 33-json-structured-output-contract
plan: 02
subsystem: cli
tags: [cli, json, runtime, error-handling, clack, commander, output-discipline]

# Dependency graph
requires:
  - phase: 31-cli-runtime-error-ux
    provides: "TinkeriseError hierarchy with stable codes, handleError single-boundary, toStableCode normalizer, formatBoundaryError contract"
provides:
  - "output-mode singleton: detectJsonMode/isJsonMode/emitJson primitives (D-12, D-13)"
  - "clack-output wrapper that injects {output: process.stderr} for log methods in JSON mode (D-13)"
  - "JSON error envelope branch in handleError: {schemaVersion, command, error: {code, message}} written to stdout (D-05) with stable exitCode"
  - "Two new TinkeriseError subclasses: InteractivePromptBlockedError (INTERACTIVE_PROMPT_BLOCKED, D-14) and JsonUnsupportedCommandError (JSON_UNSUPPORTED_COMMAND)"
  - "Update-check suppression in --json mode: short-circuit Promise + gated parseAsync .then (D-15)"
  - "Global --json option registered on the program for --help symmetry"
  - "Co-located __tests__ directories enabled in CLI vitest config (CLAUDE.md alignment)"
affects: [33-03-command-branches, 33-04-docs-conformance, future plans wiring per-command JSON branches]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-evaluation-time argv inspection for runtime-mode singletons (works synchronously before parseAsync, unlike Commander preAction hooks)"
    - "Boundary-first JSON branch in error handler (FIRST statement in handleError to prevent fallthrough to human renderer)"
    - "Single source-of-truth for stream redirection via tiny wrapper that re-exports clack helpers unchanged"

key-files:
  created:
    - "packages/cli/src/utils/output-mode.ts"
    - "packages/cli/src/utils/clack-output.ts"
    - "packages/cli/src/utils/__tests__/output-mode.test.ts"
  modified:
    - "packages/core/src/errors/base.ts (added two new error classes)"
    - "packages/core/src/errors/index.ts (alphabetised re-exports)"
    - "packages/core/src/index.ts (alphabetised re-exports from errors module)"
    - "packages/cli/src/utils/error-handler.ts (JSON-mode branch + inferCommandFromArgv)"
    - "packages/cli/src/index.ts (detectJsonMode wiring, update-check gate, global --json option)"
    - "packages/cli/tests/utils/error-handler.test.ts (6 JSON-branch tests)"
    - "packages/core/tests/errors/base.test.ts (9 tests for new error classes)"
    - "packages/cli/vitest.config.ts (include src/**/__tests__/**/*.test.ts)"

key-decisions:
  - "detectJsonMode() invoked at module evaluation time in index.ts BEFORE checkForUpdate() — Commander preAction hooks are too late (verified via line-order test)"
  - "Strict-equality argv detection: --json=true is intentionally NOT matched (researcher decision RESEARCH §1; Commander still validates the global option for help symmetry)"
  - "JSON error envelope branch is the FIRST statement in handleError and ends with process.exit() to guarantee no fallthrough to the human renderer (T-33-07)"
  - "inferCommandFromArgv recognizes preset.list/preset.show compound subcommands so the envelope's command field is meaningful"
  - "Co-located __tests__ adopted: vitest.config.ts include glob extended to src/**/__tests__/**/*.test.ts to align project reality with CLAUDE.md guidance"
  - "Writable type imported from node:stream (not NodeJS.WritableStream) for compatibility with @clack/prompts LogMessageOptions"

patterns-established:
  - "Two-line if (cond) / return style in src/index.ts (mandated by antfu/if-newline + style/max-statements-per-line)"
  - "Test files mock @clack/prompts at the module level with vi.hoisted() so log functions become trackable mocks"
  - "JSON-branch tests capture process.stdout.write via vi.spyOn and JSON.parse the joined output for envelope assertions"

requirements-completed: [CLI-12, CLI-13, CLI-14, CLI-15]

# Metrics
duration: 12min
completed: 2026-05-12
---

# Phase 33 Plan 02: CLI Runtime Summary

**JSON-mode singleton + clack stderr wrapper + handleError JSON envelope + update-check suppression + two new error classes wiring the per-command branches in plan 33-03.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-12T06:44:06Z
- **Completed:** 2026-05-12T06:56:53Z
- **Tasks:** 2 (each with RED + GREEN commits)
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments

- Module-level argv detection (`detectJsonMode()` in `output-mode.ts`) flips a singleton synchronously at CLI evaluation time, **before** the existing `checkForUpdate()` invocation — verified by deterministic awk line-order check (detect @ line 27, check @ line 28).
- `emitJson({a:1})` writes byte-exact `{"a":1}\n` to stdout (one call, single trailing newline) — asserted in unit tests using `vi.spyOn(process.stdout,'write')`.
- Clack log methods (`info/success/warn/error/step/message`) now inject `{ output: process.stderr }` when JSON mode is active; non-log helpers (`intro/outro/note/spinner/isCancel/cancel`) re-exported as-is for the human path.
- `handleError` gains a JSON-mode branch as the FIRST statement: it emits the error envelope to stdout (D-05), preserves `TinkeriseError.exitCode` / `CommanderError.exitCode` / falls back to 1, and exits — preventing fallthrough to the human renderer (T-33-07).
- `inferCommandFromArgv` returns `preset.list` / `preset.show` for compound subcommands, the first positional otherwise, or `'unknown'` when only options are present.
- Two new error classes shipped in `@tinkerise/core`: `InteractivePromptBlockedError` (code `INTERACTIVE_PROMPT_BLOCKED`, D-14) and `JsonUnsupportedCommandError` (code `JSON_UNSUPPORTED_COMMAND`). Both are alphabetically re-exported from `errors/index.ts` and the core barrel.
- Update-check fully suppressed in JSON mode: `updateCheckPromise = isJsonMode() ? Promise.resolve(null) : checkForUpdate().catch(...)` skips the network probe; `parseAsync().then` returns early before invoking `printUpdateNudge`. Verified against the built CLI — `node dist/index.js list --json` has zero update banner on either stream.
- Smoke-test confirmed: `node packages/cli/dist/index.js --json bogus-xyz` writes a single JSON envelope to stdout, **nothing** to stderr, exits 1.

## Task Commits

Each task was committed atomically via two RED→GREEN commits:

1. **Task 1: output-mode + clack-output wrapper**
   - `809121b` (test) — RED: failing tests for detect/isJsonMode/emitJson/clack wrapper
   - `3576b86` (feat) — GREEN: implementation + vitest config update + test file move
2. **Task 2: error classes + JSON envelope + update-check suppression**
   - `375f1a8` (test) — RED: failing tests for new error classes and JSON envelope branch
   - `0cfc543` (feat) — GREEN: error classes, error-handler branch, index.ts wiring, type fix

## Files Created/Modified

### Created

- `packages/cli/src/utils/output-mode.ts` — singleton with `detectJsonMode/isJsonMode/emitJson` + `__resetJsonModeForTests`
- `packages/cli/src/utils/clack-output.ts` — clack log methods with `{output: process.stderr}` redirection in JSON mode; re-exports `cancel/intro/isCancel/note/outro/spinner`
- `packages/cli/src/utils/__tests__/output-mode.test.ts` — 11 unit tests for both modules

### Modified

- `packages/core/src/errors/base.ts` — added `InteractivePromptBlockedError`, `JsonUnsupportedCommandError`
- `packages/core/src/errors/index.ts` — alphabetised re-exports
- `packages/core/src/index.ts` — barrel re-export of the two new classes
- `packages/cli/src/utils/error-handler.ts` — JSON-mode branch FIRST in `handleError`, `inferCommandFromArgv` helper, `emitJson/isJsonMode` imports
- `packages/cli/src/index.ts` — `detectJsonMode()` before `checkForUpdate()`, `--json` global option, gated update nudge
- `packages/cli/tests/utils/error-handler.test.ts` — 6 new JSON-branch tests
- `packages/core/tests/errors/base.test.ts` — 9 new tests for the two new error classes
- `packages/cli/vitest.config.ts` — added `src/**/__tests__/**/*.test.ts` to include glob

## Decisions Made

- **Co-located `__tests__/` adopted at the vitest config level** rather than relocating the test to `tests/utils/`. CLAUDE.md states "Tests co-located with source in `__tests__` directories" but the existing CLI vitest config only globbed `tests/**`. Extending the include glob is the smallest change that aligns project reality with CLAUDE.md *and* honors the plan's `files_modified` frontmatter path. No existing test moved.
- **`if (isJsonMode()) return` rendered across two lines** in `index.ts` because antfu's `if-newline` + `style/max-statements-per-line` rules collectively forbid the one-line form. Documented as a Rule 1 deviation below.
- **`Writable` type imported from `node:stream`** (not `NodeJS.WritableStream`) in `clack-output.ts` after the typechecker rejected the latter. `@clack/prompts` LogMessageOptions narrow `output` to `Writable`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Typecheck failure on `NodeJS.WritableStream` vs `Writable`**

- **Found during:** Task 2 (typecheck of built CLI)
- **Issue:** `clack-output.ts` originally typed `output?: NodeJS.WritableStream`. `@clack/prompts` `LogMessageOptions.output` is the narrower `Writable` type from `node:stream`; the assignment failed with "Type 'WritableStream' is missing the following properties from type 'Writable': writableAborted, writableEnded, writableFinished, writableHighWaterMark, and 16 more."
- **Fix:** Switched to `import type { Writable } from 'node:stream'` and changed the interface to `output?: Writable`.
- **Files modified:** `packages/cli/src/utils/clack-output.ts`
- **Verification:** `bun run --filter @tinkerise/cli typecheck` exits 0; existing unit tests still pass.
- **Committed in:** `0cfc543`

**2. [Rule 3 - Blocking] Vitest config did not pick up plan-specified `src/utils/__tests__/` location**

- **Found during:** Task 1 (test runner couldn't find the test)
- **Issue:** The plan's `files_modified` frontmatter specifies `packages/cli/src/utils/__tests__/output-mode.test.ts`, which matches CLAUDE.md's "Tests co-located with source in `__tests__` directories" guidance. However the CLI's `vitest.config.ts` only included `tests/**/*.test.ts` paths, so the plan-specified location would never run.
- **Fix:** Added `'src/**/__tests__/**/*.test.ts'` to the include array. No existing tests were touched.
- **Files modified:** `packages/cli/vitest.config.ts`
- **Verification:** `bun run --filter @tinkerise/cli test -- --run output-mode` finds and passes 11/11; full CLI suite still passes 371/371 (7 skipped).
- **Committed in:** `3576b86`

**3. [Rule 1 - Bug] Lint conflict with plan's one-line `if (isJsonMode()) return`**

- **Found during:** Task 2 (lint after wiring index.ts)
- **Issue:** Plan acceptance criterion specified `grep -c "if (isJsonMode()) return" packages/cli/src/index.ts returns 1`. Writing this as one line triggered antfu's `antfu/if-newline` rule; rewriting as `if (cond) { return }` triggered `style/max-statements-per-line`. The project-wide existing convention (`update-check.ts`, `interactive.ts`, etc.) is two-line `if (cond)\n  return`.
- **Fix:** Adopted the project's existing two-line style.
- **Files modified:** `packages/cli/src/index.ts`
- **Verification:** `bun run --filter @tinkerise/cli lint` exits 0; the JSON-mode-return semantics are preserved verbatim and behaviour is verified by smoke test (`node dist/index.js list --json` prints no update nudge).
- **Committed in:** `0cfc543`
- **Acceptance criterion impact:** The substring `if (isJsonMode()) return` no longer matches as one literal token, but the underlying intent (skip update nudge in JSON mode) is honoured and exercised in the smoke test. All other acceptance grep checks pass.

**4. [Rule 1 - Bug] Lint violations in new error-handler test (Buffer + double-quoted strings)**

- **Found during:** Task 2 (lint after adding JSON-branch tests)
- **Issue:** `Buffer.from(...)` triggered `node/prefer-global/buffer`; embedded single quotes in test fixtures used double-quoted strings, violating `style/quotes`.
- **Fix:** Added `import { Buffer } from 'node:buffer'` and replaced the three double-quoted strings with single-quoted strings using backslash escaping.
- **Files modified:** `packages/cli/tests/utils/error-handler.test.ts`
- **Verification:** Lint clean; all 10 tests in this file pass.
- **Committed in:** `0cfc543`

---

**Total deviations:** 4 auto-fixed (2 Rule 1 bugs, 1 Rule 3 blocking, 1 Rule 1 lint)
**Impact on plan:** Every fix preserved the plan's intent and the underlying D-12/D-13/D-14/D-15/D-05 contract. The only acceptance-criterion text mismatch is the cosmetic one-line vs two-line `if` form, where project-wide convention won.

## Issues Encountered

- None beyond the auto-fixed deviations above. Initial misstep: the first `Write` of the test file landed in the main repo at `/Users/impera/.../tinkerise/packages/cli/tests/utils/...` because `bun run` and `cd` in earlier diagnostic commands jumped me out of the worktree. Cleaned up by unstaging from main and re-writing under the worktree path (`/Users/impera/.../worktrees/agent-a62a047de2a664dc2/...`). The worktree had no spurious commits.

## TDD Gate Compliance

Both tasks followed RED → GREEN explicitly:

| Task | RED commit | GREEN commit |
| --- | --- | --- |
| 1 | `809121b` (`test(33-02)`) | `3576b86` (`feat(33-02)`) |
| 2 | `375f1a8` (`test(33-02)`) | `0cfc543` (`feat(33-02)`) |

Refactor commits were not needed — the GREEN implementations were minimal and idiomatic.

## Verification Run Log

- `bun run --filter @tinkerise/core lint && bun run --filter @tinkerise/cli lint` — exit 0
- `bun run --filter @tinkerise/core typecheck && bun run --filter @tinkerise/cli typecheck` — exit 0
- `bun run --filter @tinkerise/core build && bun run --filter @tinkerise/cli build` — exit 0
- `bun run --filter @tinkerise/core test` — 652/652 pass
- `bun run --filter @tinkerise/cli test` — 371/371 pass (7 skipped, all e2e gated behind `TINKERISE_E2E=true`)
- Smoke: `node packages/cli/dist/index.js --json bogus-xyz 2>/dev/null | head -c 30` → `{"schemaVersion":1,"command":"b`
- Smoke: `node packages/cli/dist/index.js --json bogus-xyz 1>/dev/null` → empty stderr (0 bytes)
- Regression: `node packages/cli/dist/index.js bogus-xyz` → human-mode `Error [INVALID_CATEGORY] ...` on stderr, exit 1, no JSON

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **For 33-03 (per-command JSON branches):** the runtime substrate is in place. Commands can call `isJsonMode()` at the top of their action handler and emit envelopes via `emitJson()`. The `--json` option is registered globally so help symmetry exists. The JSON error envelope already handles failures from any code path.
- **For 33-04 (docs + conformance):** stdout discipline (one JSON object, single trailing newline, error envelope on stdout, zero JSON on stderr) is mechanically enforced by `output-mode.ts` and `handleError`. The conformance matrix can assert these invariants without per-command setup.
- **Plan 33-01 (shared schemas) is parallel and untouched here.** This worktree based at HEAD `7af69419` deliberately did not depend on it — verified by the plan's parallel-safety note.

## Self-Check: PASSED

Verified files exist:
- `packages/cli/src/utils/output-mode.ts` — FOUND
- `packages/cli/src/utils/clack-output.ts` — FOUND
- `packages/cli/src/utils/__tests__/output-mode.test.ts` — FOUND
- `packages/cli/src/utils/error-handler.ts` — FOUND (modified)
- `packages/cli/src/index.ts` — FOUND (modified)
- `packages/core/src/errors/base.ts` — FOUND (modified)
- `packages/core/src/errors/index.ts` — FOUND (modified)

Verified commits exist:
- `809121b` (test 33-02 task 1 RED) — FOUND
- `3576b86` (feat 33-02 task 1 GREEN) — FOUND
- `375f1a8` (test 33-02 task 2 RED) — FOUND
- `0cfc543` (feat 33-02 task 2 GREEN) — FOUND

---
*Phase: 33-json-structured-output-contract*
*Completed: 2026-05-12*
