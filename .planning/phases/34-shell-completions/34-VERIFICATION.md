---
phase: 34-shell-completions
verified: 2026-05-13T13:46:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "User who sources the completion script can tab-complete subcommands, flags, scaffolder names, and preset names for both tinkerise and tk invocations (root-positional dispatch for web/backend/mobile in bash/zsh/fish)."
  gaps_remaining: []
  regressions: []
---

# Phase 34: Shell Completions Verification Report

**Phase Goal:** Power users can autocomplete tinkerise commands, flags, and dynamic values (scaffolder names, preset names) in bash, zsh, and fish for both `tinkerise` and `tk` aliases.
**Verified:** 2026-05-13T13:46:00Z
**Status:** passed
**Re-verification:** Yes — after Phase 34-06 closed the previously-flagged gap

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can run `tinkerise completion <shell>` (bash, zsh, fish) and receive a valid completion script on stdout. | VERIFIED | `packages/cli/src/commands/completion.ts` registers the command, dispatches via switch on shell positional, writes via `process.stdout.write`. Runtime smoke against built dist confirmed: `node dist/index.js completion bash` emits `# bash completion for tinkerise` header (exit 0); zsh emits `#compdef tinkerise tk`; fish emits both `# --- Completions for tinkerise ---` and `# --- Completions for tk ---` blocks. All three pass conformance scenarios (`*-top-level-subcommand`, `*-flag-name-at-depth`, `*-static-enum-completion`, `*-tk-alias`). |
| 2 | User who sources the completion script can tab-complete subcommands, flags, scaffolder names, and preset names for both `tinkerise` and `tk` invocations. | VERIFIED | **Subcommands**: depth-1 dispatch in bash.ts:120-127, zsh.ts:125-134, fish.ts:79 — confirmed by `*-top-level-subcommand` conformance scenarios (14 candidates per shell). **Flags**: depth-2 flag-name dispatch — confirmed by `*-flag-name-at-depth` (21 candidates). **Scaffolder names**: depth-2 root-positional dispatch for web/backend/mobile via `tinkerise __complete scaffolders:<category>` is now wired in all three generators (bash.ts:130-151, zsh.ts:137-156, fish.ts:81-90). Confirmed by new `bash-dynamic-value-scaffolders-web`, `zsh-dynamic-value-scaffolders-web`, `fish-dynamic-value-scaffolders-web` conformance scenarios (bash and zsh: pass with 3 candidates each; fish: skipped locally, will run on Linux CI). **Preset names**: confirmed by `*-dynamic-value-presets` scenarios. **tk alias**: confirmed by `*-tk-alias` scenarios and dual `complete -c tinkerise`/`complete -c tk` blocks in fish (6 `__fish_seen_subcommand_from {web,backend,mobile}` directives = 3 categories × 2 binaries). Previously-failing CR-01 gap is closed. |
| 3 | User can follow copy-paste install instructions on the docs site to wire completions into their shell startup file for each supported shell. | VERIFIED | `apps/docs/src/content/docs/reference/completions.mdx` (173 lines) exists with title "Shell Completions", install one-liners for all three shells (D-21), refresh-after-upgrade guidance (D-22b), `--json` failure-path envelope contract, and `COMPLETION_UNKNOWN_SHELL` references. Cross-links present in `commands.mdx`, `json-output.mdx`, and `README.md`. |
| 4 | Maintainer can run an automated test that exercises each completion script end-to-end so completion regressions fail CI. | VERIFIED | 18 snapshot unit tests (6 per shell across `bash.test.ts`, `zsh.test.ts`, `fish.test.ts`) + 25-scenario conformance matrix (bash 9, zsh 8, fish 8). Bash and zsh: all 17 pass locally. Fish: 8 skipped locally (no local fish install), will execute on Linux CI per `apt-get install -y fish` step at `.github/workflows/ci.yml:45` guarded by `if: runner.os == 'Linux'`. Sibling matrices (`runtime-error-matrix.test.ts`, `json-output-matrix.test.ts`) also pass. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/core/src/errors/base.ts` | UnknownShellError class with code COMPLETION_UNKNOWN_SHELL | VERIFIED | Class present; message lists supported shells; suggestion uses fuzzy match when provided. |
| `packages/core/src/errors/index.ts` | Re-export of UnknownShellError | VERIFIED | Alphabetical re-export between UnknownEnhancementError and closing brace. |
| `packages/core/src/errors/__tests__/unknown-shell-error.test.ts` | Unit test (3 cases) | VERIFIED | Exists with 3 passing cases locking code/message/suggestion contract. |
| `packages/cli/src/completion/enums.ts` | FLAG_ENUMS, POSITIONAL_ENUMS, DYNAMIC_FLAGS, DYNAMIC_POSITIONALS, COMPLETE_KINDS, CompleteKind | VERIFIED | All 5 constants + type exported. DYNAMIC_POSITIONALS web/backend/mobile entries are now live consumers (no longer dead code). |
| `packages/cli/src/commands/__complete.ts` | Hidden subcommand handler | VERIFIED | Hidden via `{ hidden: true }`. Runtime smoke: `__complete scaffolders:web` returns 7 names (next, vite, astro, t3, remix, tanstack, turbo); `__complete categories` returns web/backend/mobile; `tinkerise --help` shows 0 occurrences of `__complete`. |
| `packages/cli/src/completion/bash.ts` | generate(program): string | VERIFIED | Exists, substantive (241 lines). Lines 130-151 contain the new root-positional dispatch using POSITIONAL_ENUMS[''] and DYNAMIC_POSITIONALS. Emits `case "${words[1]}" in` with web/backend/mobile branches. Dual-binary `complete -F _tinkerise tinkerise tk` confirmed. |
| `packages/cli/src/completion/zsh.ts` | generate(program): string | VERIFIED | 245 lines. Lines 137-156 contain the root-positional dispatch with `case "${words[2]}" in` and `(( CURRENT == 3 ))`. Reuses `dynamicLookup()` helper. `#compdef tinkerise tk` confirmed. |
| `packages/cli/src/completion/fish.ts` | generate(program): string | VERIFIED | 173 lines. Lines 81-90 emit per-category `__fish_seen_subcommand_from` directives inside `emitBlock(binary, root)` so they fire in BOTH `-c tinkerise` and `-c tk` blocks. |
| `packages/cli/src/commands/completion.ts` | registerCompletionCommand | VERIFIED | Dispatches via switch with SUPPORTED_SHELLS allow-list, throws UnknownShellError with findClosestMatch on unknown shells. |
| `packages/cli/src/index.ts` | Wires registerCompleteCommand + registerCompletionCommand | VERIFIED | Both registered after registerUpdateCommand. |
| `packages/cli/tests/unit/completion/bash.test.ts` | Snapshot + behavioral tests | VERIFIED | 6 passing tests. |
| `packages/cli/tests/unit/completion/zsh.test.ts` | Snapshot + behavioral tests | VERIFIED | 6 passing tests. |
| `packages/cli/tests/unit/completion/fish.test.ts` | Snapshot + behavioral tests | VERIFIED | 6 passing tests. |
| `packages/cli/tests/conformance/completion-matrix.test.ts` | End-to-end conformance orchestrator | VERIFIED | Exists; relaxed stderr contract; report writer uses `relative(process.cwd(), ...)` ×2 (fixture + reportPath). |
| `packages/cli/tests/conformance/fixtures/completion-matrix.json` | Scenarios covering all shells | VERIFIED | 25 scenarios total. 3 new dynamic-value scaffolders-web scenarios (one per shell) + 1 negative `bash-negative-unknown-category`. Each scaffolders-web scenario mocks `scaffolders:web -> [next, vite, astro]`. All IDs unique. |
| `packages/cli/tests/conformance/harness/run-shell-completion.mjs` | Shell-spawning helper | VERIFIED | bash/zsh/fish branches implemented; mockBin shim handles colon-suffixed kinds via plain object-key lookup. |
| `.github/workflows/ci.yml` | Fish install step | VERIFIED | `apt-get install -y fish` at line 45 with `if: runner.os == 'Linux'` guard at line 44. |
| `apps/docs/src/content/docs/reference/completions.mdx` | Canonical completions page | VERIFIED | Exists, 173 lines, with all D-21 install one-liners, D-22b refresh guidance, failure-path envelope contract, and `COMPLETION_UNKNOWN_SHELL` references. |
| `apps/docs/src/content/docs/reference/commands.mdx` | See-also cross-link | VERIFIED | `/tinkerise/reference/completions` present. |
| `apps/docs/src/content/docs/reference/json-output.mdx` | D-06 footnote | VERIFIED | `/tinkerise/reference/completions` and `COMPLETION_UNKNOWN_SHELL` both present. |
| `README.md` | Tab-completion cross-link | VERIFIED | `Shell Completions` reference present. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `packages/cli/src/index.ts` | `packages/cli/src/commands/__complete.ts` | `registerCompleteCommand(program)` | WIRED | Import + call both present. |
| `packages/cli/src/index.ts` | `packages/cli/src/commands/completion.ts` | `registerCompletionCommand(program)` | WIRED | Import + call both present. |
| `packages/cli/src/commands/completion.ts` | `packages/cli/src/completion/{bash,zsh,fish}.ts` | switch on shell positional | WIRED | Direct imports + dispatch. |
| `packages/cli/src/completion/bash.ts` | `packages/cli/src/completion/enums.ts` | imports DYNAMIC_FLAGS, DYNAMIC_POSITIONALS, FLAG_ENUMS, POSITIONAL_ENUMS | WIRED | All 4 constants consumed; DYNAMIC_POSITIONALS now accessed for both depth-3 and depth-2 root-positional dispatch (was depth-3 only before). |
| `packages/cli/src/completion/zsh.ts` | `packages/cli/src/completion/enums.ts` | Same import | WIRED | DYNAMIC_POSITIONALS keyed by category for the new root-positional block at lines 137-156. |
| `packages/cli/src/completion/fish.ts` | `packages/cli/src/completion/enums.ts` | Same import | WIRED | New per-category loop reads DYNAMIC_POSITIONALS[category] inside `emitBlock()`. |
| `packages/cli/tests/conformance/completion-matrix.test.ts` | `packages/cli/tests/conformance/fixtures/completion-matrix.json` | readFile + JSON.parse | WIRED | 25 scenarios consumed end-to-end. |
| `packages/cli/tests/conformance/completion-matrix.test.ts` | `packages/cli/tests/conformance/harness/run-shell-completion.mjs` | import | WIRED | Confirmed. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `packages/cli/src/commands/__complete.ts` | candidate items | `getAllScaffolders`, `getScaffoldersByCategory`, `allEnhancementModules`, `listPresets` via @tinkerise/core | Yes (runtime smoke: `__complete scaffolders:web` -> 7 real scaffolder IDs) | FLOWING |
| `packages/cli/src/completion/bash.ts` (root-positional dispatch) | `_items` in emitted bash script | `tinkerise __complete scaffolders:<category>` at tab time | Yes — runtime smoke: emitted script contains 3 scaffolders snippets; conformance scenario `bash-dynamic-value-scaffolders-web` returns mocked [next, vite, astro] | FLOWING |
| `packages/cli/src/completion/zsh.ts` (root-positional dispatch) | `_items` in emitted zsh script | Same dynamic lookup | Yes — emitted script contains 6 scaffolders references (3 categories × items + describe); conformance scenario passes. | FLOWING |
| `packages/cli/src/completion/fish.ts` (root-positional dispatch) | `complete -a` value source | Same dynamic lookup | Yes — emitted script contains 6 directives (3 categories × 2 binaries); fish conformance skipped locally but the emitted script is correct by inspection. | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `tinkerise completion bash` emits root-positional dispatch for scaffolders | `node dist/index.js completion bash \| grep -cE 'scaffolders:(web\|backend\|mobile)'` | 3 | PASS |
| `tinkerise completion zsh` emits root-positional dispatch | `node dist/index.js completion zsh \| grep -cE 'scaffolders:(web\|backend\|mobile)'` | 6 (3 categories × items + describe) | PASS |
| `tinkerise completion fish` emits dual-binary directives | `node dist/index.js completion fish \| grep -cE 'scaffolders:(web\|backend\|mobile)'` | 6 (3 categories × 2 binaries) | PASS |
| Bash uses `case "${words[1]}"` for root-positional dispatch | `grep -cF 'case "${words[1]}"' <emitted bash>` | 1 | PASS |
| Zsh uses `case "${words[2]}"` for root-positional dispatch | `grep -cF 'case "${words[2]}"' <emitted zsh>` | 1 | PASS |
| Fish emits `__fish_seen_subcommand_from web` (dual binary) | `grep -c '__fish_seen_subcommand_from web' <emitted fish>` | 2 (tinkerise + tk) | PASS |
| `tinkerise __complete scaffolders:web` returns real scaffolder IDs | `node dist/index.js __complete scaffolders:web` | next, vite, astro, t3, remix, tanstack, turbo | PASS |
| `tinkerise __complete categories` returns the 3 categories | `node dist/index.js __complete categories` | web, backend, mobile | PASS |
| `tinkerise --help` does NOT advertise `__complete` | `node dist/index.js --help \| grep -c __complete` | 0 | PASS |
| TypeScript check passes | `bun run --filter @tinkerise/cli typecheck` | Exit 0 | PASS |
| Lint passes | `bun run lint` | Exit 0 (3 packages lint; 2 cache hits, 1 fresh) | PASS |
| Unit completion snapshot tests pass | `bun run --filter @tinkerise/cli test -- tests/unit/completion` | 18/18 passing across 3 files | PASS |
| Conformance matrix passes | `bun run --filter @tinkerise/cli test -- tests/conformance/completion-matrix.test.ts` | 25 scenarios: 17 pass (all bash+zsh), 8 fish skipped (no local fish) | PASS |
| New scaffolders-web conformance scenarios pass | `bash-dynamic-value-scaffolders-web`, `zsh-dynamic-value-scaffolders-web` | Pass with 3 candidates each (next, vite, astro); `bash-negative-unknown-category` passes with 0 candidates | PASS |
| Artifact PII scrub (no /Users/impera leak) | `grep -c '/Users/impera' artifacts/*.json` | 0 across all 3 report artifacts | PASS |
| Artifact PII scrub (no /home/ leak) | `grep -c '/home/' artifacts/*.json` | 0 across all 3 report artifacts | PASS |
| Report writers use relative(process.cwd()) | `grep -c 'relative(process.cwd()' completion-matrix.test.ts runtime-error-matrix.test.ts json-output-matrix.test.ts` | 2 each (fixture + reportPath) | PASS |
| Bash snapshot contains web/backend/mobile case branches | `grep -E '^\s+(web\|backend\|mobile)\)' bash.test.ts.snap` | web), backend), mobile) all present | PASS |
| Fixture scenario count grew from 21 to 25 | `node -e 'console.log(require(...).scenarios.length)'` | 25 | PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLI-09 | Plans 01, 02, 03, 04, 06 | `tinkerise completion <shell>` command emits completion script to stdout for bash, zsh, fish | SATISFIED | Command registered; SUPPORTED_SHELLS allow-list; UnknownShellError on invalid shell; all three generators emit valid sourceable scripts. Runtime smoke + 25-scenario conformance matrix locks the contract. |
| CLI-10 | Plans 02, 03, 04, 06 | Completion scripts work for both `tinkerise` and `tk` — covering commands, flags, and dynamic values (scaffolder names, preset names) | SATISFIED | Dual-binary registration confirmed in all three generators (bash `complete -F _tinkerise tinkerise tk`; zsh `#compdef tinkerise tk`; fish dual `emitBlock` for tinkerise + tk). Commands, flags, static enums, preset dynamic lookups, AND scaffolder dynamic lookups for `tinkerise <category> <TAB>` (the previously-broken path) all work. tk-alias conformance scenarios pass for bash and zsh. The 4 new conformance scenarios (3 per-shell scaffolders-web + 1 negative) lock the CR-01 closure. |
| CLI-11 | Plan 05 | Docs site documents completion install with copy-paste instructions for each shell | SATISFIED | `completions.mdx` has all three D-21 one-liners, D-22b refresh guidance, cross-links from commands.mdx / json-output.mdx / README.md, and `--json` failure-path envelope documentation. |

All 3 phase requirement IDs accounted for. No orphans found in REQUIREMENTS.md Phase 34 mapping (CLI-09, CLI-10, CLI-11 all listed under "Shell Completions" and all claimed by at least one plan's `requirements:` frontmatter).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `packages/cli/tests/conformance/artifacts/completion-report.json` | 2 | `generatedAt` timestamp + per-record `durationMs` updates on every test run, creating a dirty working tree | Info | Not a goal-blocker. Same behavior as the sibling runtime-error and json-output artifacts. The artifact's structural content (records, candidates, status) is stable; only the timestamp + ms numbers churn. This is intrinsic to capturing test telemetry into a committed file; mitigating it would require either gitignoring the artifact or stripping the variable fields, neither of which is in scope for this phase. |

No blocker or warning anti-patterns found. The previously-flagged dead-code entries in `DYNAMIC_POSITIONALS['web' | 'backend' | 'mobile']` are now live consumers via the new root-positional dispatch in all three generators.

### Human Verification Required

None. All four observable truths are verifiable from the codebase without running a live interactive shell. The conformance matrix locks the behavior end-to-end on Linux CI for all three shells; bash and zsh are exercised locally on macOS; fish is exercised on Linux CI via `apt-get install -y fish`. The previously-flagged CR-01 gap (`tinkerise <category> <TAB>` not firing) is verified closed by:

1. Direct code inspection of the new dispatch blocks in `bash.ts:130-151`, `zsh.ts:137-156`, `fish.ts:81-90`.
2. The committed `bash.test.ts.snap` (and zsh/fish equivalents) now contains the `web)`/`backend)`/`mobile)` case branches that were absent in the prior verification.
3. The runtime smoke `node dist/index.js completion <shell> | grep -cE 'scaffolders:(web|backend|mobile)'` returns 3/6/6 (≥ plan thresholds of 3/3/6).
4. The 4 new conformance scenarios (3 dynamic-value scaffolders-web + 1 negative) explicitly exercise this path against the mocked `__complete scaffolders:web` and assert the candidate list. Bash and zsh pass locally; fish runs on Linux CI.

### Gaps Summary

No outstanding gaps. The prior verification's single failing truth ("User who sources the completion script can tab-complete subcommands, flags, scaffolder names, and preset names for both tinkerise and tk invocations") is closed by Phase 34-06's three commits:

- `9482b96` — feat(34-06): add root-positional dispatch for `tinkerise <category> <TAB>`
- `12bdd8b` — test(34-06): add 4 conformance scenarios for root-positional dispatch
- `08a718e` — fix(34-06): relativize fixture/reportPath in three conformance report writers
- `33b0a48` — chore(34-06): refresh conformance report artifacts from verification sweep

CR-01 from `34-REVIEW.md` is closed (root-positional dispatch present in all three generators; snapshots updated; conformance fixtures lock the behavior). CR-02 is closed (no absolute paths in any of the three committed conformance report artifacts; three report writers use `relative(process.cwd(), ...)`).

Phase 34 status: passed (4/4). All ROADMAP success criteria are satisfied. CLI-09, CLI-10, CLI-11 are all SATISFIED.

---

_Verified: 2026-05-13T13:46:00Z_
_Verifier: Claude (gsd-verifier)_
