---
phase: 34-shell-completions
plan: 04
subsystem: cli
tags: [completion, conformance, snapshot, vitest, bash, zsh, fish, mockbin, ci, fish-install]

# Dependency graph
requires:
  - phase: 34-shell-completions
    provides: per-shell generators (Plan 03), DYNAMIC_FLAGS/DYNAMIC_POSITIONALS map (Plan 02), `tinkerise completion <shell>` (Plan 03), hidden `__complete` subcommand (Plan 02/03)
  - phase: 33-json-structured-output-contract
    provides: ScenarioRecord/artifact pattern from json-output-matrix.test.ts
  - phase: 31-cli-runtime-error-ux-reliability
    provides: conformance-matrix structure baseline (fixture loader + dist binary + report writer + console.table)
  - phase: 32-reliability-closure-evidence-ci-enforcement
    provides: existing `Reliability Gates` required check that already covers `test:conformance`
provides:
  - packages/cli/tests/unit/completion/{bash,zsh,fish}.test.ts — three snapshot test files (Layer 1, D-15) with 5 behavioral assertions each (15 tests total)
  - packages/cli/tests/unit/completion/__snapshots__/{bash,zsh,fish}.test.ts.snap — committed snapshot files locking the generator output (T-34-19 mitigation)
  - packages/cli/tests/conformance/completion-matrix.test.ts — Layer 2 orchestrator (D-15) mirroring json-output-matrix.test.ts structure
  - packages/cli/tests/conformance/fixtures/completion-matrix.json — 21 scenarios (4 shapes × 3 shells + 3 negatives + 3 tk-alias + 3 failing-mockBin per D-19)
  - packages/cli/tests/conformance/harness/run-shell-completion.mjs — shell-spawning helper that drives the TAB sequence for bash/zsh/fish with optional mockBin shim (D-18)
  - packages/cli/tests/conformance/artifacts/completion-report.json — per-run conformance report (matches Phase 31/33 naming convention)
  - .github/workflows/ci.yml — `Install fish shell` step before `test:conformance` (D-17)
  - Two-layer test strategy (D-15) fully implemented; closes ROADMAP Success Criteria #4
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Layer 1 / snapshot tests: hand-built fixture Commander tree (NOT the live program) keeps snapshots stable across CLI surface changes per D-15"
    - "Layer 2 / conformance harness: shell-spawning with `--noprofile/--norc/-f/--no-config` plus a stub `_describe` override for zsh (prints the named candidate array one element per line via the (@P) indirect-array flag) and `complete -C` for fish (built-in dry-run API)"
    - "mockBin shim pattern (D-18): per-scenario mkdtemp + writeFile + chmod 755 + PATH prepend; `'FAIL'` sentinel value makes the shim exit non-zero to exercise D-19 graceful-degradation"
    - "Relaxed stderr contract: forbids /COMPLETION_|command not found|tinkerise.*error/i (the explicit fail-mode patterns) but accepts benign shell-init warnings (compinit insecure-directory, missing _init_completion) bash/zsh frequently emit under --noprofile/--norc"
    - "Per-shell availability skip: `shellAvailable(shell)` via `command -v` allows the test to skip fish scenarios cleanly on developer machines where fish is not installed; CI installs fish per D-17 so the full matrix exercises there"

key-files:
  created:
    - packages/cli/tests/unit/completion/bash.test.ts
    - packages/cli/tests/unit/completion/zsh.test.ts
    - packages/cli/tests/unit/completion/fish.test.ts
    - packages/cli/tests/unit/completion/__snapshots__/bash.test.ts.snap
    - packages/cli/tests/unit/completion/__snapshots__/zsh.test.ts.snap
    - packages/cli/tests/unit/completion/__snapshots__/fish.test.ts.snap
    - packages/cli/tests/conformance/completion-matrix.test.ts
    - packages/cli/tests/conformance/fixtures/completion-matrix.json
    - packages/cli/tests/conformance/harness/run-shell-completion.mjs
    - packages/cli/tests/conformance/artifacts/completion-report.json
  modified:
    - packages/cli/src/completion/bash.ts
    - packages/cli/src/completion/zsh.ts
    - .github/workflows/ci.yml

key-decisions:
  - "Task 2 split into Task 2a (bash smoke skeleton) and Task 2b (full matrix + zsh/fish + mockBin) per plan-checker scope-sanity recommendation — reduced blast radius for per-shell incantation iteration"
  - "Relaxed stderr contract regex /COMPLETION_|command not found|tinkerise.*error/i instead of strict `expect(stderr).toBe('')` — bash/zsh/fish emit benign init warnings under --noprofile/--norc that would otherwise produce false failures (plan-checker fix #2)"
  - "zsh harness pattern: override `_describe` with a stub that prints the named candidate array via `print -l -- \"${(@P)arrname[@]}\"` — the (@P) flag is critical (indirect array expansion preserving structure); a plain ${(P)arrname[@]} would have IFS-joined the elements onto a single line"
  - "fish harness uses built-in `complete -C` dry-run API rather than synthesizing internal state — fish's design exposes this API explicitly, so the harness is much simpler than the bash/zsh branches"
  - "Aimed for 21 scenarios (full per-shell matrix) instead of the ~12 budget — every shape per shell × every negative variant gives proportional coverage; the planner-budget said \"executor can split or merge as long as every shape is covered per shell\""
  - "Fixture mockBin uses the literal string `\"FAIL\"` as a sentinel for failing-shim scenarios — keeps the JSON fixture format simple (no nested config object); the harness's writeMockTinkerise checks the value and exits 1 in the shim"
  - "Per-shell availability skip handled in the test orchestrator (NOT in the harness) — keeps the harness pure (always tries to spawn) and the orchestrator owns the skip-vs-fail policy; lets local developer runs stay green without fish while CI requires the full matrix"

patterns-established:
  - "Pattern: completion conformance scenario shape — `{ id, name, requirements, shell, partialCommand, expectedCandidates? OR expectedCandidatesInclude?, expectExitOk, mockBin? }`. Future completion-related plans extend the fixture by adding rows, not by restructuring the orchestrator."
  - "Pattern: shell-spawning harness signature — `runShellCompletion({ shell, completionScript, partialCommand, mockBin? }): Promise<{ candidates, exitCode, stderr }>`. Per-shell branches encapsulate the incantation idiom; mockBin shim flow is shared."
  - "Pattern: snapshot fixture program — `buildFixtureProgram(): Command` hand-built in EACH per-shell test file (not shared across shells, not imported from src/index.ts). Stable across CLI surface changes per D-15."
  - "Pattern: conditional shell-if-block emission — for empty leaf positional positions (commands with no static enum and no dynamic kind), do NOT emit the `if [[ ... ]]; then ... fi` block — bash and zsh both reject an empty body as a syntax error. Applies to any future generator that walks the Commander tree and emits per-command depth-2 case branches."

requirements-completed: [CLI-09, CLI-10]

# Metrics
duration: ~16min
completed: 2026-05-13
---

# Phase 34 Plan 04: Tests and Conformance Summary

**Two-layer test strategy from D-15 is fully implemented — Layer 1 snapshot tests catch generator template churn, Layer 2 conformance matrix spawns each shell, sources the emitted script, drives TAB, asserts candidates. 21 conformance scenarios cover the full D-16 matrix (4 shapes × 3 shells + negatives + tk-alias + failing-mockBin per D-19). CI workflow installs fish per D-17 so the matrix runs on ubuntu-latest. ROADMAP Success Criteria #4 is met.**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-05-13T10:21:54Z
- **Completed:** 2026-05-13T10:38:20Z
- **Tasks:** 4 (3 TDD-flagged, 1 plain auto)
- **Files created:** 10 (3 snapshot tests + 3 snapshot files + conformance orchestrator + fixture + harness + artifact)
- **Files modified:** 3 (bash.ts + zsh.ts generator bug fix + ci.yml)

## Accomplishments

### Layer 1 — Snapshot tests (Task 1)

Three test files at `packages/cli/tests/unit/completion/{bash,zsh,fish}.test.ts`, each with **5 tests = 15 tests total**:

1. **Stable snapshot:** `expect(generate(buildFixtureProgram())).toMatchSnapshot()` against a hand-built fixture Commander tree (NOT the live program — D-15 stability). First run creates `packages/cli/tests/unit/completion/__snapshots__/<shell>.test.ts.snap`; subsequent runs assert against it. Snapshot updates require explicit `vitest -u` and PR review (T-34-19 mitigation).
2. **D-05 dual-binary:** bash `complete -F _tinkerise tinkerise tk`; zsh `^#compdef tinkerise tk`; fish both `complete -c tinkerise` and `complete -c tk` blocks present.
3. **D-10 hidden `__complete` skipped:** output stripped of intentional dynamic-lookup snippets does NOT contain the bare `__complete` token.
4. **D-14 subcommand aliases:** both `add` and its alias `install` emitted as candidates.
5. **D-09 dynamic-lookup snippet:** `tinkerise __complete presets 2>/dev/null` substring present (fish form additionally includes `; or true`).

All 15 tests pass on first run AND on second run (no `-u`), proving snapshots are stable.

### Layer 2 — Conformance matrix (Tasks 2a + 2b)

**Final per-shell harness incantations** in `packages/cli/tests/conformance/harness/run-shell-completion.mjs`:

| Shell | Incantation                                                                                                                                                      | Candidate capture                                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| bash  | `bash --noprofile --norc -c 'source <script>; COMP_WORDS=(...); COMP_CWORD=N; COMP_LINE=...; COMP_POINT=N; _tinkerise; printf "%s\n" "${COMPREPLY[@]}"'`           | Read `${COMPREPLY[@]}` after invoking the `_tinkerise` function with synthesized state                                                     |
| zsh   | `zsh -f -c '_describe() { ... print -l -- "${(@P)arrname[@]}"; }; source <script>; words=(...); CURRENT=N; _tinkerise'`                                          | Override `_describe` to print the named candidate array one element per line; the `(@P)` indirect-array flag is critical                  |
| fish  | `fish --no-config -c 'source <script>; complete -C <partialCommand>'`                                                                                            | Fish exposes the dry-run API directly via `complete -C`; output is `<candidate>\t<description>` per line — harness splits on first tab |

**Fixture: 21 scenarios** at `packages/cli/tests/conformance/fixtures/completion-matrix.json`:

- 4 shapes × 3 shells = 12 (top-level subcommand, flag-name at depth, dynamic value via mocked __complete, static enum)
- 3 negative scenarios (one per shell) — unknown command produces empty candidates
- 3 tk-alias scenarios (one per shell) — proves D-05 dual-binary registration works end-to-end
- 3 failing-mockBin scenarios (one per shell) — proves D-19 graceful degradation (empty candidates on shim failure, no stderr leak)

**Results on developer machine** (no fish installed):

```
bash-top-level-subcommand     bash   pass    14 candidates  390ms
bash-flag-name-at-depth       bash   pass    21 candidates  219ms
bash-dynamic-value-presets    bash   pass     2 candidates  565ms
bash-static-enum-completion   bash   pass     3 candidates  244ms
bash-negative-unknown-command bash   pass     0 candidates  221ms
bash-tk-alias                 bash   pass    14 candidates  216ms
bash-failing-mockbin-preset   bash   pass     0 candidates  432ms
zsh-top-level-subcommand      zsh    pass    14 candidates  325ms
zsh-flag-name-at-depth        zsh    pass    21 candidates  187ms
zsh-dynamic-value-presets     zsh    pass     2 candidates  329ms
zsh-static-enum-completion    zsh    pass     3 candidates  195ms
zsh-negative-unknown-command  zsh    pass     0 candidates  196ms
zsh-tk-alias                  zsh    pass    14 candidates  192ms
zsh-failing-mockbin-preset    zsh    pass     0 candidates  321ms
fish-*                        fish   skipped (7 scenarios — fish not installed locally)
```

**Test-skip behavior on macOS dev machines:** `shellAvailable(scenario.shell)` in the orchestrator runs `bash -c 'command -v <shell>'` and skips the scenario when the shell is not installed. Skipped records are reported as `status: 'skipped'` in the report artifact, are NOT counted as failures, but ARE counted in the report `totals.skipped`. CI installs fish per D-17 so the full matrix exercises there.

### CI workflow (Task 4)

`.github/workflows/ci.yml` line 44-46:

```yaml
- name: Install fish shell (for completion conformance per D-17)
  if: runner.os == 'Linux'
  run: sudo apt-get update && sudo apt-get install -y fish
```

Placed AFTER `Install Playwright browsers` and BEFORE `Run CLI runtime conformance gate` so all three shells (bash/zsh preinstalled + fish) are present when `bun run --filter @tinkerise/cli test:conformance` executes. **No new required check added** to `.github/RELIABILITY_REQUIRED_CHECKS.md` — per D-17 the existing Phase 32 "Reliability Gates" check already covers `test:conformance`.

### Snapshot file paths and commit status

| File                                                                  | Status                                          |
| --------------------------------------------------------------------- | ----------------------------------------------- |
| `packages/cli/tests/unit/completion/__snapshots__/bash.test.ts.snap` | Committed in 2acb994, updated in ab61058 (bug fix triggered snapshot regen)  |
| `packages/cli/tests/unit/completion/__snapshots__/zsh.test.ts.snap`  | Committed in 2acb994, updated in ab61058 (bug fix triggered snapshot regen)  |
| `packages/cli/tests/unit/completion/__snapshots__/fish.test.ts.snap` | Committed in 2acb994 (fish generator not affected by the bug)               |

### Total scenario count in the fixture

**21 scenarios** (full D-16 matrix). Acceptance criterion required `>= 12`; actual count meets and exceeds it.

### No new required check confirmation

`git diff` shows no changes to `.github/RELIABILITY_REQUIRED_CHECKS.md`. The completion-matrix test joins the existing `test:conformance` script that is already gated by the `Reliability Gates` check from Phase 32.

### Stderr contract confirmation

The orchestrator uses the **relaxed** regex `/COMPLETION_|command not found|tinkerise.*error/i` — NOT the strict `expect(stderr).toBe('')` form. Documented inline in the test source (lines 198-203) so future contributors know which patterns are forbidden vs. which benign shell-init noise is allowed:

```ts
// Relaxed stderr contract: bash/zsh/fish frequently emit benign init
// warnings (compinit insecure-directory, missing _init_completion,
// etc.) when run under --noprofile/--norc/--no-config. The contract
// is that tinkerise-originated error noise must not leak into the
// user's prompt (D-09 / D-19), so we forbid the specific patterns
// below and accept everything else.
expect(result.stderr, `scenario ${scenario.id} leaked tinkerise error noise`).not.toMatch(
  /COMPLETION_|command not found|tinkerise.*error/i,
)
```

### Task 2 split confirmation

Task 2 was split into **Task 2a** (bash-only smoke scenario) and **Task 2b** (full ~21-scenario matrix + zsh/fish harness branches + mockBin shim + tk-alias + failing-mockBin scenarios) per plan-checker scope-sanity recommendation. Both tasks landed as separate commits:

- Task 2a: `ab61058` — `feat(34-04): add conformance harness skeleton + single bash smoke scenario`
- Task 2b: `fd4053b` — `feat(34-04): expand completion-matrix to 21 scenarios + zsh/fish harness + mockBin shim`

Reduced blast radius: per-shell incantation iteration (the trickiest part of the phase, especially zsh's `_describe` override + (@P) array flag) happened against a smaller surface in 2a before scaling to all three shells in 2b.

## Task Commits

Each task committed atomically:

1. **Task 1: Three per-shell vitest snapshot unit tests** — `2acb994` (test)
2. **Task 2a: Conformance harness skeleton + single bash smoke scenario** — `ab61058` (feat — includes the Rule 1 bug fix to bash.ts/zsh.ts)
3. **Task 2b: Full matrix + zsh/fish harness branches + mockBin shim** — `fd4053b` (feat)
4. **Task 4: Install fish in CI workflow** — `a0b7a13` (chore)

_Plan metadata commit (this SUMMARY) is created by the worktree execute-plan flow before the orchestrator merges the worktree back._

## Files Created/Modified

| File                                                                              | Status   | Purpose                                                                                                    |
| --------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/cli/tests/unit/completion/bash.test.ts`                                 | created  | 5 vitest cases (snapshot + 4 behavioral) for the bash generator.                                          |
| `packages/cli/tests/unit/completion/zsh.test.ts`                                  | created  | 5 vitest cases for the zsh generator.                                                                      |
| `packages/cli/tests/unit/completion/fish.test.ts`                                 | created  | 5 vitest cases for the fish generator.                                                                     |
| `packages/cli/tests/unit/completion/__snapshots__/bash.test.ts.snap`              | created  | Snapshot of the bash generator output against the fixture Commander tree.                                 |
| `packages/cli/tests/unit/completion/__snapshots__/zsh.test.ts.snap`               | created  | Snapshot of the zsh generator output.                                                                      |
| `packages/cli/tests/unit/completion/__snapshots__/fish.test.ts.snap`              | created  | Snapshot of the fish generator output.                                                                     |
| `packages/cli/tests/conformance/completion-matrix.test.ts`                        | created  | Layer 2 orchestrator: validateFixture + per-scenario loop + ScenarioRecord -> artifact + per-record assertion. |
| `packages/cli/tests/conformance/fixtures/completion-matrix.json`                  | created  | 21 conformance scenarios covering the full D-16 matrix.                                                    |
| `packages/cli/tests/conformance/harness/run-shell-completion.mjs`                 | created  | Shell-spawning helper with bash/zsh/fish branches + mockBin shim writer.                                  |
| `packages/cli/tests/conformance/artifacts/completion-report.json`                 | created  | Per-run report mirroring Phase 31/33 naming.                                                               |
| `packages/cli/src/completion/bash.ts`                                             | modified | Rule 1 bug fix: do not emit empty `if [[ $cword -eq 2 ]]; then ... fi` block when no candidate source.    |
| `packages/cli/src/completion/zsh.ts`                                              | modified | Rule 1 bug fix: same as bash (empty `if (( CURRENT == 3 )); then ... fi` block).                          |
| `.github/workflows/ci.yml`                                                        | modified | New `Install fish shell` step before `test:conformance`.                                                  |

## Decisions Made

- **Task split (2a + 2b)** per plan-checker scope-sanity recommendation — bash smoke first, then scale.
- **Relaxed stderr contract regex** per plan-checker fix #2 — `/COMPLETION_|command not found|tinkerise.*error/i` instead of strict empty-string assertion.
- **zsh `_describe` override pattern** uses the `(@P)` indirect-array flag — without it the items would IFS-join onto a single line.
- **fish harness uses `complete -C`** — built-in dry-run API; much simpler than bash/zsh which require internal state synthesis.
- **21 scenarios in the fixture** instead of the ~12 budget — full per-shell coverage proportional to per-shape coverage; planner explicitly allowed this in the plan body.
- **mockBin "FAIL" sentinel** — single string value in the JSON fixture is cleaner than a nested config object; harness recognizes it and exits 1.
- **shellAvailable skip in the orchestrator (not the harness)** — keeps the harness pure (always tries to spawn) and the orchestrator owns skip-vs-fail policy.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Empty `if/fi` block in bash + zsh generators causes shell syntax error**

- **Found during:** Task 2a end-to-end run of the bash smoke scenario. The harness spawned bash, sourced the emitted completion script, and the shell reported `syntax error near unexpected token 'fi'` on line 51 of the generated script. Investigating showed the bash generator emitted:
  ```
  monorepo)
    if [[ $cword -eq 2 ]]; then
    fi
    if [[ "$cur" == -* ]]; then
      COMPREPLY=( $(compgen -W "--no-install --package-manager" -- "$cur") )
      return 0
    fi
    ;;
  ```
  The first `if/fi` body is empty because `monorepo` has neither a static positional enum (`POSITIONAL_ENUMS['monorepo']`) nor a dynamic kind (`DYNAMIC_POSITIONALS['monorepo']`). Both bash AND zsh reject an empty body as a syntax error (verified: `bash -c 'if [[ 1 -eq 1 ]]; then\nfi'` exits 2; `zsh -f -c 'if (( 1 == 1 )); then\nfi'` exits 2).
- **Issue:** Without the fix, ALL shells that need to complete on a `monorepo`/`doctor`/`update` (any leaf subcommand without a static or dynamic positional source) error out at source-time. The bug existed since Plan 03 but was masked because nothing in Plan 03 actually drove the emitted script through a real shell — only the snapshot diff was checked.
- **Fix:** Conditionally emit the `if/fi` block ONLY when there's a candidate source. The fix is symmetric across bash.ts and zsh.ts:
  ```ts
  // Before:
  lines.push('      if [[ $cword -eq 2 ]]; then')
  if (staticEnum) { ... }
  else if (dynKind) { ... }
  lines.push('      fi')

  // After:
  if (staticEnum) {
    lines.push('      if [[ $cword -eq 2 ]]; then')
    ... // body
    lines.push('      fi')
  }
  else if (dynKind) {
    lines.push('      if [[ $cword -eq 2 ]]; then')
    ... // body
    lines.push('      fi')
  }
  ```
- **Files modified:** `packages/cli/src/completion/bash.ts` (line 175-192), `packages/cli/src/completion/zsh.ts` (line 178-196).
- **Verification:** `bash -n /tmp/completion.bash` (syntax-check only) exits 0 after fix; `zsh -n /tmp/completion.zsh` exits 0; `bun run --cwd packages/cli test -- completion-matrix` exits 0 with all bash + zsh scenarios passing end-to-end.
- **Snapshot impact:** Bash and zsh snapshots regenerated (Task 1's fixture program includes `doctor` and `completion <shell>` leaf commands that exercise the same code path). Fish snapshot unaffected because the fish generator uses a different structure (one `complete -c` directive per leaf, no `if/fi` block). The snapshot regeneration is committed in `ab61058` (alongside the bug fix) per the no-amend rule.
- **Committed in:** `ab61058` (Task 2a — bundled with the harness because the bug was discovered the moment the harness drove a real bash shell).

**2. [Rule 1 - Bug] ESLint `no-template-curly-in-string` violations in run-shell-completion.mjs**

- **Found during:** Task 2a lint pass after the initial harness write.
- **Issue:** The harness file contains literal shell-script strings with `${VAR}` parameter-expansion syntax (e.g., the bash `printf '%s\n' "${COMPREPLY[@]}"`, the zsh `${(@P)arrname[@]}`, the fish `${kind}`). @antfu/eslint-config flags these inside single-quoted JS strings as `no-template-curly-in-string` because the rule cannot distinguish bash/zsh parameter expansion from JS template-literal placeholders.
- **Fix:** Added a file-level `/* eslint-disable no-template-curly-in-string */` comment with a documenting rationale — same pattern the generators use at `packages/cli/src/completion/{bash,zsh}.ts`.
- **Files modified:** `packages/cli/tests/conformance/harness/run-shell-completion.mjs`.
- **Verification:** `bun run --cwd packages/cli lint` exits 0.
- **Committed in:** `ab61058`.

**3. [Rule 3 - Blocking] Other lint nits in the harness file**

- **Found during:** Task 2a lint pass.
- **Issue:** 4 lint errors in the harness: (a) `style/arrow-parens` on `child.on('close', exitCode => {...})` — rule requires parentheses on arrow function arguments when the body uses curly braces; (b) two `node/prefer-global/buffer` errors on `Buffer.concat(...)` — rule requires explicit `import { Buffer } from 'node:buffer'`. The four errors compound into one regression of the existing `bun run lint` gate.
- **Fix:** Wrapped the arrow parameter in parens (`(exitCode) => {...}`), added `import { Buffer } from 'node:buffer'` at the top of the file.
- **Files modified:** `packages/cli/tests/conformance/harness/run-shell-completion.mjs`.
- **Verification:** `bun run --cwd packages/cli lint` exits 0; `bun run --cwd packages/cli typecheck` exits 0.
- **Committed in:** `ab61058`.

**4. [Process correction] Stray Task-1 commit landed on main; recovered safely**

- **Found during:** Task 1 final state inspection.
- **Issue:** I prefixed early bash commands with `cd /Users/impera/Documents/GitHub/tinkerise && ...`, which moved the shell's cwd OUT of the worktree (`.claude/worktrees/agent-ad16e73aabe6bc51f/`) and INTO the main repo. Bun/git operations then ran against `/Users/impera/Documents/GitHub/tinkerise` instead of the worktree, and `git commit` landed Task 1 (`283bd10`) on the main branch instead of `worktree-agent-ad16e73aabe6bc51f`. Same kind of issue Plan 01 had to recover from.
- **Recovery:** On main, `git reset --soft HEAD~1` (non-destructive — keeps working tree), then `git restore --staged ...` to unstage, then `mv` of each of the 6 Task-1 files (bash.test.ts, zsh.test.ts, fish.test.ts, three .snap files) from `<main>/packages/cli/tests/unit/completion/` into `<worktree>/packages/cli/tests/unit/completion/`, then `rmdir` of the now-empty directories in main. Main repo HEAD is back at the pre-execution `fb7d8f8`; the worktree contains the only copy of the Task-1 work, committed as `2acb994` on `worktree-agent-ad16e73aabe6bc51f`. Pre-existing dirty files on main (`.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, and the two conformance-artifact files) were untouched. After recovery I ran `bun install --frozen-lockfile` inside the worktree (worktree had no node_modules) so all subsequent build/test/lint commands worked correctly without leaving the worktree CWD.
- **Files affected:** Recovery was clean — no data loss, no extra commits on main.
- **Subsequent prevention:** All Task 2a / 2b / 4 commands ran with `pwd` confirming worktree CWD. No further `cd` outside the worktree.

---

**Total deviations:** 4 (1 Rule 1 bug × 2 sub-fixes in bash.ts and zsh.ts — counted once; 1 Rule 1 lint bug; 1 Rule 3 lint blocking; 1 process correction with no behavioral impact).

**Impact on plan:** Rule 1 bug (#1) is a real correctness fix that the plan implicitly required — the conformance test (the deliverable of this plan) could not have passed without it. The fix is symmetric in bash + zsh, behavioral contract unchanged, snapshots regenerated cleanly. Rule 1/3 lint fixes (#2 + #3) are presentation-layer adjustments needed to satisfy `bun run lint`. Process correction (#4) has zero behavioral impact — same recovery pattern Plan 01 documented and used.

## Issues Encountered

- **Pre-existing conformance-artifact drift on disk** — `packages/cli/tests/conformance/artifacts/json-output-report.json` and `runtime-error-report.json` show as modified in `git status` after every `bun run test` because their `generatedAt` timestamps and absolute file paths change on each run. This is the same issue Plan 03 documented; not caused by Plan 04. I deliberately did NOT stage them into any task commit because they will drift again on every future test run. I DID stage the new `completion-report.json` artifact into Task 2a's commit because the convention from Phase 31/33 (visible in their tracked report files) is to check the artifact in.
- **Husky pre-commit hook warning about non-executable hook files** — `git commit` printed `hint: The '/Users/impera/Documents/GitHub/tinkerise/.husky/pre-commit' hook was ignored because it's not set as executable.` when I committed against the main-repo HEAD during the stray-commit episode. The worktree's `.husky/` directory IS executable (the subsequent worktree commits all ran hooks normally — visible in the build/test output of each `git commit` here). No action needed; the hooks run correctly inside the worktree.
- **Header-length commit message** — Task 2b's first commit-message subject line was 113 chars; commitlint rejected it (`header-max-length: 100`). Shortened the subject and rewrote; second attempt landed cleanly.
- **No other issues.**

## TDD Gate Compliance

- **Task 1:** `tdd="true"`. The plan's `<behavior>` block defines the snapshot tests + 4 behavioral assertions. RED gate: snapshot files do not exist yet, so the very first `toMatchSnapshot()` call WRITES the snapshot (vitest's "first run" behavior). This is NOT a RED-then-GREEN cycle in the canonical sense — it's a "lock the existing output" cycle. The behavioral tests (D-05, D-09, D-10, D-14 invariants) are NOT failing-then-passing either because Plan 03 already shipped the implementations they assert. RED would only be meaningful for a behavioral assertion that didn't yet pass; here we ARE adding new tests for already-shipped behavior, so a separate RED commit would be artificial. **Status:** TDD applied as documented in the plan (lock existing surface, prevent regression). Single commit `2acb994` (`test(34-04)`).
- **Task 2a:** `tdd="true"`. The orchestrator + harness + fixture were all written together, then run; the smoke test FAILED on the first try because of the bash generator bug (#1 above). Fixing the bug made the test PASS. The failure → fix → pass cycle is the RED → GREEN cycle, just within one task. Combined into a single commit (`ab61058`) per the existing project pattern (Plan 03 documented the same combined-RED-GREEN approach because the husky pre-commit hook runs the full test suite and forbids `--no-verify`).
- **Task 2b:** `tdd="true"`. Same pattern as 2a — extended the fixture, extended the harness, ran, asserted. No bugs surfaced this time; the zsh/fish branches worked first try on the developer machine for zsh (fish skipped locally). Combined commit `fd4053b`.
- **Task 4:** plain `auto` (no `tdd`). Single chore commit `a0b7a13`.

Plan-level TDD gate sequence in git log: `test(34-04) 2acb994` → `feat(34-04) ab61058` → `feat(34-04) fd4053b` → `chore(34-04) a0b7a13`. A `test(...)` commit DOES precede the `feat(...)` commits, satisfying the conventional gate signature.

## Threat Surface Scan

Plan threat model assigned `mitigate` dispositions to T-34-15 (mockBin shim scope), T-34-17 (shell-spawn timeout), T-34-19 (snapshot drift). All mitigations are present:

- **T-34-15:** mockBin temp dir created via `mkdtemp` in the test process; only the test owns it; PATH override scoped to the spawned shell's env (not `process.env`); cleanup via `rm(tempRoot, { recursive: true, force: true })` in a `finally` block. Verified by source inspection of `run-shell-completion.mjs:53-90`.
- **T-34-17:** Each scenario runs under the vitest test-level timeout of `120_000ms` (set explicitly on the `it` block at `completion-matrix.test.ts:90`). The harness uses `child_process.spawn` (not `spawnSync`) with no explicit per-process timeout, but the parent vitest test will fail/reject the slow scenario. Acceptable given the budget — actual scenarios complete in 100-600ms each. If a single scenario hangs, the surrounding `it` block aborts the run.
- **T-34-19:** Snapshot files are committed in `2acb994` and updated in `ab61058`. Subsequent runs without `-u` would fail the test if the generator output drifts unexpectedly. Verified: `bun run --cwd packages/cli test -- tests/unit/completion` passes on the second run without `-u`.
- **T-34-16 (accept):** Report artifact contains scenario IDs, expected/actual candidates, exit codes, and stderr snippets — all derived from the checked-in fixture and the public CLI surface. No secrets, no env vars, no PII. Same profile as `json-output-report.json` and `runtime-error-report.json`.
- **T-34-18 (accept):** `sudo apt-get install -y fish` uses the standard Ubuntu repository pinned by `ubuntu-latest`. Same trust profile as the existing apt installs in the Reliability Gates job.

**No new threat surface introduced beyond the plan's documented register.** No threat flags raised.

## Known Stubs

None. All fixture scenarios reach a real assertion path; no `TODO` / `FIXME` comments in the new code. The harness's zsh and fish branches were stubs after Task 2a (with explicit `throw new Error('not yet implemented - Task 2b')`) but Task 2b filled them in — the `grep -c "not yet implemented" packages/cli/tests/conformance/harness/run-shell-completion.mjs` acceptance check returns `0`.

## User Setup Required

None — no external service configuration required. Developer machines without `fish` installed are gracefully skipped; CI installs fish per the new workflow step.

## Next Phase Readiness

Phase 34 is now ready for the final wave:

- **Plan 05 (docs-and-cross-links, already shipped per `git log fb7d8f8`):** the conformance contract is locked, so the docs page can confidently document the install one-liners and the refresh-after-upgrade behavior.
- **ROADMAP Success Criteria #4 ("Maintainer can run an automated test that exercises each completion script end-to-end so completion regressions fail CI")** is met. The conformance matrix runs as part of `test:conformance` and is gated by the Phase 32 "Reliability Gates" required check — no new branch-protection wiring needed.
- **No blockers.**

## Self-Check

Verified before returning:

**Files exist:**

- FOUND: `packages/cli/tests/unit/completion/bash.test.ts` (62 lines, 5 vitest cases)
- FOUND: `packages/cli/tests/unit/completion/zsh.test.ts` (52 lines, 5 vitest cases)
- FOUND: `packages/cli/tests/unit/completion/fish.test.ts` (54 lines, 5 vitest cases)
- FOUND: `packages/cli/tests/unit/completion/__snapshots__/bash.test.ts.snap`
- FOUND: `packages/cli/tests/unit/completion/__snapshots__/zsh.test.ts.snap`
- FOUND: `packages/cli/tests/unit/completion/__snapshots__/fish.test.ts.snap`
- FOUND: `packages/cli/tests/conformance/completion-matrix.test.ts` (212 lines)
- FOUND: `packages/cli/tests/conformance/fixtures/completion-matrix.json` (21 scenarios)
- FOUND: `packages/cli/tests/conformance/harness/run-shell-completion.mjs`
- FOUND: `packages/cli/tests/conformance/artifacts/completion-report.json`
- FOUND: `.github/workflows/ci.yml` contains `apt-get install -y fish` exactly once at line 47

**Commits exist on `worktree-agent-ad16e73aabe6bc51f`:**

- FOUND: `2acb994` — test(34-04): add snapshot + behavioral tests for bash/zsh/fish completion generators
- FOUND: `ab61058` — feat(34-04): add conformance harness skeleton + single bash smoke scenario
- FOUND: `fd4053b` — feat(34-04): expand completion-matrix to 21 scenarios + zsh/fish harness + mockBin shim
- FOUND: `a0b7a13` — chore(34-04): install fish in CI so completion conformance runs on Linux

**Verification gates green:**

- `bun run --cwd packages/cli lint` → exit 0
- `bun run --cwd packages/cli typecheck` → exit 0
- `bun run --cwd packages/cli build` → exit 0
- `bun run --cwd packages/cli test -- tests/unit/completion` → 15/15 passing on first AND second run (snapshots stable without `-u`)
- `bun run --cwd packages/cli test -- completion-matrix` → 1/1 passing; 21-scenario fixture; 14 real + 7 skipped locally
- `bun run --cwd packages/cli test` → 435 passing / 7 skipped (no regressions)
- `grep -c "apt-get install -y fish" .github/workflows/ci.yml` → 1
- `node -e "console.log(JSON.parse(...).scenarios.length)" fixture` → 21 (>= 12)
- `node -e "...new Set(...).sort().join(',')"` → `bash,fish,zsh` (all 3 shells)
- `grep -c "not yet implemented" packages/cli/tests/conformance/harness/run-shell-completion.mjs` → 0
- `grep -c "COMPLETION_|command not found|tinkerise.*error" packages/cli/tests/conformance/completion-matrix.test.ts` → 1 (relaxed contract present)
- `grep -c "expect(stderr).toBe('')" packages/cli/tests/conformance/completion-matrix.test.ts` → 0 (strict contract NOT present)
- `git diff .github/RELIABILITY_REQUIRED_CHECKS.md` → empty (no new required check)

## Self-Check: PASSED

---

*Phase: 34-shell-completions*
*Completed: 2026-05-13*
