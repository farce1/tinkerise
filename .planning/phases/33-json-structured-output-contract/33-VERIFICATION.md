---
phase: 33-json-structured-output-contract
verified: 2026-05-12T09:45:00Z
status: passed
score: 13/13 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: null
  previous_score: null
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 33: `--json` Structured Output Contract Verification Report

**Phase Goal:** Script and CI authors can consume tinkerise read-only commands as stable, versioned JSON without parsing human-formatted output.
**Verified:** 2026-05-12T09:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria + cross-cutting must-haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `tinkerise list --json` returns machine-readable scaffolders/templates/enhancements on stdout, exit 0 (ROADMAP SC1) | VERIFIED | `node dist/index.js list --json` returns `{"schemaVersion":1,"command":"list","data":{"scaffolders":[...]}}`; conformance scenario `list-json-default` passes |
| 2 | `tinkerise doctor --json` returns structured diagnostics with per-check pass/fail and exit code reflects overall health (ROADMAP SC2) | VERIFIED | `node dist/index.js doctor --json` returns 10 checks + `summary:{total:10,passed:3,failed:7,requiredFailed:0,optionalFailed:7}`; Node.js carries `required:true`; conformance scenarios `doctor-json-pass` (exit 0) + `doctor-json-required-fail` (exit 1 via harness) pass |
| 3 | `tinkerise preset list --json` AND `tinkerise preset show <name> --json` parse without scraping text (ROADMAP SC3) | VERIFIED | `preset list --json` returns `{...,data:{local:[],npm:[]}}`; new `preset show <name>` subcommand registered (preset.ts:366) and emits full payload schema (`source`, `filePath`, `scaffold`, `enhancements`, `config`) |
| 4 | Every `--json` payload carries a `schemaVersion` field documented in the docs site (ROADMAP SC4) | VERIFIED | All four envelopes pin `z.literal(1)` on `schemaVersion` (envelope.ts:44); reference page documents it 12+ times; `apps/docs/public/schemas/{list,doctor,preset-list,preset-show}.v1.json` each contain `"const":1` constraint |
| 5 | Maintainer can run a test suite validating each `--json` emitter against the documented schema (ROADMAP SC5) | VERIFIED | `bun run --filter @tinkerise/cli test:conformance` runs 8 scenarios; live re-run produced `{total:8, passed:8, failed:0}` in 2.82s; each scenario asserts `JSON.parse(stdout)` + `SchemaV1Schema.safeParse(parsed)` + stdout-discipline + stderr-discipline + exit code |
| 6 | Stdout discipline: exactly one JSON object + single trailing newline; no clack/banner/log noise (D-12, D-13, D-15) | VERIFIED | Live `list --json 1>/dev/null 2>/tmp/err` → 0 bytes stderr; `python3 -c` confirms `data.count('\n') == 1`; conformance test enforces `stdout.endsWith('\n') && indexOf('\n') === length-1` with `stripFinalNewline: false` |
| 7 | Wrapped envelope `{schemaVersion, command, data}` or `{schemaVersion, command, error}` mutually exclusive (D-03, D-05) | VERIFIED | `makeEnvelope` uses `z.strictObject` on both branches (envelope.ts:43,49) — strict-object rejection prevents both `data` and `error` from coexisting; 31 shared schema tests exercise success/error variants |
| 8 | `doctor --json` exit code: 0 when `summary.requiredFailed === 0`; 1 otherwise (D-11, D-23, D-24) | VERIFIED | doctor.ts:260 emits data envelope, exits 1 only when `anyRequiredFailed`; conformance scenario `doctor-json-required-fail` uses harness to inject a `required:true` failing check and asserts exit 1 + data envelope (not error envelope) |
| 9 | Schema source of truth: Zod 4 in `@tinkerise/shared/src/json-output/`; JSON Schema files generated at docs build time (D-16, D-17) | VERIFIED | Six files exist at `packages/shared/src/json-output/`; `apps/docs/scripts/generate-json-schemas.ts` calls `z.toJSONSchema(schema, {target: 'draft-2020-12'})`; `apps/docs/package.json` build chain: `docs:changelog && docs:schemas && astro build`; idempotency re-verified — `docs:schemas && git diff --exit-code apps/docs/public/schemas` exits 0 |
| 10 | Update-check fully suppressed in JSON mode — neither stdout banner nor stderr noise (D-15) | VERIFIED | index.ts:36 `updateCheckPromise = isJsonMode() ? Promise.resolve(null) : checkForUpdate().catch(...)`; index.ts:239 `parseAsync().then(async () => { if (isJsonMode()) return ... })`; live smoke shows 0 bytes stderr in `list --json` |
| 11 | `--json` registered as global program option for `--help` symmetry | VERIFIED | index.ts:87 `.option('--json', 'Emit machine-readable JSON output (list, doctor, preset list/show)')` |
| 12 | `preset show <name>` missing preset → PRESET_NOT_FOUND error envelope, exit 1 (D-08) | VERIFIED | Live: `node dist/index.js preset show no-such-preset-zzz --json` returns `{"schemaVersion":1,"command":"preset.show","error":{"code":"PRESET_NOT_FOUND","message":"Preset not found: 'no-such-preset-zzz'"}}`, exit 1; conformance scenario `preset-show-json-not-found` asserts the same |
| 13 | `preset.ts` migrated off raw `@clack/prompts` to clack-output wrapper (D-13) | VERIFIED | `grep -c "from '@clack/prompts'" packages/cli/src/commands/preset.ts` returns 0; `grep -nE "p\.(log|cancel|intro|outro|spinner|note|isCancel|text|select|confirm)"` returns 0 matches |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/shared/src/json-output/envelope.ts` | ErrorPayloadSchema + makeEnvelope generic builder | VERIFIED | Exports both; uses `z.strictObject` on both branches to enforce D-05 mutual exclusion (auto-fixed deviation noted in 33-01 SUMMARY) |
| `packages/shared/src/json-output/list.ts` | ListEnvelopeV1Schema | VERIFIED | Pins `schemaVersion: 1`, command `'list'`, scaffolders/templates/enhancements payload |
| `packages/shared/src/json-output/doctor.ts` | DoctorEnvelopeV1Schema with snake_case summary | VERIFIED | DoctorCheckResultSchema has `required: z.boolean()`; DoctorSummarySchema declares both `requiredFailed` and `optionalFailed` as required |
| `packages/shared/src/json-output/preset-list.ts` | PresetListEnvelopeV1Schema | VERIFIED | local + npm arrays; description optional per D-22 |
| `packages/shared/src/json-output/preset-show.ts` | PresetShowEnvelopeV1Schema mirroring PresetData shape | VERIFIED | name/source/scaffold/enhancements/config required; filePath optional |
| `packages/shared/src/json-output/index.ts` + `packages/shared/src/index.ts` | Barrel re-export | VERIFIED | All four envelope schemas + inferred types exported from `@tinkerise/shared` |
| `packages/cli/src/utils/output-mode.ts` | detectJsonMode/isJsonMode/emitJson | VERIFIED | Module-evaluation argv inspection; byte-exact `JSON.stringify(payload)\n` write |
| `packages/cli/src/utils/clack-output.ts` | stderr-injecting log wrapper | VERIFIED | streamOpts returns `{output: stderr}` in JSON mode, `undefined` otherwise; re-exports cancel/confirm/intro/isCancel/note/outro/select/spinner/text |
| `packages/core/src/errors/base.ts` | InteractivePromptBlockedError + JsonUnsupportedCommandError | VERIFIED | Both classes exist at lines 224 and 239; codes `INTERACTIVE_PROMPT_BLOCKED` and `JSON_UNSUPPORTED_COMMAND` |
| `packages/cli/src/utils/error-handler.ts` | JSON-mode branch FIRST in handleError | VERIFIED | Line 134 `if (isJsonMode())` — emits envelope via `emitJson()` then `process.exit(exitCode)`, preventing fallthrough |
| `packages/cli/src/commands/list.ts` | JSON early-return + buildListPayload | VERIFIED | Line 119 `if (isJsonMode())` + Schema.parse before emit |
| `packages/cli/src/commands/doctor.ts` | required field on every entry; runDoctorChecks seam; exit-1 gate | VERIFIED | 1× `required:true` (Node.js) + 9× `required:false` + 1 interface declaration; `export async function runDoctorChecks(overrides?: DoctorCheck[])` at line 175; exit-1 gate at line 264 |
| `packages/cli/src/commands/preset.ts` | preset show subcommand + JSON branches + clack-output migration | VERIFIED | `.command('show <name>')` at line 366; 2× `if (isJsonMode())`; uses `getPresetsDir()` (no hardcoded path); zero raw clack imports |
| `apps/docs/scripts/generate-json-schemas.ts` | Build-time Zod→JSON Schema codegen | VERIFIED | Uses `import { z } from 'zod/v4'` to bypass docs zod@3 pin (documented decision); `z.toJSONSchema(schema, {target:'draft-2020-12'})` for all 4 schemas |
| `apps/docs/public/schemas/{list,doctor,preset-list,preset-show}.v1.json` | Four JSON Schema files | VERIFIED | All 4 files exist; each has `$schema: draft/2020-12`; each pins `"const": 1` for schemaVersion; doctor schema contains `requiredFailed` (2×) + `optionalFailed` (2×), zero `required_failed` |
| `apps/docs/src/content/docs/reference/json-output.mdx` | Reference docs page | VERIFIED | Documents D-04 versioning policy, D-05 error envelope, D-12 stdout discipline, D-15 update-check suppression, D-21 empty arrays, D-22 optional omission, D-23/D-24 doctor data envelope + snake_case summary; 4 schema links; all 4 commands with literal JSON examples |
| `packages/cli/tests/conformance/json-output-matrix.test.ts` + fixture | 8-scenario conformance matrix | VERIFIED | Test enforces JSON.parse + safeParse + endsWith('\n') + single newline + forbidden stderr `re:^\s*\{` + exit code + envelope kind + expectedErrorCode + dataAssert predicate |
| `packages/cli/tests/conformance/harness/doctor-required-fail-harness.mjs` | Deterministic seam consumer | VERIFIED | Uses `jiti.import()` of `src/commands/doctor.ts` (tsup single-bundle pivot); injects a fake `required:true, ok:false` check; emits validated envelope; exits 1 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `packages/cli/src/index.ts` | `output-mode.ts` | `detectJsonMode()` BEFORE `checkForUpdate()` | WIRED | Line 33 (detectJsonMode) precedes line 36 (`isJsonMode() ? Promise.resolve(null) : checkForUpdate()`) — line-order asserted |
| `packages/cli/src/utils/error-handler.ts` | `output-mode.ts` | `isJsonMode()` guard at TOP of handleError | WIRED | Line 134 is FIRST statement after the function body opens; ends with `process.exit(exitCode)` |
| `packages/cli/src/utils/clack-output.ts` | `@clack/prompts` | wraps log.* with `{output: process.stderr}` in JSON mode | WIRED | streamOpts() returns `{output: process.stderr}` when `isJsonMode()` is true |
| `packages/cli/src/commands/list.ts` | `@tinkerise/shared` | imports ListEnvelopeV1Schema + Schema.parse before emit | WIRED | line 13 import + line 121 `ListEnvelopeV1Schema.parse(...)` |
| `packages/cli/src/commands/doctor.ts` | `@tinkerise/shared` | imports DoctorEnvelopeV1Schema + Schema.parse before emit | WIRED | line 12 import + line 262 parse |
| `packages/cli/src/commands/preset.ts` | `@tinkerise/shared` | imports PresetList + PresetShow Envelope schemas | WIRED | line 39 import; both `.parse(...)` calls present |
| `packages/cli/src/commands/preset.ts` | `clack-output` wrapper | imports log/cancel/intro/etc. (NOT `@clack/prompts`) | WIRED | line 49 imports from `'../utils/clack-output.js'`; 0 raw `@clack/prompts` imports |
| `packages/cli/src/commands/doctor.ts` | exit gate | `summary.requiredFailed > 0 → process.exit(1)` | WIRED | Line 264 `if (anyRequiredFailed) process.exit(1)` after envelope emit |
| `apps/docs/scripts/generate-json-schemas.ts` | `@tinkerise/shared` | imports the four envelope schemas; calls `z.toJSONSchema` | WIRED | Lines 23–28 import all 4; `z.toJSONSchema(schema, {target:'draft-2020-12'})` at line 43 |
| `apps/docs/package.json` | `generate-json-schemas.ts` | build chain: `docs:changelog && docs:schemas && astro build` | WIRED | build script explicit; tsx is a devDep |
| `packages/cli/tests/conformance/json-output-matrix.test.ts` | `@tinkerise/shared` | imports all four schemas into SCHEMA_MAP | WIRED | lines 5–10; SCHEMA_MAP keyed by 'list'/'doctor'/'preset-list'/'preset-show' |
| `packages/cli/tests/conformance/json-output-matrix.test.ts` | `packages/cli/dist/index.js` | execaNode invokes the built CLI per scenario | WIRED | Lines 152–164 with `stripFinalNewline: false` |
| `harness/doctor-required-fail-harness.mjs` | `doctor.ts` runDoctorChecks seam | jiti-loaded import of TS source | WIRED | createJiti + jiti.import resolves the seam at runtime |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| list.ts JSON branch | `data` (buildListPayload result) | `getAllScaffolders()` + `TEMPLATE_METADATA` + `allEnhancementModules` + per-scaffolder `checkPrerequisite` | Yes — live run returns full Next.js entry with name/category/displayName/packageName/prereqOk/supportedFlags | FLOWING |
| doctor.ts JSON branch | `payload` (runDoctorChecksForJson result) | `runDoctorChecks(DOCTOR_CHECKS)` → per-check tool detection | Yes — live run returns 10 entries with computed `requiredFailed:0, optionalFailed:7`; Node.js entry shows `required:true, version:"…"` | FLOWING |
| preset.ts list JSON branch | `data` (buildPresetListPayload result) | `listPresets()` + `discoverNpmPresets(cwd)` + per-preset `loadPreset` | Yes — live empty case returns `{local:[],npm:[]}`; conformance pre-seeded scenario validates non-empty | FLOWING |
| preset.ts show JSON branch | `data` (presetData + source + filePath) | `loadPreset(name)` → fallback `loadNpmPreset(...)` → `getPresetsDir()` join | Yes — conformance `preset-show-json-found` asserts `data.name === 'phase33-fixture-preset' && data.source === 'local' && typeof data.filePath === 'string'` |
| error-handler.ts JSON branch | error envelope `code` + `message` | `error.code` (TinkeriseError) / `toStableCode(error.code)` (CommanderError) / `'UNEXPECTED_RUNTIME'` fallback; `error.message` for the human-readable string | Yes — PRESET_NOT_FOUND envelope contains the live preset name | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `list --json` emits valid envelope | `node packages/cli/dist/index.js list --json 2>/dev/null \| head -c 200` | starts with `{"schemaVersion":1,"command":"list","data":{"scaffolders":[…` | PASS |
| `doctor --json` emits snake_case summary | `node packages/cli/dist/index.js doctor --json` then JSON.parse | `summary:{total:10,passed:3,failed:7,requiredFailed:0,optionalFailed:7}` (zero `required_failed` keys); Node.js entry `required:true` | PASS |
| `preset list --json` preserves empty arrays | `node packages/cli/dist/index.js preset list --json` | `{"schemaVersion":1,"command":"preset.list","data":{"local":[],"npm":[]}}`; exit 0 | PASS |
| `preset show` missing → error envelope | `node packages/cli/dist/index.js preset show no-such-preset-zzz --json; echo $?` | `{"schemaVersion":1,"command":"preset.show","error":{"code":"PRESET_NOT_FOUND",…}}`; exit 1 | PASS |
| Stdout/stderr discipline | `list --json 1>/dev/null 2>/tmp/err; wc -c < /tmp/err` | 0 bytes on stderr | PASS |
| Single trailing newline (D-12) | `list --json 2>/dev/null \| python3 -c "import sys; d=sys.stdin.read(); print(d.endswith('\\n'), d.count('\\n')==1)"` | `True True` | PASS |
| Conformance matrix end-to-end | `bun run --filter @tinkerise/cli test:conformance` | 8/8 Phase 33 scenarios pass + 8/8 Phase 31 scenarios still pass (total 16/16, 2.82s) | PASS |
| docs:schemas idempotency | `bun run --filter @tinkerise/docs docs:schemas && git diff --exit-code apps/docs/public/schemas` | exit 0 (no drift) | PASS |
| Harness deterministic injection | `node packages/cli/tests/conformance/harness/doctor-required-fail-harness.mjs` | envelope contains the synthetic `phase33-fake-required` check; `requiredFailed:1`; exit 1 | PASS |
| Tarball exclusion (T-33-15) | `cd packages/cli && npm pack --dry-run` | Files: README.md + dist/index.{js,d.ts,js.map} + package.json; NO schema files | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLI-12 | 33-01, 33-02, 33-03, 33-04 | `tinkerise list --json` emits machine-readable list of scaffolders and enhancements | SATISFIED | ListEnvelopeV1Schema; list.ts JSON branch; conformance scenarios `list-json-default`, `list-json-filtered`, `list-json-invalid-category` pass |
| CLI-13 | 33-01, 33-02, 33-03, 33-04 | `tinkerise doctor --json` emits machine-readable diagnostics with pass/fail per check | SATISFIED | DoctorEnvelopeV1Schema with required field + summary; doctor.ts JSON branch with exit-1 gate; conformance scenarios `doctor-json-pass`, `doctor-json-required-fail` pass |
| CLI-14 | 33-01, 33-02, 33-03, 33-04 | `tinkerise preset list --json` AND `preset show <name> --json` emit machine-readable preset data | SATISFIED | PresetListEnvelopeV1Schema + PresetShowEnvelopeV1Schema; preset list/show JSON branches; new `preset show <name>` subcommand; conformance scenarios `preset-list-json-empty`, `preset-show-json-found`, `preset-show-json-not-found` pass |
| CLI-15 | 33-01, 33-02, 33-04 | `--json` output uses a documented schema with `schemaVersion` field | SATISFIED | All 4 envelopes pin `z.literal(1)`; 4 JSON Schema artifacts at `apps/docs/public/schemas/` with `"const":1`; docs page documents schemaVersion + D-04 versioning policy + per-command examples; conformance scenarios assert `schemaVersion` per scenario via SCHEMA_MAP |

All four phase requirement IDs declared in PLAN frontmatter are addressed by code, schemas, docs, and conformance test evidence. No orphaned IDs.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | – | No TODO/FIXME/PLACEHOLDER comments found in phase 33 modified files | – | – |
| (info) | doctor.ts:175 | `runDoctorChecks(overrides?: DoctorCheck[])` is a TEST SEAM exported from production code | Info | Intentional — documented in 33-03 SUMMARY (I-09 option a) and consumed by harness; not a leaky abstraction |
| (info) | json-output-matrix.test.ts:219 | `new Function('data', ...)` for dataAssert evaluation | Info | Documented in T-33-19 threat model: dataAssert strings come ONLY from committed fixture; eslint-disable + threat citation present in source |

### Human Verification Required

(none)

All success criteria were verifiable programmatically via live command execution, schema parse checks, and the 8-scenario conformance matrix. Visual/UX aspects of the new `preset show` human-mode output are not part of the JSON contract phase and remain out of scope.

### Notes (informational — does not affect status)

1. **ROADMAP cross-cutting constraint terminology drift.** ROADMAP line 123 says `summary.required_failed` (snake-snake) but the locked decision D-24 (referenced on the same line) and the actual implementation use `requiredFailed` (camelCase). All five layers (Zod source, runtime code, JSON Schema, docs page, conformance fixture) consistently use `requiredFailed` + `optionalFailed`. The ROADMAP text appears to predate the D-24 lock. Implementation is correct; the ROADMAP text should be updated at milestone closeout for clarity but does not block phase 33.

2. **Test seam `runDoctorChecks` exported from production CLI code.** Documented design choice (I-09 option a) consumed by the conformance harness via jiti. Not part of the public CLI API surface; not published in the tarball.

3. **`apps/docs` retains `zod@^3` runtime pin** (Astro/Starlight require it); the codegen script imports `from 'zod/v4'` — zod@3 ships the v4 API on this subpath specifically for migration. Documented in 33-04 SUMMARY decisions.

### Gaps Summary

No gaps. Every observable truth has supporting code, every artifact exists with substantive content (not stubs), every key link is wired and exercised, and the live re-run of `bun run --filter @tinkerise/cli test:conformance` reproduced 8/8 Phase 33 scenarios passing (16/16 across both Phase 31 + Phase 33 matrices). The phase goal — script and CI authors can consume read-only tinkerise commands as stable, versioned JSON — is fully achieved.

---

*Verified: 2026-05-12T09:45:00Z*
*Verifier: Claude (gsd-verifier)*
