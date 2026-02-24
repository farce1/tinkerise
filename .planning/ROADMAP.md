# Roadmap: tinkerise

## Milestones

- ✅ **v1.0 MVP** — Phases 1-12 (shipped 2026-02-18)
- ✅ **v1.1 Tech Debt** — Phases 13-16 (shipped 2026-02-19)
- ✅ **v2.0 Quality & Robustness** — Phases 17-23 (shipped 2026-02-20)
- ✅ **v3.0 Documentation & Polish** — Phases 24-29 (shipped 2026-02-22)
- 📋 **v3.1 Reliability Sweep** — Phases 30-32 (planned)

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

<details open>
<summary>📋 v3.1 Reliability Sweep (Phases 30-32) — PLANNED</summary>

## Phases

- [x] **Phase 30: Docs Production Reliability Verification** - Verify deployed docs availability, search behavior, and code rendering with automated production smoke checks. (completed 2026-02-23)
- [x] **Phase 31: CLI Runtime Error UX Reliability** - Verify end-to-end CLI error UX contracts and failure conformance across representative runtime scenarios. (completed 2026-02-23)
- [x] **Phase 32: Reliability Closure Evidence & CI Enforcement** - Produce auditable closure evidence and enforce reliability checks as required CI gates. (completed 2026-02-24)

## Phase Details

### Phase 30: Docs Production Reliability Verification
**Goal**: Users and maintainers can trust that the production GitHub Pages docs site is reachable and functionally usable for search and code examples.
**Depends on**: Phase 29
**Requirements**: DOCS-01, DOCS-08, DOCS-09, DOCS-13
**Success Criteria** (what must be TRUE):
  1. User can open the production GitHub Pages docs URL and receive a successful page load.
  2. User can run a search query on the deployed docs site and receive relevant content results.
  3. User can view syntax-highlighted code blocks on deployed docs pages without broken rendering.
  4. Maintainer can run one automated post-deploy smoke check that validates availability, search behavior, and code-block rendering in production.
**Plans**: 2 plans

Plans:
- [x] 30-01-PLAN.md - Build fixture-driven production docs smoke runner for availability, search, and code rendering checks.
- [x] 30-02-PLAN.md - Integrate smoke runner into post-deploy Docs workflow with hard-gated evidence reporting.

### Phase 31: CLI Runtime Error UX Reliability
**Goal**: Users receive consistent, actionable CLI failure UX and maintainers can verify it through a stable conformance matrix.
**Depends on**: Phase 29
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-08
**Success Criteria** (what must be TRUE):
  1. User sees friendly actionable failure messages for expected command errors instead of raw stack traces.
  2. User who mistypes a command sees a "Did you mean ..." suggestion in CLI output.
  3. User sees practical command examples in `--help` output for each public command.
  4. User-facing failures follow a consistent structured error hierarchy and are rendered through one top-level runtime error boundary.
  5. Maintainer can run a conformance matrix that asserts representative failure UX output and exit-code behavior.
**Plans**: 4 plans

Plans:
- [x] 31-01-PLAN.md - Enforce a shared 3-part CLI error UX contract in the top-level boundary with stable code visibility and debug-gated stack behavior.
- [x] 31-02-PLAN.md - Implement deterministic thresholded top-3 command typo suggestions with runnable correction guidance.
- [x] 31-03-PLAN.md - Normalize two-example minimum help output coverage across all public commands and subcommands with regression enforcement.
- [x] 31-04-PLAN.md - Add an auditable 8-scenario runtime error conformance matrix with hard-fail UX, channel, and exit-code assertions.

### Phase 32: Reliability Closure Evidence & CI Enforcement
**Goal**: Maintainers can prove v3.1 reliability closure and prevent regressions via mandatory CI enforcement.
**Depends on**: Phase 30, Phase 31
**Requirements**: REL-01, REL-02
**Success Criteria** (what must be TRUE):
  1. Maintainer can generate a requirement-to-evidence closure bundle covering all v3.1 requirements.
  2. Maintainer can review objective artifacts (logs, transcripts, checklists) that trace each v3.1 requirement to passing verification evidence.
  3. CI requires docs and CLI reliability verification checks to pass before merge/release workflows can complete.
**Plans**: 2 plans

Plans:
- [x] 32-01-PLAN.md - Build deterministic v3.1 requirement-to-evidence closure bundle generation from existing docs and CLI reliability reports.
- [x] 32-02-PLAN.md - Enforce reliability verification as blocking CI/release gates and document required-check policy configuration.

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 30. Docs Production Reliability Verification | 2/2 | Complete    | 2026-02-23 |
| 31. CLI Runtime Error UX Reliability | 4/4 | Complete    | 2026-02-23 |
| 32. Reliability Closure Evidence & CI Enforcement | 3/3 | Complete   | 2026-02-24 |

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
