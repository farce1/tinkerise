# Roadmap: tinkerise

## Milestones

- ✅ **v1.0 MVP** — Phases 1-12 (shipped 2026-02-18)
- ✅ **v1.1 Tech Debt** — Phases 13-16 (shipped 2026-02-19)
- ✅ **v2.0 Quality & Robustness** — Phases 17-23 (shipped 2026-02-20)
- ✅ **v3.0 Documentation & Polish** — Phases 24-29 (shipped 2026-02-22)
- ✅ **v3.1 Reliability Sweep** — Phases 30-32 (shipped 2026-02-24)
- 🚧 **v3.2 CLI Power-User & Polish** — Phases 33-36 (planned)

## Phase Groups

<details>
<summary>✅ v1.0 MVP (Phases 1-12) — SHIPPED 2026-02-18</summary>

- [x] Phase 1: Project Foundation (4/4 plans)
- [x] Phase 2: Scaffolder Registry & Execution (3/3 plans)
- [x] Phase 3: Interactive UX & PM Detection (3/3 plans)
- [x] Phase 4: Web Framework Scaffolders (5/5 plans)
- [x] Phase 5: Enhancement Module System (5/5 plans)
- [x] Phase 6: Core Enhancements & Add Command (4/4 plans)
- [x] Phase 7: Backend & Mobile Scaffolders (3/3 plans)
- [x] Phase 8: Configuration & Presets (5/5 plans)
- [x] Phase 9: Additional Enhancements & Utility Templates (5/5 plans)
- [x] Phase 10: Distribution & Release Automation (3/3 plans)
- [x] Phase 11: Cross-Phase Integration Wiring (2/2 plans)
- [x] Phase 12: Retroactive Phase Verification (3/3 plans)

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Tech Debt (Phases 13-16) — SHIPPED 2026-02-19</summary>

- [x] Phase 13: Core Bug Fixes & Wiring (3/3 plans)
- [x] Phase 14: Enhancement & Quality Expansion (2/2 plans)
- [x] Phase 15: Homebrew Tap Deployment (1/1 plan)
- [x] Phase 16: Enhancement Export & UX Cleanup (1/1 plan)

Full details: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v2.0 Quality & Robustness (Phases 17-23) — SHIPPED 2026-02-20</summary>

- [x] Phase 17: CI & Lint (2/2 plans)
- [x] Phase 18: Release Pipeline (2/2 plans)
- [x] Phase 19: Core Test Coverage (2/2 plans)
- [x] Phase 20: CLI Test Coverage (2/2 plans)
- [x] Phase 21: Polish & Metadata (2/2 plans)
- [x] Phase 22: Drift Detection Hardening (2/2 plans)
- [x] Phase 23: Lint Regression Fix (1/1 plan)

Full details: `.planning/milestones/v2.0-ROADMAP.md`

</details>

<details>
<summary>✅ v3.0 Documentation & Polish (Phases 24-29) — SHIPPED 2026-02-22</summary>

- [x] Phase 24: Error Handling & CLI Polish (3/3 plans)
- [x] Phase 25: Docs Site Infrastructure (2/2 plans)
- [x] Phase 26: Docs Content (6/6 plans)
- [x] Phase 27: VHS Terminal Demos (2/2 plans)
- [x] Phase 28: README Overhaul (1/1 plan)
- [x] Phase 29: Deployment & Release (3/3 plans)

Full details: `.planning/milestones/v3.0-ROADMAP.md`

</details>

<details>
<summary>✅ v3.1 Reliability Sweep (Phases 30-32) — SHIPPED 2026-02-24</summary>

- [x] Phase 30: Docs Production Reliability Verification (2/2 plans)
- [x] Phase 31: CLI Runtime Error UX Reliability (4/4 plans)
- [x] Phase 32: Reliability Closure Evidence & CI Enforcement (3/3 plans)

Full details: `.planning/milestones/v3.1-ROADMAP.md`

</details>

<details open>
<summary>🚧 v3.2 CLI Power-User & Polish (Phases 33-36) — PLANNED</summary>

## Phases

- [x] **Phase 33: `--json` Structured Output Contract** - Ship versioned `--json` schema and emit machine-readable output from `list`, `doctor`, and `preset` commands so scripts and CI integrations can consume tinkerise deterministically. (completed 2026-05-12)
- [ ] **Phase 34: Shell Completions** - Generate bash/zsh/fish completion scripts for `tinkerise` and `tk`, covering commands, flags, and dynamic values, with copy-paste install docs.
- [ ] **Phase 35: Scheduled Docs Reliability Watch** - Run unfiltered docs verification on a weekly schedule and auto-open a GitHub Issue on failure so path-filter trigger gaps cannot hide regressions.
- [ ] **Phase 36: CLI UX Refinements & Milestone Closeout** - Ship 1-2 evidence-backed CLI UX wins identified during planning, then prepare the v3.2 milestone audit.

## Phase Details

### Phase 33: `--json` Structured Output Contract
**Goal**: Script and CI authors can consume tinkerise read-only commands as stable, versioned JSON without parsing human-formatted output.
**Depends on**: Phase 32
**Requirements**: CLI-12, CLI-13, CLI-14, CLI-15
**Success Criteria** (what must be TRUE):
  1. User can run `tinkerise list --json` and receive a machine-readable list of scaffolders and enhancements on stdout with a zero exit code on success.
  2. User can run `tinkerise doctor --json` and receive structured diagnostics where each check has a clear pass/fail status and exit code reflects overall health.
  3. User can run `tinkerise preset list --json` and `tinkerise preset show <name> --json` and parse the output without scraping human-formatted text.
  4. Every `--json` payload carries a `schemaVersion` field documented in the docs site so downstream scripts can pin against a known contract.
  5. Maintainer can run a test suite that validates each `--json` emitter against the documented schema to catch accidental breaking changes.
**Plans**: 4 plans in 3 waves

  **Wave 1** *(parallel-safe — disjoint package trees: packages/shared/ vs packages/cli/+packages/core/)*
  - [x] 33-01-shared-schemas-PLAN.md — Zod 4 envelope + per-command schemas in @tinkerise/shared/src/json-output/ (CLI-12..CLI-15)
  - [x] 33-02-cli-runtime-PLAN.md — output-mode singleton + clack wrapper + JSON-aware handleError + update-check suppression (CLI-12..CLI-15)

  **Wave 2** *(blocked on Wave 1 completion)*
  - [x] 33-03-command-branches-PLAN.md — JSON branches in list/doctor/preset list + new `preset show <name>` subcommand, full clack-output wrapper migration in preset.ts, deterministic `runDoctorChecks(overrides?)` test seam (CLI-12, CLI-13, CLI-14)

  **Wave 3** *(blocked on Wave 2 completion)*
  - [x] 33-04-docs-conformance-PLAN.md — JSON Schema codegen + reference docs page + 8-scenario conformance matrix with deterministic doctor-required-fail harness (CLI-12..CLI-15)

  **Cross-cutting constraints:**
  - Stdout in `--json` mode: exactly one JSON object + single trailing newline (D-12); no clack/banner/log noise (D-13, D-15).
  - Wrapped envelope `{ schemaVersion: <int>, command: <string>, data | error }` — `data` and `error` mutually exclusive (D-03, D-05).
  - `doctor --json` exit code: 0 when `summary.requiredFailed === 0`; 1 otherwise (D-11, D-23, D-24).
  - Schema source of truth: Zod 4 in `@tinkerise/shared/src/json-output/`; JSON Schema files generated at docs build time (D-16, D-17).

### Phase 34: Shell Completions
**Goal**: Power users can autocomplete tinkerise commands, flags, and dynamic values (scaffolder names, preset names) in bash, zsh, and fish for both `tinkerise` and `tk` aliases.
**Depends on**: Phase 32
**Requirements**: CLI-09, CLI-10, CLI-11
**Success Criteria** (what must be TRUE):
  1. User can run `tinkerise completion <shell>` (bash, zsh, fish) and receive a valid completion script on stdout.
  2. User who sources the completion script can tab-complete subcommands, flags, scaffolder names, and preset names for both `tinkerise` and `tk` invocations.
  3. User can follow copy-paste install instructions on the docs site to wire completions into their shell startup file for each supported shell.
  4. Maintainer can run an automated test that exercises each completion script end-to-end so completion regressions fail CI.
**Plans**: TBD

### Phase 35: Scheduled Docs Reliability Watch
**Goal**: Maintainers detect docs production regressions even when path-filter triggers fail to fire on the relevant commits.
**Depends on**: Phase 33
**Requirements**: REL-04
**Success Criteria** (what must be TRUE):
  1. A GitHub Actions workflow runs the full unfiltered docs verification suite on a weekly schedule independent of push/path-filter triggers.
  2. Maintainer can review the most recent scheduled run output and confirm it exercised the same checks as the gated post-deploy smoke run.
  3. On scheduled-run failure, the workflow automatically opens a GitHub Issue with run link, failure summary, and a stable issue label so it does not silently fail.
**Plans**: TBD

### Phase 36: CLI UX Refinements & Milestone Closeout
**Goal**: Tinkerise feels finished by closing 1-2 small but high-signal CLI UX gaps with documented before/after evidence, then locking in v3.2 milestone audit artifacts.
**Depends on**: Phase 33, Phase 34, Phase 35
**Requirements**: CLI-16
**Success Criteria** (what must be TRUE):
  1. User experiences 1-2 concretely improved CLI moments (e.g. clearer error guidance, more actionable doctor next steps, sharper prompt copy) versus v3.1 behavior.
  2. Each shipped refinement is backed by a before/after evidence note and a regression test so the improvement is permanent.
  3. Maintainer can review a v3.2 milestone audit document that confirms 100% requirement closure and lists any carried-over tech debt for v3.3.
**Plans**: TBD

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 33. `--json` Structured Output Contract | 4/4 | Complete    | 2026-05-12 |
| 34. Shell Completions | 0/0 | Not started | - |
| 35. Scheduled Docs Reliability Watch | 0/0 | Not started | - |
| 36. CLI UX Refinements & Milestone Closeout | 0/0 | Not started | - |

</details>

