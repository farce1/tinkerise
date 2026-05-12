---
phase: 33-json-structured-output-contract
plan: 03
subsystem: cli
tags: [cli, json, commands, doctor, preset, list, clack-migration]

# Dependency graph
requires:
  - phase: 33-json-structured-output-contract (plan 01)
    provides: "ListEnvelopeV1Schema, DoctorEnvelopeV1Schema, PresetListEnvelopeV1Schema, PresetShowEnvelopeV1Schema in @tinkerise/shared"
  - phase: 33-json-structured-output-contract (plan 02)
    provides: "isJsonMode/emitJson primitives, clack-output wrapper, handleError JSON branch, PresetNotFoundError envelope flow"
provides:
  - "tinkerise list --json emits ListEnvelopeV1Schema-validated envelope (CLI-12)"
  - "tinkerise doctor --json emits DoctorEnvelopeV1Schema-validated envelope with snake_case requiredFailed/optionalFailed summary; exit 1 when summary.requiredFailed > 0 (CLI-13)"
  - "tinkerise preset list --json emits PresetListEnvelopeV1Schema-validated envelope with D-21 empty arrays (CLI-14)"
  - "NEW preset show <name> subcommand emitting PresetShowEnvelopeV1Schema for found cases and PRESET_NOT_FOUND error envelope for misses (D-06/D-07/D-08)"
  - "DoctorCheck.required: boolean field on every DOCTOR_CHECKS entry (Node.js true, others false)"
  - "runDoctorChecks(overrides?) exported as a deterministic test seam (I-09 option a) for 33-04 T3 conformance fixtures"
  - "preset.ts fully migrated from raw @clack/prompts to the clack-output wrapper (D-13)"
affects: [33-04-docs-conformance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-command JSON early-return at the top of each action handler: Schema.parse(...) -> emitJson(envelope) -> return"
    - "Schema.parse() defense-in-depth before emit — any payload drift throws a ZodError that flows through handleError to a JSON error envelope"
    - "buildXPayload() helpers separate shape-construction from action wiring; the human path remains untouched below the early-return"
    - "DoctorCheck.required: boolean drives both the JSON summary's requiredFailed counter AND the process.exit(1) gate"
    - "Conditional spread (...(presetData.description ? { description } : {})) for D-22 optional-field omission"

key-files:
  created: []
  modified:
    - "packages/cli/src/commands/list.ts"
    - "packages/cli/src/commands/doctor.ts"
    - "packages/cli/src/commands/preset.ts"
    - "packages/cli/src/utils/clack-output.ts"
    - "packages/cli/src/utils/__tests__/output-mode.test.ts"
    - "packages/cli/tests/commands/list.test.ts"
    - "packages/cli/tests/commands/doctor.test.ts"
    - "packages/cli/tests/commands/preset.test.ts"

key-decisions:
  - "clack-output wrapper omits the options object when not in JSON mode (returns undefined from streamOpts() rather than {}). This preserves the pre-D-13 calling convention (clack.log.info(msg) with no second argument), which keeps all existing call-site mocks in preset.test.ts compatible with the wrapper migration without rewriting 25 toHaveBeenCalledWith expectations."
  - "Extended clack-output to re-export confirm/select/text alongside cancel/intro/isCancel/note/outro/spinner. preset.ts uses all three for interactive prompts and the plan-mandated full migration off raw @clack/prompts required them. Additive change only — no behavior modification."
  - "buildPresetListPayload validates the empty-array contract (D-21) at construction time: it builds the local/npm arrays unconditionally, so PresetListEnvelopeV1Schema.parse() sees [] when no presets exist rather than missing keys."
  - "preset show <name> filePath resolved via path.join(getPresetsDir(), `${name}.json`) — no hardcoded ~/.config/tinkerise/presets path. assertValidPresetName(name) is the FIRST statement so the T-33-10 path-traversal threat is mitigated before any filesystem access."

requirements-completed: [CLI-12, CLI-13, CLI-14]

# Metrics
duration: ~14min
completed: 2026-05-12
---

# Phase 33 Plan 03: Command Branches Summary

**Per-command --json branches for list/doctor/preset list, a new preset show <name> subcommand, DoctorCheck.required field with exit-1 gate, and full preset.ts migration off raw @clack/prompts onto the D-13 wrapper.**

## Performance

- **Duration:** ~14 min
- **Tasks:** 3 (each split into TDD RED + GREEN commits — 7 task commits total including one Rule-1 fix commit for the wrapper)
- **Files modified:** 8 (3 source files in commands/, 1 wrapper, 4 test files)

## Accomplishments

- `tinkerise list --json` emits `{schemaVersion:1, command:'list', data:{scaffolders, templates, enhancements}}` with prereqOk computed per scaffolder, displayName/description omitted when metadata is absent (D-22), and empty templates/enhancements arrays preserved when a category filter is applied (D-21).
- `tinkerise doctor --json` emits the data envelope with snake_case `requiredFailed` + `optionalFailed` summary fields (D-24, both required). `DoctorCheck.required: boolean` lives on all 10 entries (Node.js true, others false). `process.exit(1)` fires when `summary.requiredFailed > 0` — and ONLY then — preserving the data envelope on stdout (D-23). Optional-only failures keep exit 0.
- `runDoctorChecks(overrides?: DoctorCheck[])` exported from `doctor.ts` as a deterministic test seam: the 33-04 T3 conformance fixture can inject a synthetic `required:true` failure without spawning real processes (I-09 option a).
- `tinkerise preset list --json` emits `{schemaVersion:1, command:'preset.list', data:{local, npm}}` with empty arrays preserved (D-21) and `description` omitted when absent (D-22).
- NEW `tinkerise preset show <name>` subcommand (D-06) registered in `preset.ts`. Argument validation, local-first/npm-fallback lookup, full payload emission (name/description/source/filePath/scaffold/enhancements/config), filePath omitted when source=npm (D-22), PRESET_NOT_FOUND error envelope on miss (D-08) — all wired in both human and JSON modes.
- `preset.ts` fully migrated from `import * as p from '@clack/prompts'` to the clack-output wrapper (D-13). 30+ call sites rewritten: `p.log.info` → `log.info`, `p.cancel` → `cancel`, `p.isCancel` → `isCancel`, `p.text/select/confirm` → `text/select/confirm`. clack-output extended to re-export the three interactive prompt helpers additively.
- Schema.parse() validates every emitted envelope before `emitJson`, so any future drift between the implementation and the contract throws a ZodError that the existing handleError JSON branch converts into a CONFIG_VALIDATION error envelope on stdout.

## Task Commits

| Task | Phase | Commit | Type |
| --- | --- | --- | --- |
| T1 | RED | `6cbd247` | test(33-03): add failing JSON-mode tests for list command |
| T1 | GREEN | `0be7158` | feat(33-03): wire JSON branch into list command (CLI-12) |
| T2 | RED | `b691151` | test(33-03): add failing tests for doctor JSON mode + required field |
| T2 | GREEN | `6b17540` | feat(33-03): wire JSON branch into doctor command (CLI-13) |
| (Rule 1 fix) | — | `eb78f07` | fix(33-03): clack-output wrapper omits empty options in non-JSON mode |
| T3 | RED | `237b5a0` | test(33-03): add failing tests for preset list/show JSON mode (CLI-14) |
| T3 | GREEN | `e6f36ce` | feat(33-03): preset list/show JSON + new preset show + clack migration (CLI-14) |

(SUMMARY commit follows; orchestrator owns STATE/ROADMAP/REQUIREMENTS writes after the wave completes.)

## Files Created/Modified

### Source

- `packages/cli/src/commands/list.ts` — added `buildListPayload()` helper and a JSON early-return at the top of `listScaffolders` that emits `ListEnvelopeV1Schema.parse(...)`. Imports `ListEnvelopeV1Schema`, `emitJson`, `isJsonMode`.
- `packages/cli/src/commands/doctor.ts` — added `required: boolean` to `DoctorCheck` interface and to all 10 DOCTOR_CHECKS entries. Added exported `runDoctorChecks(overrides?: DoctorCheck[])` test seam. Added private `runDoctorChecksForJson()` payload builder with summary counter (snake_case requiredFailed/optionalFailed per D-24). Added JSON early-return at the top of `runDoctor` that emits the data envelope and gates `process.exit(1)` on `requiredFailed > 0`. Imports `DoctorEnvelopeV1Schema`, `emitJson`, `isJsonMode`.
- `packages/cli/src/commands/preset.ts` — full clack-output wrapper migration (30+ call sites), new `buildPresetListPayload()` helper, JSON early-return in `preset list`, NEW `preset show <name>` subcommand registered after `preset list`. Imports `PresetListEnvelopeV1Schema`, `PresetShowEnvelopeV1Schema`, `emitJson`, `isJsonMode`, and clack symbols from the wrapper.
- `packages/cli/src/utils/clack-output.ts` — streamOpts() now returns `undefined` in non-JSON mode (rather than `{}`); each log method branches on it to call clack with exactly one argument when no override is needed. Added confirm/select/text to the re-export list (additive).

### Tests

- `packages/cli/tests/commands/list.test.ts` — 8 new tests under `describe('listScaffolders --json (CLI-12)')` covering schema shape, supportedFlags mapping, D-22 omission, D-21 empty arrays, InvalidCategoryError flow, console.log suppression, single-stdout-call invariant.
- `packages/cli/tests/commands/doctor.test.ts` — 3 tests under `describe('dOCTOR_CHECKS required field (D-11/D-24)')` and 8 tests under `describe('runDoctor --json (CLI-13)')` covering schemaVersion/command/checks count, exit-1 gate, snake_case summary keys, per-check entry shape, version-omission-on-failure, console.log suppression, and the exported `runDoctorChecks` test seam.
- `packages/cli/tests/commands/preset.test.ts` — 16 new tests across three new describe blocks: `preset list --json`, `preset show <name>` (human mode), and `preset show <name> --json`. Covers empty-array preservation, D-22 omissions, full payload emission, filePath presence/absence by source, PresetNotFoundError flow (D-08), and the new subcommand's argument validation. Test harness updated to register `--json` globally so subcommand parsing accepts the flag (mirrors production wiring).
- `packages/cli/src/utils/__tests__/output-mode.test.ts` — wrapper test updated to assert that `clack.log.info` receives exactly one argument in non-JSON mode (matches the new streamOpts() = undefined behavior).

## Decisions Made

- **clack-output wrapper passes `undefined` (not `{}`) when not in JSON mode.** Found during Task 3 planning: the existing preset.test.ts has 25+ assertions of the form `expect(mockPLogInfo).toHaveBeenCalledWith(expect.stringContaining(...))` which would all break if the wrapper migration changed the call shape from `clack.log.info(msg)` to `clack.log.info(msg, {})`. Rewriting 25 assertions vs. tightening the wrapper — the wrapper change is one source file plus a 3-line test update. The wrapper's behavior is preserved verbatim in JSON mode; only the human-mode call shape changes (from `(msg, {})` to `(msg)`), which exactly matches the pre-D-13 behavior of raw `clack.log.info(msg)`. Committed separately as `eb78f07` with a Rule 1 deviation note.

- **clack-output re-exports confirm/select/text additively.** The plan calls for a "full migration to the clack-output wrapper (D-13)" of preset.ts. preset.ts uses `p.text`, `p.select`, `p.confirm` for interactive prompts (preset save's framework/category prompts and preset use's conflict-resolution UI). The wrapper previously only re-exported logging/notification helpers. Extending it to also re-export the three interactive helpers is additive (no behavior change — they're plain `export from`) and keeps `preset.ts` clean of any direct `@clack/prompts` import.

- **preset show filePath resolution uses `path.join(getPresetsDir(), \`${name}.json\`)`.** The preset CRUD module already exports `getPresetsDir()` from `@tinkerise/core` (re-exported via `src/index.ts:39`). Constructing the path manually would duplicate the XDG-config-dir logic in two places and create drift risk. Reusing the helper means `tinkerise preset show` always reads back exactly what `tinkerise preset save` wrote.

- **`buildPresetListPayload` calls `loadPreset(name)` for every local entry to extract `description`.** This duplicates the file-read the production `preset list` human path already does. The alternative — exposing a `listPresetsWithDescriptions()` helper from `@tinkerise/core` — was out of scope for plan 33-03 (touches core). The current shape keeps all preset-list logic in the CLI layer.

- **`runDoctorChecks` exported with the `overrides?: DoctorCheck[]` shape rather than a full DI container.** The plan called this "I-09 option a" — the simplest possible test seam that lets the 33-04 conformance fixture inject `{ required: true, ok: false }` results without faking `checkPrerequisite`. The exported signature is `(overrides?: DoctorCheck[]) => Promise<CheckResult[]>` where `CheckResult = { check, result }`. The fixture can pass an array of synthetic checks with `installInstructions: { darwin: '...', linux: '', win32: '' }` to drive a deterministic failure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] clack-output wrapper passed `{}` in non-JSON mode, breaking call-site mocks**

- **Found during:** Task 3 (planning the preset.ts migration before writing RED tests)
- **Issue:** The Phase 33-02 wrapper always called `clack.log.info(msg, streamOpts())`, where `streamOpts()` returned `{ output: process.stderr }` in JSON mode and `{}` otherwise. That extra second argument in human mode meant the existing preset.test.ts mocks (~25 `toHaveBeenCalledWith(msg)` assertions) would receive `(msg, {})` and fail after the D-13 migration.
- **Fix:** `streamOpts()` now returns `undefined` outside JSON mode. Each log method branches: `opts ? clack.log.info(msg, opts) : clack.log.info(msg)`. The JSON-mode behavior is byte-identical; only the human-mode call shape changes — back to the pre-wrapper convention. The wrapper test was also updated to assert this (1 line change).
- **Files modified:** `packages/cli/src/utils/clack-output.ts`, `packages/cli/src/utils/__tests__/output-mode.test.ts`
- **Verification:** `bun run --filter @tinkerise/cli test` 405/405 pass; the migrated preset tests pass without modifying any existing `toHaveBeenCalledWith` assertion.
- **Committed in:** `eb78f07`

**2. [Rule 3 - Blocking] clack-output wrapper missing confirm/select/text re-exports**

- **Found during:** Task 3 GREEN (writing the migration)
- **Issue:** The wrapper only re-exported cancel/intro/isCancel/note/outro/spinner. preset.ts uses `p.text` (framework/category prompts), `p.select` (category + conflict-resolution prompts), and `p.confirm` (dependency approval). Without these in the wrapper, the migration would either need a parallel raw `@clack/prompts` import (defeating the D-13 migration goal) or break the interactive flow.
- **Fix:** Added `confirm, select, text` to the wrapper's `export from '@clack/prompts'` line. Purely additive — no logic changes.
- **Files modified:** `packages/cli/src/utils/clack-output.ts`
- **Verification:** `grep "from '@clack/prompts'" packages/cli/src/commands/preset.ts` returns 0; `bun run --filter @tinkerise/cli typecheck` exits 0; interactive preset save/use flows still work in smoke testing.
- **Committed in:** `e6f36ce` (folded into Task 3 GREEN since it's part of the migration)

**3. [Rule 3 - Blocking] Test harness `--json` registration**

- **Found during:** Task 3 RED (running new preset tests)
- **Issue:** The test helper `runPresetCommand` creates a fresh `Command()` instance and only calls `registerPresetCommand(program)`. The production CLI registers `--json` as a global option in `packages/cli/src/index.ts:87`, but the test harness was unaware of this. Commander rejected `preset list --json` and `preset show foo --json` with `error: unknown option '--json'`.
- **Fix:** Added `program.option('--json', 'Emit machine-readable JSON output')` to the test helper before `registerPresetCommand`. This mirrors the production wiring exactly.
- **Files modified:** `packages/cli/tests/commands/preset.test.ts`
- **Verification:** All 33 preset tests pass (21 existing + 12 new JSON tests).
- **Committed in:** `e6f36ce` (folded into Task 3 GREEN since it's a test-harness adjustment for the new subcommand)

**4. [Rule 1 - Lint] Test title started with uppercase letter**

- **Found during:** Task 2 GREEN (lint after adding new doctor tests)
- **Issue:** ESLint `test/prefer-lowercase-title` rejected `it('Node.js is required: true', ...)`. The project convention enforced by antfu's config is that test titles begin with a lowercase letter.
- **Fix:** Renamed to `it('node.js entry is required: true', ...)`.
- **Files modified:** `packages/cli/tests/commands/doctor.test.ts`
- **Verification:** `bun run --filter @tinkerise/cli lint` exits 0.
- **Committed in:** `6b17540` (folded into Task 2 GREEN)

**5. [Process Note] Initial Edit landed in main repo instead of worktree**

- **Found during:** Task 1 RED (running new tests — vitest reported 9 tests instead of 17)
- **Issue:** The first Edit call to add JSON tests landed in `/Users/impera/Documents/GitHub/tinkerise/packages/cli/tests/commands/list.test.ts` (the main repo on `main` branch) instead of the worktree path. The two checkouts are separate working trees with different file contents.
- **Fix:** `git -C <main-repo> checkout -- <file>` to revert the stray edit, then re-applied the Edit using the explicit worktree absolute path. No commits landed in main; the worktree is unaffected.
- **Files modified:** None permanently (the edit was reverted and reapplied in the correct location).
- **Verification:** `git -C <main-repo> status --short` shows no unrelated modifications; the worktree-only path was used for every subsequent Edit/Write.

---

**Total deviations:** 4 auto-fixed (1 Rule 1 bug, 2 Rule 3 blocking, 1 Rule 1 lint), plus 1 process self-correction during execution.

**Impact on plan:** Every fix preserves the plan's contract. The clack-output wrapper change is strictly safer (matches pre-D-13 calling convention; preserves all existing tests). The additive re-exports keep the migration clean. The test-harness change brings the unit test parity with production behavior.

## Issues Encountered

- **Conformance artifact path drift.** Running `bun run --filter @tinkerise/cli test` re-generates `packages/cli/tests/conformance/artifacts/runtime-error-report.json` with the worktree's absolute path baked in. The artifact diff is purely cosmetic (path + timestamps). Reverted after each test run via `git checkout -- packages/cli/tests/conformance/artifacts/runtime-error-report.json` to avoid polluting commits.

- **Test discovery confusion at the start of Task 1.** First Edit to `list.test.ts` landed in the wrong tree (see Deviation #5). Caught by noticing that `bunx vitest run` reported 9 tests instead of 17. Recovered without data loss by re-applying the Edit to the worktree-absolute path and verifying via `ls -la` on both paths to confirm the file sizes diverged.

## TDD Gate Compliance

Each task ran RED → GREEN explicitly:

| Task | RED commit (`test:`) | GREEN commit (`feat:`) |
| --- | --- | --- |
| T1 (list) | `6cbd247` | `0be7158` |
| T2 (doctor) | `b691151` | `6b17540` |
| T3 (preset) | `237b5a0` | `e6f36ce` |

A separate `fix(33-03):` commit (`eb78f07`) sits between T2 GREEN and T3 RED — it carries the clack-output wrapper deviation (Rule 1) and is the prerequisite that allows T3's RED tests to even compile without rewriting 25 mock expectations.

No refactor commits were needed.

## Verification Run Log

- `bun run --filter @tinkerise/cli typecheck` → exit 0
- `bun run --filter @tinkerise/cli lint` → exit 0
- `bun run --filter @tinkerise/cli build` → exit 0 (`dist/index.js` 587 KB)
- `bun run --filter @tinkerise/cli test` → 405/405 pass (7 skipped e2e)
- `bun run --filter @tinkerise/core test` → 652/652 pass
- `bun run --filter @tinkerise/shared test` → 73/73 pass
- `bun run typecheck` (whole repo) → exit 0
- Smoke: `node packages/cli/dist/index.js list --json | head -c 50` → `{"schemaVersion":1,"command":"list","data":{"scaff`
- Smoke: `node packages/cli/dist/index.js list web --json | python3 -c "..."` → `OK: empty templates+enhancements when filtered`
- Smoke: `node packages/cli/dist/index.js list bogus --json` → `{"error":{"code":"INVALID_CATEGORY",...}}` (via handleError JSON branch)
- Smoke: `node packages/cli/dist/index.js doctor --json | python3 -c "..."` → `summary: {'total': 10, 'passed': 3, 'failed': 7, 'requiredFailed': 0, 'optionalFailed': 7}`
- Smoke: `node packages/cli/dist/index.js preset list --json` → `{"schemaVersion":1,"command":"preset.list","data":{"local":[],"npm":[]}}`
- Smoke: `node packages/cli/dist/index.js preset show no-such --json` → `{"schemaVersion":1,"command":"preset.show","error":{"code":"PRESET_NOT_FOUND","message":"Preset not found: 'no-such'"}}`, exit 1
- Smoke: `node packages/cli/dist/index.js preset --help | grep 'show <name>'` → registered
- Regression: `node packages/cli/dist/index.js list` (no --json) → human table still renders ("Web", "Next.js")
- Regression: `node packages/cli/dist/index.js doctor` (no --json) → human table still renders
- Regression: `node packages/cli/dist/index.js preset list` (no --json) → "Local presets:" / "(none)" routed through wrapper

## User Setup Required

None — pure code/test changes, no external configuration.

## Next Phase Readiness

- **Plan 33-04 (docs + conformance):** the runtime behavior is now fully observable end-to-end. The conformance fixture can spawn the built CLI with `--json` arguments and assert against `ListEnvelopeV1Schema`, `DoctorEnvelopeV1Schema`, `PresetListEnvelopeV1Schema`, `PresetShowEnvelopeV1Schema` schemas. The `runDoctorChecks(overrides?: DoctorCheck[])` seam lets the doctor-required-failure scenario inject a deterministic failure (`{ required: true, ok: false }`) without spawning real processes (I-09 option a).
- **JSON Schema generation (33-04):** every envelope schema is exported from `@tinkerise/shared`; `z.toJSONSchema(...)` can emit JSON Schema artifacts for the docs site.
- **Verification gates that must hold for 33-04:** all the smoke tests above remain green. Specifically: list/doctor/preset.list/preset.show all emit single-JSON-object stdout, single trailing newline, zero stderr noise in JSON mode, and exit 1 only when expected (doctor required failure, preset show miss).

## Self-Check: PASSED

Files verified to exist:
- FOUND: `packages/cli/src/commands/list.ts` (modified)
- FOUND: `packages/cli/src/commands/doctor.ts` (modified)
- FOUND: `packages/cli/src/commands/preset.ts` (modified)
- FOUND: `packages/cli/src/utils/clack-output.ts` (modified)
- FOUND: `packages/cli/src/utils/__tests__/output-mode.test.ts` (modified)
- FOUND: `packages/cli/tests/commands/list.test.ts` (modified)
- FOUND: `packages/cli/tests/commands/doctor.test.ts` (modified)
- FOUND: `packages/cli/tests/commands/preset.test.ts` (modified)

Commits verified to exist in `git log --oneline`:
- FOUND: `6cbd247` test(33-03): T1 RED
- FOUND: `0be7158` feat(33-03): T1 GREEN
- FOUND: `b691151` test(33-03): T2 RED
- FOUND: `6b17540` feat(33-03): T2 GREEN
- FOUND: `eb78f07` fix(33-03): clack-output wrapper deviation
- FOUND: `237b5a0` test(33-03): T3 RED
- FOUND: `e6f36ce` feat(33-03): T3 GREEN

Acceptance grep checks re-verified:
- `list.ts`: `ListEnvelopeV1Schema` import 1, `emitJson/isJsonMode` import 1, `if (isJsonMode())` 1, `ListEnvelopeV1Schema.parse(` 1, `buildListPayload` 2
- `doctor.ts`: `required: boolean` 1 (interface), `required: true` 1 (Node.js, plus 1 comment), `required: false` 9, `DoctorEnvelopeV1Schema` import 1, `if (isJsonMode())` 1, `DoctorEnvelopeV1Schema.parse(` 1, `requiredFailed` 8+, `optionalFailed` 5+, `required_failed` 0, `export async function runDoctorChecks` 1, `runDoctorChecks(overrides?: DoctorCheck[])` 1
- `preset.ts`: schema imports 1, `emitJson/isJsonMode` 1, `.command('show <name>')` 1, `if (isJsonMode())` 2, `PresetListEnvelopeV1Schema.parse(` 1, `PresetShowEnvelopeV1Schema.parse(` 1, `throw new PresetNotFoundError` 3, `buildPresetListPayload` 2, `from '@clack/prompts'` 0, `from '../utils/clack-output'` 1, raw `p.{log,cancel,...}` 0, `getPresetsDir` 4, hardcoded preset path 0

---
*Phase: 33-json-structured-output-contract*
*Completed: 2026-05-12*
