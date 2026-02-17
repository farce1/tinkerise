# Roadmap: tinkerise

## Overview

tinkerise delivers a unified CLI scaffolding tool in 10 phases, progressing from monorepo foundation through the detect-map-execute pipeline, interactive UX, web framework scaffolders, enhancement system, backend/mobile expansion, configuration/presets, utility templates, and distribution. Each phase delivers a coherent, testable capability that builds on prior work. The architecture follows antfu/ni's proven patterns and create-t3-app's enhancement model, wrapping official scaffolders rather than replacing them.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Foundation** - Monorepo structure, build pipeline, CI infrastructure, and CLI skeleton (completed 2026-02-17)
- [ ] **Phase 2: Scaffolder Registry & Execution** - Declarative registry, detect-map-execute pipeline, and process execution
- [ ] **Phase 3: Interactive UX & Package Manager Detection** - Prompt flows, non-interactive mode, CI detection, and PM detection
- [ ] **Phase 4: Web Framework Scaffolders** - All 7 web scaffolders with unified flag mapping
- [ ] **Phase 5: Enhancement Module System** - Enhancement architecture, dependency graph resolution, and framework adaptation
- [ ] **Phase 6: Core Enhancements & Add Command** - ESLint, Prettier, husky, GitHub Actions CI, and `tinkerise add`
- [ ] **Phase 7: Backend & Mobile Scaffolders** - Backend (FastAPI, Django, Go, Rust, Express), mobile (Flutter, React Native), and `tinkerise doctor`
- [ ] **Phase 8: Configuration & Presets** - Config management (global/project/CLI merge), preset save/use/distribute
- [ ] **Phase 9: Additional Enhancements & Utility Templates** - Docker, env, commitlint, testing, renovate, editorconfig + MCP/CLI/lib templates
- [ ] **Phase 10: Distribution & Release Automation** - npm publishing, Homebrew tap, self-update, final QA automation, and release pipeline

## Phase Details

### Phase 1: Project Foundation
**Goal**: Developers can clone the repo and have a working monorepo with build, lint, and test infrastructure that produces a runnable CLI binary
**Depends on**: Nothing (first phase)
**Requirements**: CLI-03, CLI-04, QA-01, QA-02, QA-04, QA-05, QA-07
**Success Criteria** (what must be TRUE):
  1. Running `pnpm build` produces a working CLI binary that responds to `--help` and `--version`
  2. Running `pnpm test` executes unit and integration test suites across all packages
  3. CI runs on push across Node.js 20 and 22 on Ubuntu, macOS, and Windows
  4. License audit passes in CI, rejecting any non-MIT/Apache-2.0/BSD/ISC dependency
**Plans**: 4 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffolding with Bun + Turborepo and tsup ESM build pipeline (Wave 1)
- [x] 01-02-PLAN.md — ESLint flat config, commitlint, husky, CLI branded help, CONTRIBUTING.md (Wave 2)
- [x] 01-03-PLAN.md — GitHub Actions CI cross-platform matrix and license audit (Wave 3)
- [x] 01-04-PLAN.md — Vitest workspace, unit tests, CLI integration tests (Wave 3)

### Phase 2: Scaffolder Registry & Execution
**Goal**: The detect-map-execute pipeline works end-to-end -- a scaffolder can be resolved from a registry entry and executed as a subprocess
**Depends on**: Phase 1
**Requirements**: REG-01, REG-02, REG-03, REG-04, REG-05, UX-06, UX-07
**Success Criteria** (what must be TRUE):
  1. Adding a new scaffolder requires only a data entry in the registry -- no logic changes anywhere
  2. Registry entries define flag mappings, prerequisites, and integration strategy as declarative data
  3. Upstream scaffolder output is visible directly to the user with clear tinkerise framing distinguishing orchestration from tool output
  4. Version-aware flag mappings allow different flag translations for different upstream scaffolder versions
**Plans**: 3 plans in 2 waves

Plans:
- [ ] 02-01-PLAN.md -- Declarative scaffolder registry data model with Zod schemas and defineScaffolder() helper (Wave 1)
- [ ] 02-02-PLAN.md -- Flag mapping engine with version-aware resolution and prerequisite checker (Wave 2)
- [ ] 02-03-PLAN.md -- Process executor with inherited stdio, output framing, and end-to-end pipeline (Wave 2)

### Phase 3: Interactive UX & Package Manager Detection
**Goal**: Users experience a polished prompt flow when running tinkerise interactively, and the tool correctly detects and uses their preferred package manager
**Depends on**: Phase 2
**Requirements**: CLI-01, UX-01, UX-02, UX-03, UX-04, UX-05, PM-01, PM-02, PM-03, PM-04
**Success Criteria** (what must be TRUE):
  1. Running `tinkerise` with no arguments launches a guided interactive flow (category > framework > options > name > confirm)
  2. Running `tinkerise web` without a framework shows framework selection within that category
  3. User can cancel at any prompt step and nothing is created or modified
  4. Every interactive option has a CLI flag equivalent for fully non-interactive execution
  5. In a directory with a pnpm-lock.yaml, tinkerise automatically uses pnpm; `--package-manager` overrides this
**Plans**: 3 plans in 3 waves

Plans:
- [ ] 03-01-PLAN.md — PM detection pipeline + CI detection in @tinkerise/core (Wave 1, TDD)
- [ ] 03-02-PLAN.md — Interactive prompt flow with Commander.js routing + @clack/prompts modules (Wave 2)
- [ ] 03-03-PLAN.md — Non-interactive mode, CI guard, and hybrid flag bypass (Wave 3)

### Phase 4: Web Framework Scaffolders
**Goal**: Users can scaffold any of 7 web frameworks through tinkerise with unified flags that map correctly to each tool's native arguments
**Depends on**: Phase 3
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, FLAG-01, FLAG-02, FLAG-03, FLAG-04, FLAG-05, FLAG-06, CLI-05, QA-03, QA-06
**Success Criteria** (what must be TRUE):
  1. `tinkerise web next my-app --ts --tailwind` creates a Next.js project with TypeScript and Tailwind enabled
  2. `tinkerise web vite my-app` offers template selection (React, Vue, Svelte, etc.) and scaffolds the chosen template
  3. All 7 web scaffolders (Next.js, Vite, Astro, T3, Remix, TanStack Start, Turbo) produce working projects
  4. `tinkerise list` shows all available scaffolders grouped by category
  5. Unified flags (--typescript, --tailwind, --eslint, --no-git, --no-install, --package-manager) work across all web scaffolders
**Plans**: TBD

Plans:
- [ ] 04-01: Next.js and Vite scaffolder registry entries + E2E tests
- [ ] 04-02: Astro, T3, and Remix scaffolder registry entries + E2E tests
- [ ] 04-03: TanStack Start and Turborepo scaffolder entries + E2E tests
- [ ] 04-04: Unified flag mapping across all web scaffolders
- [ ] 04-05: `tinkerise list` command and weekly upstream smoke tests

### Phase 5: Enhancement Module System
**Goal**: The enhancement architecture is in place -- modules can declare dependencies, receive project context, detect existing config, and execute in topologically sorted order
**Depends on**: Phase 4
**Requirements**: ENH-01, ENH-02, ENH-03, ENH-04, ENH-05, ENH-06, ENH-07, ENH-08
**Success Criteria** (what must be TRUE):
  1. Enhancement modules follow a standard interface with detect and install functions
  2. Modules receive project context (root path, package manager, framework, installed deps) and adapt output accordingly
  3. Running an enhancement twice on the same project produces the same result (idempotent)
  4. When an enhancement already exists, user is offered skip/merge/replace options
  5. Module dependency graph is topologically sorted -- a module that depends on another always runs after it
**Plans**: TBD

Plans:
- [ ] 05-01: Enhancement module interface and project context
- [ ] 05-02: Dependency graph and topological sort
- [ ] 05-03: Idempotency detection and conflict resolution (skip/merge/replace)
- [ ] 05-04: Framework-aware adaptation and centralized version map

### Phase 6: Core Enhancements & Add Command
**Goal**: Users can add ESLint, Prettier, husky, and GitHub Actions CI to any scaffolded project via `tinkerise add`
**Depends on**: Phase 5
**Requirements**: ADD-01, ADD-02, ADD-03, ADD-04, CLI-02
**Success Criteria** (what must be TRUE):
  1. `tinkerise add eslint` installs ESLint flat config with framework-appropriate plugins (React, Vue, etc.)
  2. `tinkerise add prettier` installs Prettier with Tailwind plugin auto-detected if Tailwind is present
  3. `tinkerise add husky` sets up husky + lint-staged for pre-commit linting
  4. `tinkerise add ci` generates a GitHub Actions workflow that lints, type-checks, tests, and builds
  5. `tk` works as a short alias for `tinkerise` across all commands
**Plans**: TBD

Plans:
- [ ] 06-01: `tinkerise add` command and enhancement selection UX
- [ ] 06-02: ESLint flat config enhancement module
- [ ] 06-03: Prettier enhancement module
- [ ] 06-04: Husky + lint-staged enhancement module
- [ ] 06-05: GitHub Actions CI enhancement module
- [ ] 06-06: `tk` short alias bin entry

### Phase 7: Backend & Mobile Scaffolders
**Goal**: Users can scaffold backend and mobile projects through tinkerise, and `tinkerise doctor` validates that the required ecosystem tools are installed
**Depends on**: Phase 4
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04, BACK-05, MOB-01, MOB-02, DIAG-01, DIAG-02
**Success Criteria** (what must be TRUE):
  1. `tinkerise backend fastapi my-api` scaffolds a working FastAPI project
  2. All 5 backend scaffolders (FastAPI, Django, Go, Rust/Axum, Express) produce working projects
  3. `tinkerise mobile flutter my-app` scaffolds a Flutter application
  4. `tinkerise mobile rn my-app` scaffolds a React Native (Expo) application
  5. `tinkerise doctor` reports status for all required tools (Node, Python, Go, Rust, Flutter, Dart) with remediation instructions
**Plans**: TBD

Plans:
- [ ] 07-01: FastAPI and Django scaffolder entries + prerequisite checks
- [ ] 07-02: Go and Rust (Axum) scaffolder entries + prerequisite checks
- [ ] 07-03: Express scaffolder entry
- [ ] 07-04: Flutter and React Native (Expo) scaffolder entries
- [ ] 07-05: `tinkerise doctor` command with per-framework reporting

### Phase 8: Configuration & Presets
**Goal**: Users can persist preferences in config files and save/share project configurations as reusable presets
**Depends on**: Phase 6
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, PRE-01, PRE-02, PRE-03, PRE-04, PRE-05
**Success Criteria** (what must be TRUE):
  1. User can set defaults (preferred PM, TypeScript preference) in `~/.config/tinkerise/config.json` and they apply to all scaffold commands
  2. User can create a `tinkerise.config.ts` with `defineConfig()` helper that provides autocomplete
  3. CLI flags override project config, which overrides global config
  4. `tinkerise preset save my-stack` captures current scaffold+enhancement selections as a reusable preset
  5. `tinkerise preset use my-stack` applies a saved preset, and presets can be distributed as npm packages
**Plans**: TBD

Plans:
- [ ] 08-01: Global and project config with cosmiconfig resolution
- [ ] 08-02: `defineConfig()` helper and `tinkerise config` command
- [ ] 08-03: Config merge chain (CLI > project > global > preset)
- [ ] 08-04: Preset save and use commands
- [ ] 08-05: Preset npm distribution and merge with CLI overrides

### Phase 9: Additional Enhancements & Utility Templates
**Goal**: Users have access to the full enhancement catalog and can scaffold utility projects (MCP servers, CLI tools, npm libraries)
**Depends on**: Phase 6, Phase 7
**Requirements**: ADD-05, ADD-06, ADD-07, ADD-08, ADD-09, ADD-10, UTIL-01, UTIL-02, UTIL-03
**Success Criteria** (what must be TRUE):
  1. `tinkerise add docker` generates a multi-stage Dockerfile and .dockerignore
  2. All 6 additional enhancements (docker, env, commitlint, testing, renovate, editorconfig) install correctly
  3. `tinkerise mcp` scaffolds an MCP server template
  4. `tinkerise cli` scaffolds a Node.js CLI tool template
  5. `tinkerise lib` scaffolds an npm package/library template
**Plans**: TBD

Plans:
- [ ] 09-01: Docker and env enhancement modules
- [ ] 09-02: Commitlint and testing enhancement modules
- [ ] 09-03: Renovate and EditorConfig enhancement modules
- [ ] 09-04: MCP server template scaffolder
- [ ] 09-05: CLI tool and npm library template scaffolders

### Phase 10: Distribution & Release Automation
**Goal**: tinkerise is published and installable via npm and Homebrew with automated release pipeline and self-update capability
**Depends on**: Phase 8, Phase 9
**Requirements**: DIST-01, DIST-02, DIST-03, DIST-04, DIST-05, DIAG-03, QA-08
**Success Criteria** (what must be TRUE):
  1. `npm install -g tinkerise` installs the CLI with both `tinkerise` and `tk` bin entries working
  2. `npx tinkerise` works without global installation
  3. `brew install tinkerise` installs via the Homebrew tap on macOS/Linux
  4. Publishing a new npm version automatically triggers Homebrew formula update via GitHub Actions
  5. `tinkerise update` detects installation method (npm vs Homebrew vs npx) and provides appropriate update instructions
**Plans**: TBD

Plans:
- [ ] 10-01: npm package configuration and bin entries
- [ ] 10-02: Homebrew tap formula and automation
- [ ] 10-03: `tinkerise update` with install-method detection
- [ ] 10-04: Release automation with changesets + GitHub Actions

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10
Note: Phase 7 depends on Phase 4 (not Phase 6), so it can run in parallel with Phases 5-6 if desired.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation | 4/4 | Complete | 2026-02-17 |
| 2. Scaffolder Registry & Execution | 0/3 | Not started | - |
| 3. Interactive UX & Package Manager Detection | 0/3 | Not started | - |
| 4. Web Framework Scaffolders | 0/5 | Not started | - |
| 5. Enhancement Module System | 0/4 | Not started | - |
| 6. Core Enhancements & Add Command | 0/6 | Not started | - |
| 7. Backend & Mobile Scaffolders | 0/5 | Not started | - |
| 8. Configuration & Presets | 0/5 | Not started | - |
| 9. Additional Enhancements & Utility Templates | 0/5 | Not started | - |
| 10. Distribution & Release Automation | 0/4 | Not started | - |
