---
phase: 02-scaffolder-registry-execution
verified: 2026-02-18T15:26:00Z
status: passed
score: 7/7 requirements verified
re_verification: false
---

# Phase 2: Scaffolder Registry & Execution Verification Report

**Phase Goal:** Declarative scaffolder registry with flag mapping, prerequisite checking, integration strategy dispatch, and framed execution output
**Verified:** 2026-02-18T15:26:00Z
**Status:** PASSED
**Re-verification:** No -- initial verification

---

## Summary

| Status | Count |
|--------|-------|
| PASS | 7 |
| PARTIAL PASS | 0 |
| FAIL | 0 |
| **Total** | **7** |

**Overall: PASSED** -- All 7 requirements (REG-01 through REG-05, UX-06, UX-07) satisfied with specific source code and test evidence.

---

## Environment

| Property | Value |
|----------|-------|
| Verification Date | 2026-02-18 |
| Node.js | v24.4.1 |
| Bun | 1.1.9 |
| Vitest | 4.0.18 |
| OS | macOS Darwin 24.6.0 (darwin-arm64) |

---

## Requirement Verification

### REG-01: Declarative Registry (Data-Only Architecture)

**Status:** PASS

**Evidence:**

The registry follows a strict data-only architecture pattern. Adding a new scaffolder requires zero logic changes -- only a `defineScaffolder()` data call.

1. **`defineScaffolder()` is a pure data helper** (`packages/shared/src/registry/define.ts`, line 26):
   ```ts
   export function defineScaffolder(entry: ScaffolderEntry): ScaffolderEntry {
     return ScaffolderEntrySchema.parse(entry) as ScaffolderEntry
   }
   ```
   No logic branching, no conditionals, no side effects -- just Zod validation and passthrough.

2. **Category files contain ONLY `defineScaffolder()` calls**:
   - `packages/core/src/registry/scaffolders/web.ts` (187 lines): 7 entries (nextjs, vite, astro, t3, remix, tanstack, turbo). Each is a `defineScaffolder({...})` call with static data. No conditionals, no per-scaffolder logic. Only shared helper is `nodePrerequisite()` which is itself a pure data factory.
   - `packages/core/src/registry/scaffolders/backend.ts` (205 lines): 5 entries (fastapi, django, go, rust, express). Same pattern. Shared prerequisite helpers (`pythonPrerequisite`, `goPrerequisite`, `rustPrerequisite`) are pure data factories.
   - `packages/core/src/registry/scaffolders/mobile.ts` (80 lines): 2 entries (flutter, reactnative). Same pattern.

3. **`register()` in `index.ts` is a generic loop** (`packages/core/src/registry/index.ts`, lines 21-28):
   ```ts
   function register(...entries: ScaffolderEntry[]): void {
     for (const entry of entries) {
       if (registry.has(entry.name)) {
         throw new Error(`Duplicate scaffolder: '${entry.name}' is already registered`)
       }
       registry.set(entry.name, entry)
     }
   }
   ```
   No `if`/`switch` on scaffolder name. No per-scaffolder logic. Purely generic Map insertion.

4. **Test confirms data-only pattern** (`packages/core/tests/registry/registry.test.ts`, lines 61-77):
   Test "adding a scaffolder is a data-only operation" creates a new scaffolder with `defineScaffolder()` and verifies it validates without any logic changes to the registry.

**Notes:** This is the architecture pattern itself, not just entry existence. All 14 scaffolders (7 web + 5 backend + 2 mobile) follow the identical declarative pattern.

---

### REG-02: Flag Mapping Per Entry

**Status:** PASS

**Evidence:**

1. **`FlagMappingSchema` defines flag mapping shape** (`packages/shared/src/registry/schemas.ts`, lines 29-38):
   Schema specifies `unified` (tinkerise name), `native` (upstream flag), optional `nativeDisable`, and optional `valueMap` for value flags.

2. **Multiple scaffolders have populated `flags` arrays**:
   - Next.js (`web.ts`, lines 32-39): 6 flag mappings (typescript, tailwind, eslint, no-git, no-install, package-manager with valueMap)
   - Astro (`web.ts`, lines 91-96): 4 flag mappings (typescript, tailwind, no-git, no-install)
   - T3 (`web.ts`, lines 113-119): 5 flag mappings
   - Flutter (`mobile.ts`, lines 43-45): 2 flag mappings (platforms, no-install)
   - React Native (`mobile.ts`, lines 74-77): 2 flag mappings (no-install, typescript)

3. **`resolveFlags()` consumes these mappings** (`packages/core/src/flags/resolver.ts`, lines 31-83):
   Iterates `activeFlagDefs`, matches against `userFlags`, handles boolean flags (true/false), multi-word native flags (split on whitespace), value-mapped flags (prefix-style and space-separated), and empty string sentinels.

4. **Tests verify flag resolution** (`packages/core/tests/flags/resolver.test.ts`):
   - "maps { typescript: true } to ['--typescript']" (line 30-34)
   - "maps { typescript: false } with nativeDisable to disable flag" (line 36-39)
   - "maps multiple boolean flags" (line 46-52)
   - "maps value flag with prefix-style native" (line 88-93)

5. **Schema tests verify flag mapping structure** (`packages/shared/tests/registry/schemas.test.ts`, lines 70-97):
   3 tests on FlagMappingSchema: full fields, minimal fields, rejection of missing required fields.

---

### REG-03: Prerequisite Specification

**Status:** PASS

**Evidence:**

1. **`PrerequisiteSchema` defines prerequisite shape** (`packages/shared/src/registry/schemas.ts`, lines 15-24):
   Schema specifies `command`, `versionFlag` (default `'--version'`), optional `versionRange` (semver), optional `installInstructions` (platform map).

2. **`checkPrerequisite()` validates prerequisites** (`packages/core/src/prerequisites/checker.ts`, lines 44-94):
   Uses `which` for PATH lookup, `execa` for version detection, `semver.coerce` + `semver.satisfies` for version validation. Returns `PrereqResult` with ok/error/installInstructions.

3. **`checkPrerequisites()` orchestrates full check** (`checker.ts`, lines 101-110):
   Runs all prerequisites in parallel with `Promise.all`, throws `PrerequisiteError` if any fail.

4. **Scaffolder entries have `prerequisites` arrays**:
   - Next.js: 1 prerequisite (node >=18.17.0)
   - FastAPI: 2 prerequisites (python3 >=3.10, fastapi-admin)
   - Go: 2 prerequisites (go >=1.22, go-blueprint) -- two-level ordering
   - Flutter: 1 prerequisite (flutter >=3.10.0)

5. **Schema tests verify prerequisite structure** (`schemas.test.ts`, lines 99-122):
   3 tests: complete prerequisite with installInstructions, default versionFlag, optional fields.

---

### REG-04: Integration Strategy Per Entry

**Status:** PASS

**Evidence:**

1. **`IntegrationStrategySchema` as discriminated union** (`packages/shared/src/registry/schemas.ts`, lines 58-74):
   Three variants: `delegate` (with `command`), `wrap` (with `command`), `template` (with `templateDir`). Uses `z.discriminatedUnion('type', [...])`.

2. **`buildCommandArgs()` handles all strategy types** (`packages/core/src/executor/index.ts`, lines 117-145):
   ```ts
   switch (entry.integration.type) {
     case 'delegate':
       args.push(...entry.integration.command.split(/\s+/), projectName, ...nativeArgs)
       break
     case 'wrap':
       args.push(...entry.integration.command.split(/\s+/), projectName, ...nativeArgs)
       break
     case 'template':
       args.push(projectName, ...nativeArgs)
       break
   }
   ```
   Multi-word commands split on spaces (e.g., `'@tanstack/cli create'`). Passthrough args appended after `--` separator.

3. **Entries use different strategies**:
   - Most scaffolders use `delegate` (Next.js, Vite, Astro, etc.)
   - Wrap strategy defined in schema (available for future use)
   - Template strategy defined in schema (used by utility templates in Phase 9)

4. **Tests verify all three strategies** (`packages/core/tests/executor/executor.test.ts`, lines 30-55):
   - "delegate strategy: [command, projectName, ...flags]"
   - "wrap strategy: [command, projectName, ...flags]"
   - "template strategy: [projectName, ...flags]"
   - "appends passthrough args after -- separator"
   - "no -- separator when passthrough args are empty"

5. **Schema tests verify discriminated union** (`schemas.test.ts`, lines 124-143):
   4 tests: delegate, wrap, template parsing + rejection of unknown type.

---

### REG-05: Version-Aware Flag Mappings

**Status:** PASS

**Evidence:**

1. **`VersionedFlagMapSchema` in schemas** (`packages/shared/src/registry/schemas.ts`, lines 44-49):
   ```ts
   export const VersionedFlagMapSchema = z.object({
     versionRange: z.string(),
     flags: z.array(FlagMappingSchema),
   })
   ```

2. **Version-aware branch in `resolveFlags()`** (`packages/core/src/flags/resolver.ts`, lines 38-46):
   ```ts
   if (upstreamVersion && entry.versionedFlags?.length) {
     const match = entry.versionedFlags.find(vf =>
       semver.satisfies(upstreamVersion, vf.versionRange),
     )
     if (match) {
       activeFlagDefs = match.flags
       versionUsed = match.versionRange
     }
   }
   ```
   Uses `semver.satisfies()` to match detected upstream version against registered ranges.

3. **Concrete example: Next.js >=15.0.0** (`packages/core/src/registry/scaffolders/web.ts`, lines 40-52):
   ```ts
   versionedFlags: [
     {
       versionRange: '>=15.0.0',
       flags: [
         { unified: 'typescript', native: '--ts' },       // changed from '--typescript'
         { unified: 'tailwind', native: '--tailwind' },
         { unified: 'eslint', native: '--eslint' },
         { unified: 'no-git', native: '--disable-git' },  // changed from '--skip-git'
         { unified: 'no-install', native: '--skip-install' },
         { unified: 'package-manager', native: '--use-', valueMap: { ... } },
       ],
     },
   ],
   ```
   Real version range with actual flag differences between Next.js <15 and >=15.

4. **Resolver tests verify version-aware resolution** (`packages/core/tests/flags/resolver.test.ts`, lines 55-85):
   - "uses base flags when no upstream version detected" -- returns `['--typescript']`, versionUsed null
   - "uses base flags when version does not match any range" -- version `'14.2.0'` falls through
   - "uses versioned flags when version matches range" -- version `'15.1.0'` returns `['--ts']`, versionUsed `'>=15.0.0'`

5. **Schema test** (`schemas.test.ts`, lines 145-155):
   "parses valid versioned flag map" verifies VersionedFlagMapSchema.

---

### UX-06: Inherited stdio for Upstream Output

**Status:** PASS

**Evidence:**

1. **`spawnScaffolder()` uses `stdio: 'inherit'`** (`packages/core/src/executor/process.ts`, lines 24-36):
   ```ts
   export async function spawnScaffolder(
     command: string, args: string[], options: SpawnOptions = {},
   ): Promise<SpawnResult> {
     const result = await execa(command, args, {
       stdio: 'inherit',
       cwd: options.cwd,
       reject: false,
     })
     return { exitCode: result.exitCode ?? 1 }
   }
   ```
   `stdio: 'inherit'` gives the subprocess direct terminal access for interactive prompts, colored output, and progress indicators.

2. **Executor pipeline calls `spawnScaffolder()`** (`packages/core/src/executor/index.ts`, line 100):
   ```ts
   const result = await spawnScaffolder(entry.command, commandArgs, { cwd })
   ```
   Called at step 7 of the execute pipeline, after prerequisite checks, version detection, and flag resolution.

3. **Module documentation confirms intent** (`process.ts`, lines 1-8):
   "stdio: 'inherit' gives the subprocess direct terminal access, enabling interactive prompts, colored output, and progress indicators to pass through to the user unmodified (UX-06)."

---

### UX-07: Distinguishable Tinkerise Output

**Status:** PASS

**Evidence:**

1. **`tinkeriseLog()` uses dimmed `[tinkerise]` prefix** (`packages/core/src/executor/framing.ts`, lines 15-17):
   ```ts
   export function tinkeriseLog(message: string): void {
     console.log(pc.dim(`[tinkerise] ${message}`))
   }
   ```
   Uses `picocolors` `dim()` for gray/dimmed styling. The `[tinkerise]` prefix visually separates orchestration output from upstream tool output.

2. **Framing tests verify the prefix pattern** (`packages/core/tests/executor/framing.test.ts`, lines 15-21):
   Test "outputs message with [tinkerise] prefix":
   ```ts
   tinkeriseLog('Hello world')
   const output = logSpy.mock.calls[0]![0] as string
   expect(output).toContain('[tinkerise]')
   expect(output).toContain('Hello world')
   ```

3. **Additional framing utilities** (`framing.ts`):
   - `tinkeriseSummary()` (line 23): one-liner post-execution summary using `tinkeriseLog()`
   - `tinkeriseBlankLine()` (line 31): visual separator between framing and upstream output
   - `tinkeriseSummaryCard()` (line 39): enhanced post-scaffold summary card with display name, flags, and next steps

4. **Framing tests are comprehensive** (`framing.test.ts`): 9 tests total covering tinkeriseLog, tinkeriseSummary, tinkeriseBlankLine, and tinkeriseSummaryCard with metadata lookup, flags display, and fallback behavior.

---

## Test Results Summary

| Test File | Tests | Status |
|-----------|-------|--------|
| `packages/shared/tests/registry/schemas.test.ts` | 18 | ALL PASS |
| `packages/core/tests/registry/registry.test.ts` | 8 | ALL PASS |
| `packages/core/tests/flags/resolver.test.ts` | 8 | ALL PASS |
| `packages/core/tests/executor/executor.test.ts` | 7 | ALL PASS |
| `packages/core/tests/executor/framing.test.ts` | 9 | ALL PASS |
| **Total** | **50** | **ALL PASS** |

---

## Gaps Found

None. All 7 requirements verified with specific file paths, line numbers, and test evidence. No code changes or fixes required.

---

## Human Verification Required

### 1. End-to-End Scaffold Execution

**Test:** Run `tinkerise web next my-app` on a machine with Node.js >= 18.17.0
**Expected:** Tinkerise framing messages appear dimmed with `[tinkerise]` prefix; create-next-app runs with inherited stdio (interactive prompts visible); post-scaffold summary card displayed
**Why human:** Requires actual process spawning and visual terminal output verification

### 2. Version-Aware Flag Resolution

**Test:** Run `tinkerise web next my-app --typescript` with create-next-app >= 15.0.0 installed
**Expected:** Resolver detects version >= 15.0.0 and maps `--typescript` to `--ts` (Next.js 15 flag)
**Why human:** Requires actual create-next-app installed and version detection from real binary

---

_Verified: 2026-02-18T15:26:00Z_
_Verifier: Claude (gsd-executor)_
