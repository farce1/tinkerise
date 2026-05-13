# Phase 34: Shell Completions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 34-shell-completions
**Areas discussed:** Script generation strategy, Dynamic value strategy, Flag-value completion depth, Test/CI strategy
**Discussion style:** Claude-driven (user delegated: "i trust your discussions. best outcome only. best patterns. industry standard"). All four gray areas were resolved in a single pass against industry-standard CLI completion patterns. User confirmed with "go" before CONTEXT.md was written.

---

## Script generation strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-written generators per shell | TS string-literal templates in `packages/cli/src/completion/{bash,zsh,fish}.ts`; no new dep; full control over dual-binary registration; matches `gh`, `kubectl`, `bun`, `npm`, `aws-cli`, `volta` | ✓ |
| Completion library (`tabtab`, `omelette`, `commander-completion`) | Less code to write, but adds a runtime dep that must pass `bun run license-check`; libraries are either unmaintained or don't handle our dual-binary + dynamic-value needs cleanly | |

**Selection:** Hand-written generators per shell.
**Notes:** Industry-standard pattern. Zero new dep surface aligns with v3.1+ reliability posture. Generator walks the Commander program tree (D-02) so subcommand/flag completion stays in sync with `packages/cli/src/index.ts` automatically. Single emitted script per shell registers both `tinkerise` and `tk` (D-05) — one source line covers both binaries, matching `npm completion` and `bun completions` install UX. Unknown shell argument reuses the Phase 24 error hierarchy with new code `COMPLETION_UNKNOWN_SHELL` (D-04). `--json` flag is a silent no-op for this command (D-06) — output is a shell script, not data.

---

## Dynamic value strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot at script emit time | Bake everything (scaffolders, presets, enhancements) into the script. User re-runs `tinkerise completion <shell>` to refresh after `preset save` or `tinkerise update`. Simple, no runtime CLI calls, but UX requires re-sourcing after every change. | |
| Runtime lookup at tab time (everything) | Script invokes `tinkerise list --json` / `tinkerise preset list --json` on every tab. Always current. ~80-150ms cold-start latency. Couples completion to Phase 33 `--json` schemas. | |
| Hybrid (bake static, look up dynamic) | Bake subcommands, flag names, and very-static enums (categories, PMs, shells); look up scaffolder/enhancement/preset names at tab time via Phase 33 `--json`. Matches `gh` and `kubectl`. | ✓ |

**Selection:** Hybrid.
**Notes:** Pure-static forces re-sourcing after every `preset save` or version upgrade — bad UX. Pure-dynamic adds latency to flag-name completion for no benefit (flag names don't change between releases without code shipping). Hybrid is what `gh` and `kubectl` use. Static enum map lives in `packages/cli/src/completion/enums.ts` because Commander.js does not expose enum metadata on `.option()` calls (D-08); the set is small (~5 entries). `jq` is a soft prerequisite for dynamic completions (D-10) — matches `gh`/`kubectl` precedent; static completion still works without it. Graceful degradation on lookup failure (D-09): empty candidate set, no error spam in user's shell. No caching in v1 (D-11) — premature optimization.

---

## Flag-value completion depth

| Option | Description | Selected |
|--------|-------------|----------|
| Subcommands only | Completes `tinkerise <TAB>` → command list. Smallest template, weakest UX. | |
| Subcommands + flag names | Adds `--<TAB>` completion of flags per subcommand. Mid-tier UX. | |
| Subcommands + flag names + enum flag values | Three-depth: also completes `--package-manager <TAB>` → npm/pnpm/yarn/bun, `tinkerise <TAB>` → web/backend/mobile, `tinkerise add <TAB>` → enhancement IDs, `tinkerise preset use <TAB>` → preset names. Matches `gh`/`kubectl`. | ✓ |

**Selection:** Full three-depth.
**Notes:** Industry standard for power-user CLIs. Free-form value positions (project name, file paths) intentionally yield no completions (D-13) — the shell falls through to its native filesystem completion. Subcommand aliases (e.g., `--ts` for `--typescript`) also get completion (D-14). Static enum values inlined into the script at generation time; dynamic value sources (scaffolder/enhancement/preset names) called at tab time via `tinkerise list --json` / `tinkerise preset list --json`.

---

## Test/CI strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot generator output only | Vitest snapshots of generator return strings. Fast, no shell deps, but doesn't prove the script actually completes anything in a real shell. | |
| End-to-end matrix only | Spawn bash/zsh/fish in CI, source emitted script, drive TAB key sequences, assert candidates. Most realistic but slow, brittle to runner image drift. | |
| Hybrid (snapshot + e2e matrix) | Layer 1 snapshots catch template churn cheaply; Layer 2 e2e conformance matrix proves the scripts actually complete. Mirrors Phase 31/33 conformance pattern. Matches `gh` and `bun`. | ✓ |

**Selection:** Hybrid.
**Notes:** Layer 1 (snapshots) under `packages/cli/tests/unit/completion/{bash,zsh,fish}.test.ts`. Layer 2 (e2e matrix) at `packages/cli/tests/conformance/completion-matrix.test.ts` + `fixtures/completion-matrix.json`, mirroring Phase 31's `runtime-error-matrix.test.ts` and Phase 33's `json-output-matrix.test.ts`. Fish installed via `sudo apt-get install -y fish` in CI; bash and zsh pre-installed on `ubuntu-latest` (D-17). Test seam via PATH-shim for the `tinkerise` binary returns canned `--json` (D-18, pattern lifted from Phase 33's `runDoctorChecks(overrides?)`). At least one negative-path scenario per shell asserting graceful-degradation when `tinkerise list --json` fails (D-19) — empty candidate set, no stderr leak. Joins the existing `test:conformance` script gated by the `Reliability Gates` required check from Phase 32 — no new CI workflow file or required check to wire.

---

## Claude's Discretion

- Exact Commander tree-walk implementation (helper signature, subcommand-group recursion for `preset`/`config`) — for the planner to refine, likely via a `walkCommands(cmd, visitor)` helper.
- Option metadata extraction API (`Option.flags` vs `cmd.options`) — planner picks the cleanest API after confirming via Context7 on commander.js docs.
- Snapshot file format and exact `__snapshots__/` layout — match Vitest defaults.
- Exact wording of docs install steps and Starlight `<Aside>` callouts (e.g., jq soft-prereq note).
- Conformance fixture shape (single canned scaffolder/enhancement/preset bundled vs generated at setup) — match whatever Phase 31/33 conformance fixtures established.
- `tinkerise completion --help` content (likely shows install one-liners inline via `addHelpText('after', …)`).

## Deferred Ideas

- PowerShell / Nushell completion — out of scope per REQUIREMENTS.md; PowerShell's verb-noun discipline complicates the hybrid dynamic-value strategy; defer to a dedicated phase if demand surfaces.
- Persistent caching of dynamic lookups (`XDG_CACHE_HOME`, version-keyed TTL) — premature in v1; revisit if tab latency becomes user feedback.
- Completion for free-form value positions (project name suggestions, scaffolder-aware path templates) — bloats templates and tests; defer to a future "smart completions" phase.
- Plugin/extension API for third-party completions — out of scope per PROJECT.md (no plugin surface).
- Completion-driven help generation (auto-generate `--help` examples from enum maps) — tangential.
- Bundling a tiny JSON parser to remove `jq` soft-prereq — possible (e.g., `dasel`) but adds maintenance surface for minor convenience; revisit if jq friction emerges.
- Completion telemetry / opt-in usage signals — post-v2 per PROJECT.md.
