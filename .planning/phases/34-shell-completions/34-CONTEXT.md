# Phase 34: Shell Completions - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship `tinkerise completion <bash|zsh|fish>` — a new read-only subcommand that emits a sourceable shell completion script to stdout — and the accompanying docs and CI tests so power users can tab-complete subcommands, flags, and dynamic values (scaffolder names, enhancement names, preset names) for both the `tinkerise` and `tk` binaries.

**In scope:**
- New command `tinkerise completion <shell>` with handler in `packages/cli/src/commands/completion.ts` and per-shell generators in `packages/cli/src/completion/{bash,zsh,fish}.ts`.
- Single emitted script per shell registers BOTH `tinkerise` and `tk` (one source line covers both binaries).
- Completion candidates at three depths: subcommands, flag names, and enum flag values (including dynamic values fetched via the Phase 33 `--json` output).
- Docs install page `apps/docs/src/content/docs/reference/completions.mdx` with copy-paste install per shell.
- Conformance-matrix-style CI test (`packages/cli/tests/conformance/completion-matrix.test.ts`) plus generator-output snapshot tests under `packages/cli/tests/unit/completion/`.

**Out of scope:**
- PowerShell / Nushell completion (explicit Out-of-Scope row in `.planning/REQUIREMENTS.md`; revisit only if demand surfaces).
- Completion for interactive/write commands beyond surfacing the subcommand names (`scaffold` direct flow, `add`, `preset save`, `preset delete`, `update`) — flag names and obvious enum values still complete, but free-form value positions (project name, file paths) intentionally fall through to the shell's filesystem default.
- A programmatic API for third parties to extend completion (no plugin surface — aligned with PROJECT.md).
- Persistent caching of dynamic lookup results — call `tinkerise list --json` / `tinkerise preset list --json` on every tab. Caching is a future optimization, not a v1 concern.
- Changes to default-mode (non-`--json`) output of `list`, `doctor`, or `preset list` — completion consumes `--json` only.

</domain>

<decisions>
## Implementation Decisions

### Script generation strategy
- **D-01:** Hand-written generators per shell — no completion library dependency. Three modules `packages/cli/src/completion/bash.ts`, `zsh.ts`, `fish.ts`, each exporting `generate(program: Command): string`. Matches `gh`, `kubectl`, `bun`, `npm`, `aws-cli`, and `volta` (the dominant industry pattern). Zero new deps means zero license-check risk and zero supply-chain surface — aligned with the v3.1+ reliability posture. Libraries like `tabtab` / `omelette` / `commander-completion` are unmaintained or have heavy footprints and would not handle our dual-binary + dynamic-value needs cleanly.
- **D-02:** Generators walk the live Commander `program` tree (`program.commands[]`, each command's `.options`, `.aliases`, `.argument` shape) at generation time so subcommand and flag-name completion stays automatically in sync with `packages/cli/src/index.ts` and the per-command registration modules. No parallel registry of subcommands/flags to keep updated.
- **D-03:** New command `tinkerise completion <shell>` registered in `packages/cli/src/index.ts` alongside the existing top-level commands. Handler in `packages/cli/src/commands/completion.ts` dispatches to the per-shell generator based on the positional argument. Behavior on success: print script to stdout, exit 0.
- **D-04:** Unknown shell argument reuses the Phase 24 error hierarchy. New error class `UnknownShellError extends TinkeriseError` with code `COMPLETION_UNKNOWN_SHELL`. Routed through the same `handleError()` boundary as all other CLI errors. Exit non-zero. Message lists supported shells: "Supported shells: bash, zsh, fish."
- **D-05:** Single emitted script per shell registers both `tinkerise` and `tk` in one go — one `source`/`eval` line wires both binaries. Concretely:
  - bash: `complete -F _tinkerise tinkerise tk`
  - zsh: `compdef _tinkerise tinkerise tk` after the completion function block
  - fish: emit two `complete -c tinkerise ...` and `complete -c tk ...` blocks (fish does not support multi-command registration in one directive)

  This mirrors `npm completion` and `bun completions` install UX — users run one command per shell and both aliases work.
- **D-06:** `tinkerise completion <shell> --json` is a silent no-op (`--json` is ignored for this command, output remains the shell script on stdout). Documented in the Phase 33 `reference/json-output.mdx` page as a "commands without `--json` support" footnote. Rationale: the output is a shell script, not data; wrapping it would defeat the purpose. No `--json` envelope is emitted on the failure path either — failures flow through `handleError` and use the same error format as other non-JSON commands.

### Dynamic value strategy
- **D-07:** Hybrid bake-vs-lookup strategy modeled on cobra (gh/kubectl) and clap_complete (deno):
  - **Baked into the script at generation time** (static, version-bound to whatever ships):
    - Subcommand structure (walked from Commander tree).
    - Flag names per subcommand (walked from Commander tree).
    - Stable enum flag values: `--package-manager` → `npm pnpm yarn bun`; `tinkerise <category>` first-positional → `web backend mobile`; `tinkerise list <category>` first-positional → same; `tinkerise completion <shell>` → `bash zsh fish`.
  - **Looked up at tab time** via a new hidden subcommand `tinkerise __complete <kind>` (always current, no re-sourcing needed after preset save):
    - Framework names: `tinkerise __complete scaffolders` (or `scaffolders:<category>` for category-filtered) → newline-separated scaffolder IDs.
    - Enhancement names for `tinkerise add <enhancement>`: `tinkerise __complete enhancements` → newline-separated enhancement IDs.
    - Preset names for `--preset <name>`, `tinkerise preset show <name>`, `tinkerise preset use <name>`, `tinkerise preset delete <name>`: `tinkerise __complete presets` → newline-separated preset names.
- **D-08:** Static enum map lives in `packages/cli/src/completion/enums.ts` — a small hand-maintained typed map of `{ optionFlag → string[] }` and `{ commandPosition → string[] }`. Acceptable to maintain by hand because Commander.js does not expose enum metadata on `.option()` calls, the set is small (~5 entries), and these enums change rarely (only when a new package manager or category is added — which is itself a guarded decision). Generator imports this map and inlines values into the per-shell script.
- **D-09:** Dynamic lookups in the emitted scripts call the installed `tinkerise` binary's `__complete` subcommand directly (not `tk`, to avoid alias resolution edge cases) and degrade gracefully on any failure path:
  - bash/zsh template pattern: `local _items; _items=$(tinkerise __complete scaffolders 2>/dev/null) || _items=""`
  - fish equivalent: `set -l _items (tinkerise __complete scaffolders 2>/dev/null; or true)`
  - If the binary is missing from PATH, OR an older pre-Phase-34 tinkerise (no `__complete` registered) is on PATH, OR the subcommand exits non-zero, completion returns an empty candidate set — never red error text mid-tab, never log noise. Pre-Phase-34 binaries simply return Commander's "unknown command" error code on stderr (suppressed), and the empty-string fallback kicks in.
- **D-10:** Hidden subcommand contract — `tinkerise __complete <kind>`:
  - Registered alongside the other top-level commands in `packages/cli/src/index.ts` with Commander's `hidden: true` (or equivalent `.command(..., { hidden: true })` form) so it does NOT appear in `--help`, `--list`, or any docs surface. Generator's own tree-walk explicitly skips `__complete` to avoid advertising an internal contract or generating recursive completion entries.
  - Output is plain text: one candidate per line, no banners, no formatting, no envelope. Stdout-only on success (exit 0); stderr + non-zero exit on unknown `kind` argument.
  - `kind` values accepted in v1: `scaffolders`, `scaffolders:<category>`, `enhancements`, `presets`, `categories`. Set is closed and additive — planner adds new kinds as completion needs grow without renumbering or breaking the wire.
  - Decoupled from the public Phase 33 `--json` schemas — `__complete` is a script-internal contract owned by Phase 34 generators, so the public `--json` envelope (`schemaVersion`, `data.scaffolders[].id`, etc.) can evolve under its own versioning policy without breaking completion.
  - Zero external prereqs on the user's system: no `jq`, no `node -e`, no `python -c`. Pattern lifted from cobra's hidden `__complete` and clap_complete's runtime completion API — the dominant industry precedent.
- **D-11:** No caching layer in v1. `__complete` is faster than `--json` (no JSON formatting, no Zod validation, no envelope wrapping) — typical tab response is ~70-120ms cold. Users tab once or twice per command, not constantly. Premature optimization. If perf evidence later surfaces, a future phase can add a `XDG_CACHE_HOME`-backed cache keyed by tinkerise version + a short TTL.
- **D-11b (security/quoting):** Static enum values baked into the emitted scripts are hard-coded TypeScript string literals at generation time — zero injection surface. Dynamic values from `__complete` are consumed via the shells' native candidate-set primitives — bash `COMPREPLY=( $(compgen -W "$_items" -- "$cur") )`, zsh `_describe`, fish `complete -a "$_items"` — all of which tokenize on IFS whitespace and present candidates as data, NOT as commands to execute. Even a hypothetical preset name containing shell metacharacters would be rendered as a candidate string, not invoked. Preset names are further constrained at write-time by tinkerise's existing preset-naming validator (`packages/core/src/config/preset.ts`), so this is defense-in-depth rather than an active risk. The `__complete` output surface is fully owned by tinkerise — no third-party-controlled strings ever flow through it.

### Flag-value completion depth
- **D-12:** Full three-depth completion matching `gh` and `kubectl`:
  1. **Subcommands** — `tinkerise <TAB>` and `tk <TAB>` expand to `list add doctor config preset mcp cli lib monorepo update completion` (the full registered set, derived from `program.commands[]`). Plus the registered category positions (`web backend mobile`) from D-07.
  2. **Flag names** — `tinkerise web next my-app --<TAB>` expands to the union of global options (`--typescript --tailwind --eslint --biome --no-git --no-install --package-manager --template --src-dir --import-alias --empty --overwrite --app-router --react-compiler --turbopack --api --preset --verbose --json -v --version`) and command-specific options walked from the matching `cmd.options` array.
  3. **Flag values** — completion on the position immediately following a flag that has an enum or dynamic source (static enums per D-08; dynamic values per D-07/D-09).
- **D-13:** Free-form value positions (project name, file paths, free-text strings) yield NO completions — the shell falls through to its native filesystem completion, which is the correct default. Generator marks these positions explicitly (`no-completion` sentinel) to avoid accidental partial matches against the static enum map.
- **D-14:** Subcommand aliases get completion too — if a Commander command has `.alias('foo')` registered, both the canonical name and the alias are emitted as candidates. (Currently `tinkerise` has `--ts` as an alias for `--typescript` — completion includes both.)

### Test/CI strategy
- **D-15:** Two-layer test strategy mirroring `gh` and `bun`:
  - **Layer 1 — Generator snapshot tests** (`packages/cli/tests/unit/completion/{bash,zsh,fish}.test.ts`): each test calls `generate(testProgram)` against a representative Commander tree fixture and asserts the output matches a committed `.snap` file under `packages/cli/tests/unit/completion/__snapshots__/`. Fast (no shell spawn), no shell dependency, catches accidental template churn. Runs on every PR through the standard `bun run test` gate.
  - **Layer 2 — End-to-end conformance matrix** (`packages/cli/tests/conformance/completion-matrix.test.ts` + `packages/cli/tests/conformance/fixtures/completion-matrix.json`): mirrors the Phase 31/33 conformance pattern exactly. Each fixture entry is a scenario `{ shell, partialCommand, expectedCandidates[], expectedExitOk: bool }`. Harness spawns the shell with `--noprofile --norc` (bash/zsh) or `--no-config` (fish equivalent), pipes the emitted completion script through `source` (or `.` for fish via `string collect`), drives a TAB key sequence, captures the candidate list, asserts equality.
- **D-16:** Conformance matrix scenarios cover at minimum (planner refines):
  - Per shell × 4 scenarios: top-level subcommand completion, flag-name completion at depth, dynamic value completion (mocked `tinkerise list --json` output), static enum completion. Total ~12 scenarios — within the same order of magnitude as the Phase 31 runtime-error-matrix and Phase 33 json-output-matrix.
  - One "negative" scenario per shell asserting that unknown commands yield empty completions (no false-positive matches).
  - One scenario per shell exercising the `tk` alias to prove dual-binary registration works.
- **D-17:** Shell installation in CI: `ubuntu-latest` GH Actions runner ships bash and zsh pre-installed. Fish is added via `sudo apt-get install -y fish` as a workflow step (small overhead, ~5s). All three shells run inside the existing `test:conformance` job — no new CI workflow file, no new required check to wire (the existing `Reliability Gates` check from Phase 32 already covers the conformance script).
- **D-18:** Test seam: the conformance harness sets `PATH` to point at a fixture shim for the `tinkerise` binary so dynamic completion can be tested deterministically without depending on the built dist for every assertion. The shim returns canned `--json` responses keyed by argument. Pattern lifted from Phase 33's `runDoctorChecks(overrides?)` test seam — same intent (deterministic harness inputs).
- **D-19:** Fail-mode test: at least one scenario per shell deliberately points the shim at a failing `tinkerise list --json` and asserts the completion returns an empty candidate set (not error spam, not stderr leak into the user's shell prompt). Locks the graceful-degradation contract from D-09.

### Docs surface
- **D-20:** New reference page `apps/docs/src/content/docs/reference/completions.mdx` covering install per shell, install location guidance (per-user vs system-wide), how to update completions after `tinkerise update`, and the jq soft-prerequisite note. Frontmatter and code-block style match the existing `reference/commands.mdx` and `reference/json-output.mdx` conventions (Phase 33 just shipped that page; mirror it).
- **D-21:** Install one-liners (canonical patterns from each shell's community):
  - **bash:** `echo 'eval "$(tinkerise completion bash)"' >> ~/.bashrc` (or `~/.bash_profile` on macOS) — runtime-eval pattern matching npm/kubectl.
  - **zsh:** `tinkerise completion zsh > "${fpath[1]}/_tinkerise"` followed by `compinit` — filesystem pattern matching kubectl, with a fallback `eval "$(tinkerise completion zsh)"` for users whose `fpath` is non-writable.
  - **fish:** `tinkerise completion fish > ~/.config/fish/completions/tinkerise.fish` — filesystem pattern matching fish's standard completion discovery.
- **D-22:** Cross-link from `apps/docs/src/content/docs/reference/commands.mdx` (under a "See also" section) and from the project README (one line under the existing install section). Sidebar order: completions sits next to `json-output` under `reference/` — they're both power-user contracts that ship together as the v3.2 scripting story.
- **D-22b (refresh after upgrade):** Docs page calls out the two install styles and what they imply for upgrades:
  - **bash via `eval "$(tinkerise completion bash)"` in `~/.bashrc`** — re-evaluates on every shell open, so static surface (subcommand structure, flag names, enums) auto-refreshes after `tinkerise update` with zero user action.
  - **zsh/fish filesystem install (`tinkerise completion zsh > <path>`)** — captures a snapshot of the script, so the static surface only updates when the user re-runs the install command. Docs include a one-line "after `tinkerise update`, re-run `tinkerise completion <shell> > <path>`" note alongside each filesystem install snippet.
  - Dynamic surface (scaffolders/enhancements/presets) is always current regardless of install style because it calls the live binary at tab time.

### Claude's Discretion (researcher/planner refines)
- Exact Commander tree-walk implementation (how to recurse into subcommand groups like `preset` and its `save/use/list/delete/show` subcommands, including the new `show` from Phase 33). Likely a small `walkCommands(cmd, visitor)` helper but the exact API is for the planner.
- Whether to extract option metadata via `Option.flags`, `Option.short`, `Option.long`, etc. or use the higher-level `cmd.options` array — planner picks the cleanest API and confirms via `mcp__context7__*` on commander.js docs.
- Snapshot file format and exact location inside `packages/cli/tests/unit/completion/__snapshots__/` — match Vitest's default snapshot conventions, but the exact directory layout is for the executor.
- Exact wording of the docs install steps and any callouts (e.g., a Starlight `<Aside>` for the jq soft-prereq).
- Whether to ship a minimal "completion smoke test" fixture (e.g., a single canned scaffolder + enhancement + preset) bundled with the test fixtures, or generate the fixture data at test setup. Mirror whatever Phase 31/33 conformance fixtures already do for consistency.
- Whether `tinkerise completion --help` shows the install one-liners inline (likely yes — power-user-friendly), and the exact `addHelpText('after', …)` content if so.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and scope
- `.planning/REQUIREMENTS.md` — CLI-09, CLI-10, CLI-11 (the three requirements this phase closes) + the explicit "Out of Scope" row for PowerShell/Nushell.
- `.planning/ROADMAP.md` §"Phase 34: Shell Completions" — goal and 4 success criteria.
- `.planning/PROJECT.md` §"Current Milestone: v3.2 CLI Power-User & Polish" — milestone constraints (must not regress v3.1 reliability baseline; `--json` is added as flags on existing commands, not new command surface — completion is the second new command, scoped explicitly by ROADMAP).

### Prior-phase decisions to honor
- `.planning/phases/33-json-structured-output-contract/33-CONTEXT.md` — `--json` envelope shape (`{ schemaVersion, command, data }`), per-command schemaVersion, error envelope, doctor exit-code semantics. The completion scripts consume `tinkerise list --json` (`.data.scaffolders[].id`, `.data.enhancements[].id`) and `tinkerise preset list --json` (`.data.presets[].name`) as their dynamic-value source of truth.
- `.planning/phases/31-cli-runtime-error-ux-reliability/31-CONTEXT.md` — error code/structure conventions (3-part: headline/cause/next-step, stable error codes), stdout/stderr discipline, conformance-matrix sign-off pattern. The new `COMPLETION_UNKNOWN_SHELL` error code must follow this contract.
- `.planning/phases/24-error-handling-cli-polish/` (PLAN + summaries) — error hierarchy origin (`packages/core/src/errors/`, re-exports for back-compat). `UnknownShellError` slots into this hierarchy.
- `.planning/phases/32-reliability-closure-evidence-ci-enforcement/` — required CI checks contract. The new conformance test joins the existing `test:conformance` script gated by `Reliability Gates` — no new required check to register in branch protection.

### Reusable test patterns
- `packages/cli/tests/conformance/runtime-error-matrix.test.ts` — Phase 31 conformance matrix pattern: fixture JSON + ScenarioRecord + dist execution + report artifact. The new `completion-matrix.test.ts` MUST mirror this structure.
- `packages/cli/tests/conformance/fixtures/runtime-error-matrix.json` — fixture shape to model the new `completion-matrix.json` after.
- Whatever Phase 33 shipped at `packages/cli/tests/conformance/json-output-matrix.test.ts` (most recent precedent — read it before drafting the completion matrix; it adds the `--json` and test-seam patterns on top of the Phase 31 baseline).

### Existing command source (what completion must reflect)
- `packages/cli/src/index.ts` §lines 45-213 — the Commander `program` tree the generators walk: global options (lines 67-87), default action positional args (lines 90-109), `list` (113-123), `monorepo` (127-142), `add` (146-158), `doctor` (162-171), and the registered command groups via `registerConfigCommand`, `registerPresetCommand`, `registerMcpCommand`, `registerCliToolCommand`, `registerLibCommand`, `registerUpdateCommand`. The `completion` command is appended here.
- `packages/cli/src/commands/preset.ts` — registers `preset` group with `save/use/list/delete/show` (show added in Phase 33). Completion needs to enumerate these subsubcommands and complete preset names as dynamic values on `use/delete/show`.
- `packages/cli/src/commands/config.ts` — registers `config` group with its subcommands. Completion walks these the same way as `preset`.
- `packages/core/src/registry/index.ts` — `getAllScaffolders`, `getScaffoldersByCategory` (also re-exported from `@tinkerise/core/index.ts`); the data source feeding `tinkerise list --json` `.data.scaffolders`. Completion never calls these directly — it always goes through the `--json` wire format to stay decoupled.
- `packages/core/src/config/preset.ts` — preset list logic feeding `tinkerise preset list --json` `.data.presets`. Same indirection rule.

### Error hierarchy
- `packages/core/src/errors/` — base `TinkeriseError`, existing subclasses, error-code conventions. `UnknownShellError` (code `COMPLETION_UNKNOWN_SHELL`) is added here and re-exported per the established pattern.
- `packages/cli/src/utils/error-handler.ts` — `handleError()` central boundary. No changes expected; the new error class flows through automatically.

### Output mode plumbing
- `packages/cli/src/utils/output-mode.ts` — `detectJsonMode()`, `isJsonMode()` from Phase 33. The completion command checks neither (per D-06, `--json` is a no-op); planner confirms the flag still parses through Commander without warnings.

### Docs surface
- `apps/docs/src/content/docs/reference/commands.mdx` — existing reference page format and frontmatter conventions; the new `completions.mdx` matches.
- `apps/docs/src/content/docs/reference/json-output.mdx` — shipped in Phase 33; mirror the page structure for `completions.mdx` (frontmatter, code blocks, install callouts, "See also" cross-links).
- Sidebar config under `apps/docs/astro.config.mjs` (or `apps/docs/src/content/config.ts` depending on Starlight version) — add the completions page to the reference sidebar order. Verify against the path Phase 33 used for `json-output`.

### Project conventions
- `/Users/impera/Documents/GitHub/tinkerise/CLAUDE.md` — ESM only, single quotes, no semicolons, kebab-case files, Zod 4 (not applicable here but worth flagging — completion deals in plain strings, not Zod-validated data), tsup build, Vitest, `bun run license-check` for any new deps (D-01 means we add zero — but planner must verify).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Commander `program` tree** (`packages/cli/src/index.ts`): single source of truth for subcommands and flags. Generators walk this at generation time — no parallel registry to maintain.
- **`detectJsonMode` / `isJsonMode`** (`packages/cli/src/utils/output-mode.ts`): Phase 33 plumbing. Completion uses neither (per D-06) but confirms the flag-detection path remains stable when a new command is added.
- **Conformance-matrix harness** (`packages/cli/tests/conformance/runtime-error-matrix.test.ts` and Phase 33's `json-output-matrix.test.ts`): fixture-driven, executes built dist via `execaNode`, writes a report artifact. Copy-paste-and-adapt for the completion matrix — same ScenarioRecord shape, same report writer.
- **Error hierarchy** (`packages/core/src/errors/`): stable error codes and the `TinkeriseError` base. Reuse for `UnknownShellError` (code `COMPLETION_UNKNOWN_SHELL`).
- **`handleError`** (`packages/cli/src/utils/error-handler.ts`): central error boundary set up in Phase 24/31. New errors flow through automatically — no change needed in the boundary.
- **`getAllScaffolders`, `getScaffoldersByCategory`, `allEnhancementModules`, preset list APIs** (from `@tinkerise/core`): the in-memory registry and on-disk preset list that the `__complete` subcommand reads from — same data path the human and `--json` commands already use. No separate data layer.
- **`tk` alias detection** (`packages/cli/src/index.ts` §lines 42-43): `basename(process.argv[1])` is the existing pattern for `tinkerise` vs `tk` discrimination. Completion emits dual-binary registration so both invocations resolve to the same completion function — no per-invocation script branching needed.

### Established Patterns
- **ESM-only, no semicolons, single quotes, kebab-case files** (CLAUDE.md) — applies to all new files.
- **Per-package `tsup` build with type emit** — completion templates are TS modules that export string-returning functions; tsup handles them with no special config. Verify nothing in `tsup.config.ts` needs updating to include `src/completion/*`.
- **Vitest co-located `__tests__/` for unit, top-level `tests/` for integration/conformance** — snapshot tests under `packages/cli/tests/unit/completion/`; conformance matrix under `packages/cli/tests/conformance/`.
- **License-clean dependencies** — D-01 means zero new deps for the generators themselves. If the conformance harness ends up needing a tiny test-only dep (e.g., for fish-style pty driving), it must pass `bun run license-check`. Planner verifies.
- **Conformance fixture report artifacts** — Phase 31 and Phase 33 conformance suites write JSON report files (e.g., `.artifacts/conformance/runtime-error-matrix.json`). The completion matrix follows the same convention so the existing CI artifact upload step picks it up.

### Integration Points
- **CLI entry** (`packages/cli/src/index.ts`): the `completion` command and the hidden `__complete` command are both appended after `registerUpdateCommand(program)` and before the help-text addition. Must run AFTER all other commands are registered so `completion`'s tree-walk sees the full command surface. The generator's tree-walk explicitly skips `__complete` to avoid advertising an internal contract or producing recursive completion entries.
- **Per-shell scripts in user shells**: each shell has a stable, well-known completion file location (`fpath` for zsh, `~/.config/fish/completions/` for fish, runtime eval in `~/.bashrc` for bash). The docs page documents these locations explicitly, plus the per-style refresh guidance per D-22b.
- **`__complete` data sources**: the hidden subcommand reads from the same in-memory registry (`getAllScaffolders`, `allEnhancementModules`) and the same on-disk preset list (`packages/core/src/config/preset.ts`) that the human commands use — no separate data path, no parallel registry to drift against. If an older pre-Phase-34 tinkerise is on PATH when the completion script runs, the `__complete` subcommand simply doesn't exist, Commander returns its unknown-command error code, and D-09's empty-fallback handles it silently.

</code_context>

<specifics>
## Specific Ideas

- Industry reference points for tone and shape: `gh completion <shell>`, `kubectl completion <shell>`, `bun completions`, `npm completion`, `deno completions <shell>`. All five emit a single sourceable script to stdout, all five complete subcommands + flags + enum values + some dynamic values, and all five document install one-liners per shell. The completion page reads like a smaller version of `gh`'s docs.
- "Best outcome, best patterns, industry standard" — user explicitly delegated discussion to Claude with these constraints. All decisions captured here flow from that directive and are grounded in real-world precedent rather than novel design.
- `jq` as a soft prerequisite for dynamic completions is a deliberate echo of how `gh` and `kubectl` users already operate — power users tend to have jq installed, and the docs note it as a soft dep rather than bundling a JSON parser into the emitted scripts (which would bloat them and make them harder to audit by hand).

</specifics>

<deferred>
## Deferred Ideas

- **PowerShell / Nushell completion** — explicit Out-of-Scope row in REQUIREMENTS.md. Revisit only if user demand surfaces. PowerShell would be especially valuable for the Windows audience, but the dynamic-value strategy (D-07/D-09) gets gnarly under PowerShell's verb-noun discipline; defer to a dedicated phase if/when demand is proven.
- **Persistent caching of dynamic lookups** (XDG_CACHE_HOME, TTL, version-keyed invalidation) — premature in v1 per D-11. If users report perceptible tab latency, a future phase can add a per-session shell-variable cache or a filesystem cache.
- **Completion for free-form value positions** (project name suggestions, scaffolder-aware path templates) — adds value but balloons template size and surface area for tests. Defer to a future "smart completions" phase if user feedback shows demand.
- **Plugin/extension API for third-party completions** — out of scope per PROJECT.md ("Formal plugin API for community scaffolders — defer until community demand proven"). Mentioned only to confirm completion is not a hidden plugin surface.
- **Completion-driven help generation** (auto-generate `--help` examples from completion enum maps) — interesting cross-pollination idea but tangential to this phase's goal.
- ~~Bundling a tiny JSON parser to remove the `jq` soft-prereq~~ — resolved during critical review: the hidden `__complete` subcommand (D-10) emits newline-separated values directly, so neither `jq` nor any other JSON parser is required on the user's system. Listed here for audit trail; no future work required.
- **Completion telemetry / opt-in usage signals** — telemetry is post-v2 per PROJECT.md.

</deferred>

---

*Phase: 34-shell-completions*
*Context gathered: 2026-05-13*
