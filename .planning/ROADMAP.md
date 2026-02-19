# Roadmap: tinkerise

## Milestones

- ✅ **v1.0 MVP** — Phases 1-12 (shipped 2026-02-18)
- 🚧 **v1.1 Tech Debt** — Phases 13-15 (in progress)

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

### 🚧 v1.1 Tech Debt (In Progress)

**Milestone Goal:** Close all 10 tech debt items from v1.0 audit — fix code issues, expand two enhancement modules, deploy Homebrew infrastructure.

- [x] **Phase 13: Core Bug Fixes & Wiring** - Fix diff display, preset enhancement lifecycle, defaultCategory routing, and dead export (completed 2026-02-19)
- [ ] **Phase 14: Enhancement & Quality Expansion** - Add changelog generation, example test files, and full-spectrum drift detection
- [ ] **Phase 15: Homebrew Tap Deployment** - Create external tap repo and deploy auto-update workflow

## Phase Details

### Phase 13: Core Bug Fixes & Wiring
**Goal**: Existing core features work correctly — preset enhancements round-trip through save/use, config keys affect runtime behavior, and conflict diffs show meaningful content
**Depends on**: Nothing (all changes fix existing v1.0 code)
**Requirements**: EPOL-01, PRES-01, PRES-02, CONF-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. Running an enhancement on a project with existing config shows actual content differences in the conflict diff preview (not an empty diff)
  2. `tinkerise preset save` after running enhancements produces a preset file with a populated enhancements array containing the installed enhancement IDs
  3. `tinkerise preset use <name>` on a fresh project auto-applies all enhancements listed in the preset (not just framework and flags)
  4. Setting `defaultCategory` via `tinkerise config set defaultCategory web` causes `tinkerise new` interactive mode to skip or pre-fill the category selection step
  5. The `tinkeriseSummary` export no longer exists in @tinkerise/core public API
**Plans**: 3 plans
Plans:
- [ ] 13-01-PLAN.md — Fix conflict diff display and remove dead tinkeriseSummary export
- [ ] 13-02-PLAN.md — Wire defaultCategory config to interactive scaffold flow
- [ ] 13-03-PLAN.md — Fix preset save/use enhancement lifecycle

### Phase 14: Enhancement & Quality Expansion
**Goal**: Enhancement modules deliver fuller value and drift detection covers the entire scaffolder catalog
**Depends on**: Nothing (independent of Phase 13)
**Requirements**: EPOL-02, EPOL-03, QUAL-01
**Success Criteria** (what must be TRUE):
  1. `tinkerise add changelog` generates a changelog configuration file (e.g., .changelogrc) and installs conventional-changelog (separate enhancement per user decision, not bundled in commitlint)
  2. `tinkerise add testing` generates both Vitest configuration and an example test file demonstrating the test setup
  3. Upstream drift detection snapshots exist for all 14 scaffolders (7 web + 5 backend + 2 mobile), and the drift check script validates all of them
**Plans**: 2 plans
Plans:
- [ ] 14-01-PLAN.md — Create changelog enhancement and expand testing with example test files
- [ ] 14-02-PLAN.md — Expand drift detection snapshots and workflow to all 14 scaffolders

### Phase 15: Homebrew Tap Deployment
**Goal**: Users can install and update tinkerise via Homebrew
**Depends on**: Nothing (external infrastructure, independent of code changes)
**Requirements**: DIST-06, DIST-07
**Success Criteria** (what must be TRUE):
  1. `brew tap tinkerise/tap && brew install tinkerise` successfully installs tinkerise from the tap repository
  2. Publishing a new version to npm automatically triggers a GitHub Actions workflow that updates the Homebrew formula with the new version and SHA256
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
| 13. Core Bug Fixes & Wiring | v1.1 | Complete    | 2026-02-19 | - |
| 14. Enhancement & Quality Expansion | v1.1 | 0/2 | Not started | - |
| 15. Homebrew Tap Deployment | v1.1 | 0/? | Not started | - |
