# Roadmap: tinkerise

## Milestones

- ✅ **v1.0 MVP** — Phases 1-12 (shipped 2026-02-18)
- ✅ **v1.1 Tech Debt** — Phases 13-16 (shipped 2026-02-19)
- 🚧 **v2.0 Quality & Robustness** — Phases 17-22 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-12) — SHIPPED 2026-02-18</summary>

- [x] Phase 1: Project Foundation (4/4 plans) — completed 2026-02-17
- [x] Phase 2: Scaffolder Registry & Execution (3/3 plans) — completed 2026-02-17
- [x] Phase 3: Interactive UX & PM Detection (3/3 plans) — completed 2026-02-17
- [x] Phase 4: Web Framework Scaffolders (5/5 plans) — completed 2026-02-17
- [x] Phase 5: Enhancement Module System (5/5 plans) — completed 2026-02-17
- [x] Phase 6: Core Enhancements & Add Command (4/4 plans) — completed 2026-02-17
- [x] Phase 7: Backend & Mobile Scaffolders (3/3 plans) — completed 2026-02-18
- [x] Phase 8: Configuration & Presets (5/5 plans) — completed 2026-02-18
- [x] Phase 9: Additional Enhancements & Utility Templates (5/5 plans) — completed 2026-02-18
- [x] Phase 10: Distribution & Release Automation (3/3 plans) — completed 2026-02-18
- [x] Phase 11: Cross-Phase Integration Wiring (2/2 plans) — completed 2026-02-18
- [x] Phase 12: Retroactive Phase Verification (3/3 plans) — completed 2026-02-18

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Tech Debt (Phases 13-16) — SHIPPED 2026-02-19</summary>

- [x] Phase 13: Core Bug Fixes & Wiring (3/3 plans) — completed 2026-02-19
- [x] Phase 14: Enhancement & Quality Expansion (2/2 plans) — completed 2026-02-19
- [x] Phase 15: Homebrew Tap Deployment (1/1 plan) — completed 2026-02-19
- [x] Phase 16: Enhancement Export & UX Cleanup (1/1 plan) — completed 2026-02-19

Full details: `.planning/milestones/v1.1-ROADMAP.md`

</details>

### v2.0 Quality & Robustness (In Progress)

**Milestone Goal:** Make the repo production-ready — green CI, comprehensive test coverage, working release pipeline, proper package metadata, and clean codebase.

- [ ] **Phase 17: CI & Lint** (0/2 plans) - Fix all ESLint errors and get CI matrix green across all platforms
- [ ] **Phase 18: Release Pipeline** - Fix broken publish path so stable versions can ship via CI
- [ ] **Phase 19: Core Test Coverage** - Write tests for 5 untested core and shared modules
- [ ] **Phase 20: CLI Test Coverage** - Write tests for 5 untested CLI modules
- [ ] **Phase 21: Polish & Metadata** - Clean metadata, consistent URLs, dead code removal, community docs
- [ ] **Phase 22: Drift Detection Hardening** - Harden drift detection CI workflow against real-world failures

## Phase Details

### Phase 17: CI & Lint
**Goal**: The repository has zero lint errors and CI passes on every platform so every future change can be validated automatically
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: CILINT-01, CILINT-02, CILINT-03, CILINT-04
**Success Criteria** (what must be TRUE):
  1. `bun run lint` completes with zero errors across all 3 packages
  2. The GitHub Actions CI workflow passes on all 6 matrix combinations (Node 20/22/24 x ubuntu/macos/windows)
  3. CI and Release workflows use Bun dependency caching, reducing install times on repeated runs
**Plans**: 2 plans
Plans:
- [ ] 17-01-PLAN.md — Fix all 22 ESLint errors in @tinkerise/shared
- [ ] 17-02-PLAN.md — Enable Bun dependency caching in CI and Release workflows

### Phase 18: Release Pipeline
**Goal**: The npm publish pipeline is correctly configured and produces stable (non-pre-release) versions when triggered
**Depends on**: Phase 17
**Requirements**: RELPIPE-01, RELPIPE-02, RELPIPE-03, RELPIPE-04, RELPIPE-05, RELPIPE-06, RELPIPE-07
**Success Criteria** (what must be TRUE):
  1. NPM_TOKEN and HOMEBREW_TAP_TOKEN setup is documented step-by-step so any maintainer can configure secrets without guesswork
  2. Running `changeset publish` no longer produces pre-release versions — `.changeset/pre.json` is gone and version bumps produce `1.x.x` not `1.x.x-beta.x`
  3. The release workflow does not double-build (no redundant `bun run build` step before publish)
  4. The Homebrew version-reading step uses `jq` and succeeds in the CI ESM environment without CJS/ESM errors
  5. All changeset and package.json references to the repo slug use `farce1/tinkerise` consistently
**Plans**: TBD

### Phase 19: Core Test Coverage
**Goal**: The 5 untested core and shared modules all have meaningful test suites covering their primary behaviors
**Depends on**: Phase 17
**Requirements**: TEST-01, TEST-02, TEST-07, TEST-08, TEST-10
**Success Criteria** (what must be TRUE):
  1. `core/enhancements/modules/changelog.ts` has tests that verify detect returns true/false correctly and install writes expected files
  2. `core/enhancements/modules/_utils.ts` has tests for `installPackages`, `writeConfigFile`, `addScript`, and `readPackageJson` with mocked filesystem calls
  3. `core/prerequisites/platform.ts` has tests verifying `detectPlatform` returns the correct platform enum and `getInstallInstructions` returns non-empty strings for each platform
  4. `core/executor/version.ts` has tests for `detectUpstreamVersion` including the early-return path when no version is found
  5. `core/templates/shared.ts` has tests covering `writeProjectFile`, `runInstall`, and `printTemplateSummary` outputs
**Plans**: TBD

### Phase 20: CLI Test Coverage
**Goal**: The 5 untested CLI modules all have meaningful test suites covering their primary behaviors
**Depends on**: Phase 17
**Requirements**: TEST-03, TEST-04, TEST-05, TEST-06, TEST-09
**Success Criteria** (what must be TRUE):
  1. `cli/utils/update-check.ts` has tests for cache read/write, mocked HTTP fetch returning a version, semver comparison logic, and `printUpdateNudge` output
  2. `cli/utils/install-method.ts` has tests that exercise all 3 detection branches and return the expected `InstallMethod` enum value for each
  3. `cli/prompts/project-name.ts` has tests verifying the validation regex rejects invalid names and accepts valid ones
  4. `cli/prompts/flow.ts` has tests for the happy path, pre-fill skip logic (flags bypass prompts), and cancellation returning undefined
  5. `cli/commands/update.ts` has tests for all install-method branches (brew upgrade, npm install -g, npx hint, unknown fallback)
**Plans**: TBD

### Phase 21: Polish & Metadata
**Goal**: All package metadata is complete and consistent, dead code is removed, and community contribution files exist
**Depends on**: Phase 17
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06
**Success Criteria** (what must be TRUE):
  1. All 4 `package.json` files have `description`, `keywords`, `repository`, `homepage`, `bugs`, `license`, and `engines` fields populated
  2. Every reference to the repository URL across all files points to `farce1/tinkerise` with no placeholder or stale org names
  3. `CODE_OF_CONDUCT.md` exists at repo root with a recognized code of conduct (Contributor Covenant or equivalent)
  4. `.gitignore` contains the `tsup.config.bundled_*.mjs` pattern and no stale artifact files exist in the repo
  5. The dead `TinkeriseConfig` export is absent from `shared/src/index.ts` and importing the package does not expose that symbol
**Plans**: TBD

### Phase 22: Drift Detection Hardening
**Goal**: The drift detection CI workflow handles real-world tool installation failures and reports detected drift as a trackable GitHub Issue
**Depends on**: Phase 17
**Requirements**: DRIFT-01, DRIFT-02, DRIFT-03
**Success Criteria** (what must be TRUE):
  1. The `cargo-generate` install step fails loudly (non-zero exit) rather than silently swallowing errors via `|| true`, so CI surfaces Rust tooling problems immediately
  2. `pip install` commands in the drift workflow include `--break-system-packages` and succeed on modern ubuntu GitHub Actions runners without PEP 668 errors
  3. When drift is detected, the workflow opens a GitHub Issue (not just an annotation) so maintainers can track it across sessions without inspecting CI logs
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Foundation | v1.0 | 4/4 | Complete | 2026-02-17 |
| 2. Scaffolder Registry & Execution | v1.0 | 3/3 | Complete | 2026-02-17 |
| 3. Interactive UX & PM Detection | v1.0 | 3/3 | Complete | 2026-02-17 |
| 4. Web Framework Scaffolders | v1.0 | 5/5 | Complete | 2026-02-17 |
| 5. Enhancement Module System | v1.0 | 5/5 | Complete | 2026-02-17 |
| 6. Core Enhancements & Add Command | v1.0 | 4/4 | Complete | 2026-02-17 |
| 7. Backend & Mobile Scaffolders | v1.0 | 3/3 | Complete | 2026-02-18 |
| 8. Configuration & Presets | v1.0 | 5/5 | Complete | 2026-02-18 |
| 9. Additional Enhancements & Utility Templates | v1.0 | 5/5 | Complete | 2026-02-18 |
| 10. Distribution & Release Automation | v1.0 | 3/3 | Complete | 2026-02-18 |
| 11. Cross-Phase Integration Wiring | v1.0 | 2/2 | Complete | 2026-02-18 |
| 12. Retroactive Phase Verification | v1.0 | 3/3 | Complete | 2026-02-18 |
| 13. Core Bug Fixes & Wiring | v1.1 | 3/3 | Complete | 2026-02-19 |
| 14. Enhancement & Quality Expansion | v1.1 | 2/2 | Complete | 2026-02-19 |
| 15. Homebrew Tap Deployment | v1.1 | 1/1 | Complete | 2026-02-19 |
| 16. Enhancement Export & UX Cleanup | v1.1 | 1/1 | Complete | 2026-02-19 |
| 17. CI & Lint | v2.0 | 0/2 | Planned | - |
| 18. Release Pipeline | v2.0 | 0/TBD | Not started | - |
| 19. Core Test Coverage | v2.0 | 0/TBD | Not started | - |
| 20. CLI Test Coverage | v2.0 | 0/TBD | Not started | - |
| 21. Polish & Metadata | v2.0 | 0/TBD | Not started | - |
| 22. Drift Detection Hardening | v2.0 | 0/TBD | Not started | - |
