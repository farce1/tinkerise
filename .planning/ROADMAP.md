# Roadmap: tinkerise

## Milestones

- ✅ **v1.0 MVP** — Phases 1-12 (shipped 2026-02-18)
- ✅ **v1.1 Tech Debt** — Phases 13-16 (shipped 2026-02-19)
- ✅ **v2.0 Quality & Robustness** — Phases 17-23 (shipped 2026-02-20)
- 🚧 **v3.0 Documentation & Polish** — Phases 24-29 (in progress)

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

<details>
<summary>✅ v2.0 Quality & Robustness (Phases 17-23) — SHIPPED 2026-02-20</summary>

- [x] Phase 17: CI & Lint (2/2 plans) — completed 2026-02-19
- [x] Phase 18: Release Pipeline (2/2 plans) — completed 2026-02-19
- [x] Phase 19: Core Test Coverage (2/2 plans) — completed 2026-02-19
- [x] Phase 20: CLI Test Coverage (2/2 plans) — completed 2026-02-19
- [x] Phase 21: Polish & Metadata (2/2 plans) — completed 2026-02-19
- [x] Phase 22: Drift Detection Hardening (2/2 plans) — completed 2026-02-19
- [x] Phase 23: Lint Regression Fix (1/1 plan) — completed 2026-02-19

Full details: `.planning/milestones/v2.0-ROADMAP.md`

</details>

### 🚧 v3.0 Documentation & Polish (In Progress)

**Milestone Goal:** Make tinkerise discoverable and polished with a comprehensive Starlight docs site, improved CLI UX, terminal demos, and updated project presentation.

- [x] **Phase 24: Error Handling & CLI Polish** - Structured errors, friendly messages, help text improvements (completed 2026-02-20)
- [x] **Phase 25: Docs Site Infrastructure** - Starlight scaffold in apps/docs/ with search and code blocks (completed 2026-02-21)
- [x] **Phase 26: Docs Content** - Getting started, guides, reference, and recipes (completed 2026-02-21)
- [x] **Phase 27: VHS Terminal Demos** - Tape files and generated GIFs for key workflows (completed 2026-02-22)
- [x] **Phase 28: README Overhaul** - Hero GIF, value proposition, quickstart, docs link (completed 2026-02-22)
- [ ] **Phase 29: Deployment & Release** - GitHub Pages auto-deploy, release notes, changelog page

## Phase Details

### Phase 24: Error Handling & CLI Polish
**Goal**: Users never see raw stack traces; every CLI failure produces a friendly, actionable message with consistent formatting
**Depends on**: Nothing (first phase in v3.0)
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05
**Success Criteria** (what must be TRUE):
  1. User sees a human-readable error message with a suggested fix when any command fails (no raw stack traces escape to terminal)
  2. User sees a "Did you mean X?" suggestion when they mistype a command name (e.g., `tinkerise scaff` suggests `scaffold`)
  3. User sees usage examples in `--help` output for every command (scaffold, add, list, doctor, update)
  4. All error paths use structured TinkeriseError subclasses that carry error codes and user-facing messages
  5. A top-level error boundary around `program.parseAsync()` catches all unhandled errors and formats them consistently
**Plans:** 3/3 plans complete

Plans:
- [ ] 24-01-PLAN.md — TinkeriseError hierarchy and fuzzy match utility in @tinkerise/core
- [ ] 24-02-PLAN.md — Error boundary, Commander config, and process.exit migration in CLI
- [ ] 24-03-PLAN.md — Usage examples in --help output for all subcommands

### Phase 25: Docs Site Infrastructure
**Goal**: A working Starlight documentation site exists in apps/docs/ with built-in search, syntax-highlighted code blocks, and correct monorepo integration
**Depends on**: Nothing (independent of Phase 24, but sequenced after for content accuracy)
**Requirements**: DOCS-01, DOCS-08, DOCS-09
**Success Criteria** (what must be TRUE):
  1. User can run the Starlight dev server from the monorepo root and see a documentation site with the tinkerise brand
  2. User can search docs content via Pagefind search (built into Starlight, works in production build)
  3. User can see syntax-highlighted code examples in Expressive Code blocks on any content page
  4. The docs site builds successfully with `bun run build` in apps/docs/ (Bun as package manager, Node.js as Astro runtime)
**Plans:** 2/2 plans complete

Plans:
- [ ] 25-01-PLAN.md -- Scaffold Starlight project with branding, theming, and landing page
- [ ] 25-02-PLAN.md -- Monorepo integration, ESLint exclusion, and build verification

### Phase 26: Docs Content
**Goal**: Users can learn everything about tinkerise from the documentation site -- from first install through advanced recipes
**Depends on**: Phase 25 (docs infrastructure must exist before content)
**Requirements**: DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07
**Success Criteria** (what must be TRUE):
  1. User can follow the Getting Started guide from install to first scaffold without needing external help
  2. User can browse individual guides for all 14 scaffolders and all 11 enhancement modules
  3. User can read preset and configuration guides that explain the 4-layer config merge chain with examples
  4. User can look up any CLI command, flag, and option in a generated Command Reference page (single source of truth from CLI help output)
  5. User can follow 3-5 recipe pages for common scenarios (e.g., "Next.js + ESLint + Docker", "Full-stack preset for teams")
**Plans**: 6 plans

Plans:
- [ ] 26-01-PLAN.md -- Onboarding IA and complete Getting Started flow
- [ ] 26-02-PLAN.md -- Web scaffolder guides with command-reference cross-links
- [ ] 26-03-PLAN.md -- Quality/workflow enhancement guides (part 1)
- [ ] 26-04-PLAN.md -- Generated command reference and recipe pages
- [ ] 26-05-PLAN.md -- Backend/mobile scaffolder guides
- [ ] 26-06-PLAN.md -- Remaining enhancements plus configuration and presets

### Phase 27: VHS Terminal Demos
**Goal**: Reproducible terminal demo GIFs exist for key CLI workflows, generated from version-controlled tape files
**Depends on**: Phase 24 (CLI must be polished before recording demos)
**Requirements**: VIS-03, VIS-04
**Success Criteria** (what must be TRUE):
  1. VHS `.tape` files exist for at least 4 key workflows: scaffold, add, list, and doctor
  2. Generated GIF files are committed to the repository and render correctly in both README and docs site
  3. Tape files are reproducible -- running `vhs` on any tape produces a visually consistent recording
**Plans**: 2 plans

Plans:
- [ ] 27-01-PLAN.md -- VHS tape authoring pipeline and deterministic render orchestration
- [ ] 27-02-PLAN.md -- Generate GIF artifacts and embed in README plus docs gallery

### Phase 28: README Overhaul
**Goal**: The README serves as a compelling landing page that converts visitors into users within 30 seconds of reading
**Depends on**: Phase 27 (needs hero GIF), Phase 25 (needs docs site URL)
**Requirements**: VIS-01, VIS-02
**Success Criteria** (what must be TRUE):
  1. README leads with a hero GIF that demonstrates the core scaffold workflow in under 15 seconds
  2. README has a clear value proposition ("One command to scaffold any project"), a copy-paste quickstart command, and a prominent link to the full docs site
  3. README is concise -- details live in docs, README is the hook
**Plans**: 1 plan

Plans:
- [ ] 28-01-PLAN.md -- README conversion funnel rewrite with hero proof, quickstart path, and docs-forward detail compression

### Phase 29: Deployment & Release
**Goal**: Documentation site auto-deploys to GitHub Pages and releases include categorized notes with a changelog page in docs
**Depends on**: Phase 26 (content must exist before deploying), Phase 25 (site must build)
**Requirements**: DIST-01, DIST-02, DIST-03
**Success Criteria** (what must be TRUE):
  1. Pushing docs changes to main automatically deploys the Starlight site to GitHub Pages (path-filtered workflow, no unnecessary builds)
  2. GitHub Releases are created automatically on publish with categorized release notes (features, fixes, docs, etc.)
  3. Documentation site includes a changelog page that reflects the project's release history
**Plans**: 3 plans

Plans:
- [ ] 29-01-PLAN.md -- Path-filtered docs-only GitHub Pages deploy workflow with manual dispatch and concurrency cancellation
- [ ] 29-02-PLAN.md -- Automatic release-note categorization pipeline wired into changesets publish flow
- [ ] 29-03-PLAN.md -- Generated docs changelog page sourced from GitHub release history

## Progress

**Execution Order:**
Phases execute in numeric order: 24 → 25 → 26 → 27 → 28 → 29

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
| 17. CI & Lint | v2.0 | 2/2 | Complete | 2026-02-19 |
| 18. Release Pipeline | v2.0 | 2/2 | Complete | 2026-02-19 |
| 19. Core Test Coverage | v2.0 | 2/2 | Complete | 2026-02-19 |
| 20. CLI Test Coverage | v2.0 | 2/2 | Complete | 2026-02-19 |
| 21. Polish & Metadata | v2.0 | 2/2 | Complete | 2026-02-19 |
| 22. Drift Detection Hardening | v2.0 | 2/2 | Complete | 2026-02-19 |
| 23. Lint Regression Fix | v2.0 | 1/1 | Complete | 2026-02-19 |
| 24. Error Handling & CLI Polish | v3.0 | Complete    | 2026-02-20 | - |
| 25. Docs Site Infrastructure | v3.0 | Complete    | 2026-02-21 | - |
| 26. Docs Content | 6/6 | Complete    | 2026-02-21 | - |
| 27. VHS Terminal Demos | 2/2 | Complete    | 2026-02-22 | - |
| 28. README Overhaul | 1/1 | Complete    | 2026-02-22 | - |
| 29. Deployment & Release | 1/3 | In Progress|  | - |
