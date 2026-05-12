---
phase: 33-json-structured-output-contract
plan: 01
subsystem: cli
tags: [cli, json, schema, zod, shared, contract]

# Dependency graph
requires:
  - phase: pre-existing @tinkerise/shared (registry + config schemas)
    provides: Zod 4 schema authoring conventions, barrel pattern, single-quote/no-semicolon style
provides:
  - ErrorPayloadSchema and makeEnvelope generic envelope builder (D-01..D-05, D-16)
  - ListEnvelopeV1Schema, DoctorEnvelopeV1Schema, PresetListEnvelopeV1Schema, PresetShowEnvelopeV1Schema
  - @tinkerise/shared barrel re-exports for all four envelopes + inferred TypeScript types
  - 31 unit tests proving D-21 (empty arrays), D-22 (omitted optionals), D-24 (snake_case requiredFailed and optionalFailed both required), D-05 (mutual exclusion) at parse time
affects: [33-02-cli-runtime, 33-03-command-branches, 33-04-docs-conformance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - z.union of two z.strictObject branches for mutually-exclusive { data } vs { error } variants
    - z.literal(schemaVersion) per envelope to pin the contract at parse time
    - Shared makeEnvelope<TCommand, TData> generic factory keeps every command envelope structurally identical
    - Co-located test file under packages/shared/tests/json-output/ matching vitest include glob (tests/**/*.test.ts)

key-files:
  created:
    - packages/shared/src/json-output/envelope.ts
    - packages/shared/src/json-output/list.ts
    - packages/shared/src/json-output/doctor.ts
    - packages/shared/src/json-output/preset-list.ts
    - packages/shared/src/json-output/preset-show.ts
    - packages/shared/src/json-output/index.ts
    - packages/shared/tests/json-output/schemas.test.ts
  modified:
    - packages/shared/src/index.ts

key-decisions:
  - "Use z.strictObject on each envelope branch so unknown keys cause rejection; otherwise Zod 4 would strip the offending key and silently accept { data, error } via the success branch, violating D-05."
  - "Place tests at packages/shared/tests/json-output/schemas.test.ts (mirroring src/) rather than packages/shared/src/json-output/__tests__/schemas.test.ts; the vitest config only includes tests/**/*.test.ts and rewriting it would have been out-of-scope."
  - "tsup bundles all schemas through the single src/index.ts entry into dist/index.js (and dist/index.d.ts); no separate dist/json-output/ files are emitted, but every schema is re-exported from the bundle for downstream consumers."

patterns-established:
  - "Pattern: every --json command envelope is built by makeEnvelope(command, payloadSchema, schemaVersion) so adding a new command means creating one payload schema, not duplicating envelope wiring."
  - "Pattern: optional fields use .optional() (D-22), never .nullable(); empty arrays are preserved (D-21) rather than omitted, so consumers can rely on the key existing."
  - "Pattern: doctor summary uses { total, passed, failed, requiredFailed, optionalFailed } with snake_case both-required fields (D-24); scripts pin against these names."

requirements-completed: [CLI-12, CLI-13, CLI-14, CLI-15]

# Metrics
duration: 8min
completed: 2026-05-12
---

# Phase 33 Plan 01: Shared Envelope Schemas Summary

**Zod 4 envelope + per-command payload schemas under @tinkerise/shared/json-output/ that own the tinkerise --json contract for list, doctor, preset.list, and preset.show — strict-object branches enforce D-05 mutual exclusion and z.literal pins each command's schemaVersion.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-12T06:40:38Z (per STATE.md last_updated)
- **Completed:** 2026-05-12T06:48:06Z
- **Tasks:** 2 (each split into TDD RED + GREEN commits, so 4 task commits)
- **Files created:** 7
- **Files modified:** 1

## Accomplishments

- ErrorPayloadSchema and a generic makeEnvelope<TCommand, TData>(command, dataSchema, schemaVersion) builder that returns a z.union of strict success and error envelopes
- Four per-command envelope schemas (list, doctor, preset.list, preset.show), each with its own payload schema and inferred TypeScript type, all built through makeEnvelope so D-01..D-05 are enforced uniformly
- Doctor summary locked to D-24 snake_case fields (total, passed, failed, requiredFailed, optionalFailed); both requiredFailed and optionalFailed are required and the schema rejects payloads missing either
- 31 unit tests cover the success/error variants, schemaVersion literal enforcement, command literal enforcement, D-21 empty arrays, D-22 omitted optional fields, and D-05 mutual exclusion of data and error
- @tinkerise/shared root barrel re-exports every schema and inferred type so plan 33-02 (CLI runtime) and 33-04 (docs JSON Schema generation) can consume them via `import { ... } from '@tinkerise/shared'`

## Task Commits

Each task ran TDD-style with separate RED (test) and GREEN (implementation) commits:

1. **Task 1 RED: failing tests for envelope + makeEnvelope** — `820be81` (test)
2. **Task 1 GREEN: ErrorPayloadSchema + makeEnvelope envelope builder** — `4f3622e` (feat)
3. **Task 2 RED: failing tests for list, doctor, preset-list, preset-show** — `c3e8e59` (test)
4. **Task 2 GREEN: four payload schemas + barrel + @tinkerise/shared root re-export** — `e94ad64` (feat)

(SUMMARY commit follows; orchestrator owns STATE/ROADMAP/REQUIREMENTS writes after the wave completes.)

## Files Created/Modified

- `packages/shared/src/json-output/envelope.ts` — ErrorPayloadSchema + makeEnvelope generic; z.strictObject on each branch + z.literal(schemaVersion) for D-01/D-02/D-05/D-16
- `packages/shared/src/json-output/list.ts` — ListEnvelopeV1Schema + ListPayloadV1Schema with ListScaffolderEntrySchema/ListTemplateEntrySchema/ListEnhancementEntrySchema (CLI-12)
- `packages/shared/src/json-output/doctor.ts` — DoctorEnvelopeV1Schema + DoctorPayloadV1Schema with DoctorCheckResultSchema and DoctorSummarySchema (snake_case requiredFailed + optionalFailed both required per D-24, CLI-13)
- `packages/shared/src/json-output/preset-list.ts` — PresetListEnvelopeV1Schema + PresetListPayloadV1Schema with PresetListLocalEntrySchema/PresetListNpmEntrySchema (CLI-14)
- `packages/shared/src/json-output/preset-show.ts` — PresetShowEnvelopeV1Schema + PresetShowDataV1Schema mirroring PresetData shape but with its own schemaVersion (CLI-14, D-01)
- `packages/shared/src/json-output/index.ts` — barrel re-exporting every envelope/payload schema and inferred type
- `packages/shared/tests/json-output/schemas.test.ts` — 31 Vitest cases proving D-01/D-02 (literal version), D-05 (mutual exclusion), D-21 (empty arrays), D-22 (omitted optionals), and D-24 (doctor summary both-required snake_case)
- `packages/shared/src/index.ts` — appended JSON output module re-exports (schemas + inferred types) so consumers import via `@tinkerise/shared`

## Decisions Made

- **z.strictObject on envelope branches:** Required to enforce D-05 mutual exclusion. With Zod 4's default strip-unknown behavior, a payload of `{ schemaVersion: 1, command: 'list', data, error }` would silently parse against the success branch with `error` stripped, defeating the mutual-exclusion contract. The plan's draft code used `z.object`; the test for D-05 caught this immediately and the fix is documented in the file's inline comment.
- **Test path under tests/ instead of src/__tests__:** The plan specifies `packages/shared/src/json-output/__tests__/schemas.test.ts`, but the package's vitest config (`include: ['tests/**/*.test.ts']`) and every other test in the package (e.g., `packages/shared/tests/config/schemas.test.ts`) live under `tests/` mirroring `src/`. Putting the file under `src/__tests__/` would have either (a) required editing the vitest config (out-of-scope; would affect every package in the monorepo via Turborepo cache) or (b) left the tests unrun. Matching the project's actual convention was the safer choice.
- **Single-bundle dist instead of dist/json-output/ subtree:** The plan's success criterion mentions `packages/shared/dist/json-output/` files, but `tsup.config.ts` declares `entry: ['src/index.ts']` and emits a single `dist/index.js` + `dist/index.d.ts`. Every json-output export is reachable from the bundle (verified via grep of `dist/index.d.ts` — 12 matches across the new schemas) and downstream consumers import from `@tinkerise/shared` which resolves to the bundle. Splitting the output would require restructuring the package exports field and is out of scope for this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Mutual exclusion was not enforced by plain z.object branches**

- **Found during:** Task 1 (RED → first GREEN attempt)
- **Issue:** The plan's envelope code used `z.object({...})` for the success and error branches. Zod 4 strips unknown keys by default, so `{ schemaVersion: 1, command: 'list', data: {...}, error: {...} }` parsed cleanly against the success branch (the `error` key was silently stripped). The D-05 mutual-exclusion test asserted `safeParse(...).success === false` and caught this.
- **Fix:** Switched both branches to `z.strictObject({...})`. Strict objects reject unknown keys, so the success branch refuses payloads carrying `error` (and vice versa), making mutual exclusion an actual parse-time contract.
- **Files modified:** `packages/shared/src/json-output/envelope.ts`
- **Verification:** `bun run --filter @tinkerise/shared test` — all 9 envelope tests pass, including the D-05 mutual-exclusion case.
- **Committed in:** `4f3622e` (Task 1 GREEN)

**2. [Rule 3 - Blocking] perfectionist/sort-exports forbade the export order shown in the plan**

- **Found during:** Task 2 (after GREEN tests passed, during `bun run lint`)
- **Issue:** ESLint's `perfectionist/sort-exports` rule requires source-path alphabetical ordering on every export-from statement. The plan's draft order in `src/index.ts` and `src/json-output/index.ts` listed exports in conceptual groupings, which the linter rejected with 4 errors.
- **Fix:** Ran `eslint --fix` against the two barrels to reorder export statements alphabetically. No semantic change — same identifiers exported from same files.
- **Files modified:** `packages/shared/src/index.ts`, `packages/shared/src/json-output/index.ts`
- **Verification:** `bun run --filter @tinkerise/shared lint` exits 0; `bun run --filter @tinkerise/shared test` still passes 73/73.
- **Committed in:** `e94ad64` (Task 2 GREEN — caught and folded into the same commit before staging)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking lint)
**Impact on plan:** Both fixes are correctness-required: without the strict-object switch, the D-05 mutual-exclusion contract is unenforceable; without the export reorder, the package fails lint and would block the merge. No scope creep.

## Issues Encountered

- **Worktree path confusion at the start of Task 1.** My first attempt to write the RED test file used the additional working directory (`/Users/impera/Documents/GitHub/tinkerise`, on `main`) instead of the assigned worktree (`/Users/impera/Documents/GitHub/tinkerise/.claude/worktrees/agent-a847a080662621111`, on the `worktree-agent-...` branch). I caught it before committing — the pre-commit HEAD assertion fired and refused to commit on `main`. Removed the stray file from the main checkout, re-wrote it in the worktree, and proceeded. No data lost.

## User Setup Required

None — pure schema layer with no external service configuration.

## Next Phase Readiness

- **Plan 33-02 (CLI runtime):** Can now `import { ListEnvelopeV1Schema, DoctorEnvelopeV1Schema, PresetListEnvelopeV1Schema, PresetShowEnvelopeV1Schema, ErrorPayloadSchema } from '@tinkerise/shared'` and call `Schema.parse(...)` before emit.
- **Plan 33-03 (command branches):** Has the inferred types (`ListPayloadV1`, `DoctorPayloadV1`, etc.) for constructing payloads in the per-command handlers.
- **Plan 33-04 (docs/conformance):** Can run `z.toJSONSchema(ListEnvelopeV1Schema)` etc. against the exported schemas to emit `--json` JSON Schema artifacts. All schemas are flat (no recursion) so Zod 4's toJSONSchema will not encounter cycles (T-33-03 disposition: accept).
- **Verification gates that must hold for downstream plans:** `bun run --filter @tinkerise/shared typecheck` (0), `bun run --filter @tinkerise/shared test` (73/73), `bun run --filter @tinkerise/shared build` (0), `bun run --filter @tinkerise/shared lint` (0), whole-repo `bun run typecheck` (0).

## Self-Check: PASSED

Files verified to exist:

- FOUND: `packages/shared/src/json-output/envelope.ts`
- FOUND: `packages/shared/src/json-output/list.ts`
- FOUND: `packages/shared/src/json-output/doctor.ts`
- FOUND: `packages/shared/src/json-output/preset-list.ts`
- FOUND: `packages/shared/src/json-output/preset-show.ts`
- FOUND: `packages/shared/src/json-output/index.ts`
- FOUND: `packages/shared/tests/json-output/schemas.test.ts`
- FOUND (modified): `packages/shared/src/index.ts`

Commits verified to exist in `git log --oneline`:

- FOUND: `820be81` test(33-01) — Task 1 RED
- FOUND: `4f3622e` feat(33-01) — Task 1 GREEN
- FOUND: `c3e8e59` test(33-01) — Task 2 RED
- FOUND: `e94ad64` feat(33-01) — Task 2 GREEN

TDD gate sequence verified: each task has a `test(...)` commit immediately followed by a `feat(...)` commit.

Verification commands re-run:

- `bun run --filter @tinkerise/shared test` → 73/73 pass
- `bun run --filter @tinkerise/shared typecheck` → 0
- `bun run --filter @tinkerise/shared build` → 0 (`dist/index.js` 9.93 KB, `dist/index.d.ts` 22.38 KB)
- `bun run --filter @tinkerise/shared lint` → 0
- `bun run typecheck` (whole repo) → 0 — downstream cli/core consumers still build

---
*Phase: 33-json-structured-output-contract*
*Completed: 2026-05-12*
