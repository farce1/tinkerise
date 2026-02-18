# Requirements: tinkerise

**Defined:** 2026-02-16
**Core Value:** One command to scaffold any project with any stack, delegating to official tools developers already trust

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core CLI

- [ ] **CLI-01**: User can run `tinkerise <category> [framework] [project-name]` to scaffold a project
- [ ] **CLI-02**: User can run `tk` as a short alias for `tinkerise`
- [ ] **CLI-03**: User can run `tinkerise --help` and `tinkerise <command> --help` to see usage and examples
- [ ] **CLI-04**: User can run `tinkerise --version` to see the installed version
- [ ] **CLI-05**: User can run `tinkerise list` to see all available scaffolders and add-ons grouped by category

### Scaffolder Registry

- [ ] **REG-01**: Scaffolder registry is declarative — adding a new scaffolder requires only a data entry, no logic changes
- [ ] **REG-02**: Each registry entry defines flag mapping from tinkerise's unified flags to tool-specific CLI arguments
- [ ] **REG-03**: Each registry entry specifies prerequisites (Node.js version, Python version, etc.) for validation
- [ ] **REG-04**: Each registry entry specifies the integration strategy (direct delegation, wrapped execution, or template-based)
- [ ] **REG-05**: Registry supports version-aware flag mappings to handle upstream scaffolder changes across versions

### Interactive UX

- [ ] **UX-01**: User sees a guided interactive flow when running `tinkerise` without arguments (category > framework > options > enhancements > name > confirm)
- [ ] **UX-02**: User sees a framework selection flow when running `tinkerise <category>` without a framework
- [ ] **UX-03**: User can cancel at any prompt step without side effects
- [ ] **UX-04**: User can run any command fully non-interactively via CLI flags (every interactive option has a flag equivalent)
- [ ] **UX-05**: CI environments are auto-detected via `ci-info` and default to non-interactive mode with sensible defaults
- [ ] **UX-06**: User sees the underlying scaffolder's output directly (inherited stdio) with tinkerise framing for context
- [ ] **UX-07**: User can clearly distinguish tinkerise orchestration output from upstream tool output

### Web Scaffolders

- [ ] **WEB-01**: User can scaffold a Next.js application via `tinkerise web next`
- [ ] **WEB-02**: User can scaffold a Vite application via `tinkerise web vite` with template selection (React, Vue, Svelte, etc.)
- [ ] **WEB-03**: User can scaffold an Astro website via `tinkerise web astro`
- [ ] **WEB-04**: User can scaffold a T3 full-stack app via `tinkerise web t3`
- [ ] **WEB-05**: User can scaffold a Remix application via `tinkerise web remix`
- [ ] **WEB-06**: User can scaffold a TanStack Start application via `tinkerise web tanstack`
- [ ] **WEB-07**: User can scaffold a Turborepo monorepo via `tinkerise monorepo`

### Unified Flags

- [ ] **FLAG-01**: User can pass `--typescript` / `--ts` and it maps correctly to each scaffolder's TypeScript flag
- [ ] **FLAG-02**: User can pass `--tailwind` and it maps correctly to each scaffolder's Tailwind flag
- [ ] **FLAG-03**: User can pass `--eslint` and it maps correctly to each scaffolder's ESLint flag
- [ ] **FLAG-04**: User can pass `--no-git` to prevent git initialization across all scaffolders
- [ ] **FLAG-05**: User can pass `--no-install` to skip dependency installation across all scaffolders
- [ ] **FLAG-06**: User can pass `--package-manager <pm>` to specify pnpm/yarn/npm/bun for the scaffolded project

### Package Manager Detection

- [ ] **PM-01**: tinkerise detects the user's preferred package manager from lockfiles in the current directory
- [ ] **PM-02**: tinkerise detects the `packageManager` field in package.json
- [ ] **PM-03**: User can override detection with `--package-manager` flag
- [ ] **PM-04**: tinkerise falls back to npm when no package manager is detected

### Enhancement System

- [ ] **ENH-01**: Enhancement modules follow a standard interface with detect (check if already present) and install functions
- [ ] **ENH-02**: Enhancement modules receive project context (root path, package manager, framework, installed deps)
- [ ] **ENH-03**: Enhancement modules declare dependencies on other modules for execution ordering
- [ ] **ENH-04**: Enhancement module dependency graph is topologically sorted before execution
- [ ] **ENH-05**: Enhancement modules are idempotent — running twice produces the same result
- [ ] **ENH-06**: When an enhancement is already configured, user is offered skip/merge/replace options
- [ ] **ENH-07**: Enhancement modules adapt their output based on detected framework (e.g., React vs Vue ESLint plugins)
- [ ] **ENH-08**: Centralized dependency version map ensures consistent package versions across enhancements

### Core Enhancements

- [ ] **ADD-01**: User can add ESLint flat config with framework-appropriate plugins via `tinkerise add eslint`
- [ ] **ADD-02**: User can add Prettier config with Tailwind plugin auto-detection via `tinkerise add prettier`
- [ ] **ADD-03**: User can add git hooks via husky + lint-staged for pre-commit linting via `tinkerise add husky`
- [ ] **ADD-04**: User can add GitHub Actions CI workflow (lint, type-check, test, build) via `tinkerise add ci`

### Additional Enhancements

- [ ] **ADD-05**: User can add a multi-stage Dockerfile + .dockerignore via `tinkerise add docker`
- [ ] **ADD-06**: User can add .env.example template, .env in .gitignore, and validation setup via `tinkerise add env`
- [ ] **ADD-07**: User can add conventional commit enforcement + changelog generation via `tinkerise add commitlint`
- [ ] **ADD-08**: User can add Vitest or Jest config with example test files via `tinkerise add testing`
- [ ] **ADD-09**: User can add Renovate config for automated dependency updates via `tinkerise add renovate`
- [ ] **ADD-10**: User can add EditorConfig for cross-editor formatting consistency via `tinkerise add editorconfig`

### Backend Scaffolders

- [ ] **BACK-01**: User can scaffold a Python FastAPI project via `tinkerise backend fastapi`
- [ ] **BACK-02**: User can scaffold a Python Django project via `tinkerise backend django`
- [ ] **BACK-03**: User can scaffold a Go HTTP service via `tinkerise backend go`
- [ ] **BACK-04**: User can scaffold a Rust web service (Actix/Axum) via `tinkerise backend rust`
- [ ] **BACK-05**: User can scaffold an Express.js API via `tinkerise backend express`

### Mobile Scaffolders

- [ ] **MOB-01**: User can scaffold a Flutter application via `tinkerise mobile flutter`
- [ ] **MOB-02**: User can scaffold a React Native (Expo) app via `tinkerise mobile rn`

### Utility Templates

- [ ] **UTIL-01**: User can scaffold an MCP server template via `tinkerise mcp`
- [ ] **UTIL-02**: User can scaffold a Node.js CLI tool template via `tinkerise cli`
- [ ] **UTIL-03**: User can scaffold an npm package / library template via `tinkerise lib`

### Diagnostics

- [ ] **DIAG-01**: User can run `tinkerise doctor` to check system for all required tools (Node, Python, Go, Rust, Flutter, Dart)
- [ ] **DIAG-02**: `tinkerise doctor` reports status per framework as success/warning/error with remediation instructions
- [ ] **DIAG-03**: User can run `tinkerise update` to self-update with install-method-aware instructions (Homebrew vs npm vs npx)

### Configuration

- [ ] **CFG-01**: User can manage global config at `~/.config/tinkerise/config.json` for defaults (preferred PM, TypeScript preference)
- [ ] **CFG-02**: User can create project-level config at `tinkerise.config.ts` for team presets
- [ ] **CFG-03**: CLI flags override project config which overrides global config
- [ ] **CFG-04**: `defineConfig()` TypeScript helper provides autocomplete for configuration authors
- [ ] **CFG-05**: User can run `tinkerise config` to get/set configuration values

### Presets

- [ ] **PRE-01**: User can save current project configuration as a reusable preset via `tinkerise preset save <name>`
- [ ] **PRE-02**: User can apply a saved preset via `tinkerise preset use <name>`
- [ ] **PRE-03**: User can distribute presets as npm packages (e.g., `@mycompany/tinkerise-preset-saas`)
- [ ] **PRE-04**: Presets capture framework choice, options, and post-scaffold enhancement selections
- [ ] **PRE-05**: Preset configuration merges with CLI overrides for customization

### Distribution

- [ ] **DIST-01**: tinkerise is published to npm with `tinkerise` and `tk` bin entries
- [ ] **DIST-02**: User can run `npx tinkerise` without global installation
- [ ] **DIST-03**: Homebrew tap (`homebrew-tinkerise`) provides `brew install tinkerise` for macOS/Linux
- [ ] **DIST-04**: Homebrew formula updates are automated via GitHub Actions when new npm version is published
- [ ] **DIST-05**: tinkerise detects its installation method at runtime and adjusts update instructions accordingly

### Quality & Infrastructure

- [ ] **QA-01**: Unit tests validate flag mapping logic, registry resolution, enhancement dependency graphs, and config merging
- [ ] **QA-02**: Integration tests validate full CLI invocation path with exit codes, stdout assertions, and file existence checks
- [ ] **QA-03**: E2E scaffold tests validate generated projects install, lint, and build (gated behind `TINKERISE_E2E=true`)
- [ ] **QA-04**: CI runs across Node.js 20 and 22 on Ubuntu, with macOS for Homebrew validation
- [ ] **QA-05**: CI includes Windows runners for cross-platform validation from day one
- [ ] **QA-06**: Weekly automated smoke tests diff upstream scaffolder `--help` output to detect flag mapping drift
- [ ] **QA-07**: License audit runs in CI to prevent incompatible dependencies (only MIT, Apache-2.0, BSD, ISC)
- [ ] **QA-08**: Release automation via changesets + GitHub Actions for npm + Homebrew publishing

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Scaffolding

- **ADV-01**: User can add packages to existing Turborepo/Nx workspaces (monorepo-aware scaffolding)
- **ADV-02**: User can describe project in natural language and get AI-recommended stack

### Community

- **COM-01**: Community preset registry / showcase for discovering shared presets
- **COM-02**: Formal plugin API for community-contributed scaffolders with lifecycle hooks
- **COM-03**: VS Code extension for visual project scaffolding

### Telemetry

- **TEL-01**: Opt-in, privacy-respecting telemetry for prioritizing scaffolder support

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Custom template/generator ecosystem | Yeoman's 5,600+ generators proved crowd-sourced generators fail — curate instead |
| Auto-installing system prerequisites | System package management is a minefield (OS, permissions, versions) — use `doctor` for detection + instructions |
| Catching/reformatting upstream output | Breaks interactive scaffolders, hides errors, maintenance nightmare — inherit stdio |
| Supporting every framework from day one | Quality over quantity — each integration needs tests, flag mapping, prerequisite checks |
| Default-on telemetry | User distrust risk — opt-in only, respect DO_NOT_TRACK |
| Node.js 18 support | EOL April 2025 — target Node.js >= 20.11.0 per research |
| CJS output | All major deps are ESM-only — pure ESM, no dual package |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 3 | Pending |
| CLI-02 | Phase 6 | Pending |
| CLI-03 | Phase 1 | Pending |
| CLI-04 | Phase 1 | Pending |
| CLI-05 | Phase 4 | Pending |
| REG-01 | Phase 2 | Pending |
| REG-02 | Phase 2 | Pending |
| REG-03 | Phase 2 | Pending |
| REG-04 | Phase 2 | Pending |
| REG-05 | Phase 2 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| UX-04 | Phase 3 | Pending |
| UX-05 | Phase 3 | Pending |
| UX-06 | Phase 2 | Pending |
| UX-07 | Phase 2 | Pending |
| WEB-01 | Phase 4 | Pending |
| WEB-02 | Phase 4 | Pending |
| WEB-03 | Phase 4 | Pending |
| WEB-04 | Phase 4 | Pending |
| WEB-05 | Phase 4 | Pending |
| WEB-06 | Phase 4 | Pending |
| WEB-07 | Phase 4 | Pending |
| FLAG-01 | Phase 4 | Pending |
| FLAG-02 | Phase 4 | Pending |
| FLAG-03 | Phase 4 | Pending |
| FLAG-04 | Phase 4 | Pending |
| FLAG-05 | Phase 4 | Pending |
| FLAG-06 | Phase 4 | Pending |
| PM-01 | Phase 3 | Pending |
| PM-02 | Phase 3 | Pending |
| PM-03 | Phase 3 | Pending |
| PM-04 | Phase 3 | Pending |
| ENH-01 | Phase 5 | Pending |
| ENH-02 | Phase 5 | Pending |
| ENH-03 | Phase 5 | Pending |
| ENH-04 | Phase 5 | Pending |
| ENH-05 | Phase 5 | Pending |
| ENH-06 | Phase 5 | Pending |
| ENH-07 | Phase 5 | Pending |
| ENH-08 | Phase 5 | Pending |
| ADD-01 | Phase 6 | Pending |
| ADD-02 | Phase 6 | Pending |
| ADD-03 | Phase 6 | Pending |
| ADD-04 | Phase 6 | Pending |
| ADD-05 | Phase 9 | Pending |
| ADD-06 | Phase 9 | Pending |
| ADD-07 | Phase 9 | Pending |
| ADD-08 | Phase 9 | Pending |
| ADD-09 | Phase 9 | Pending |
| ADD-10 | Phase 9 | Pending |
| BACK-01 | Phase 7 | Pending |
| BACK-02 | Phase 7 | Pending |
| BACK-03 | Phase 7 | Pending |
| BACK-04 | Phase 7 | Pending |
| BACK-05 | Phase 7 | Pending |
| MOB-01 | Phase 7 | Pending |
| MOB-02 | Phase 7 | Pending |
| UTIL-01 | Phase 9 | Pending |
| UTIL-02 | Phase 9 | Pending |
| UTIL-03 | Phase 9 | Pending |
| DIAG-01 | Phase 7 | Pending |
| DIAG-02 | Phase 7 | Pending |
| DIAG-03 | Phase 10 | Pending |
| CFG-01 | Phase 8 | Pending |
| CFG-02 | Phase 8 | Pending |
| CFG-03 | Phase 11 | Pending |
| CFG-04 | Phase 8 | Pending |
| CFG-05 | Phase 8 | Pending |
| PRE-01 | Phase 8 | Pending |
| PRE-02 | Phase 8 | Pending |
| PRE-03 | Phase 8 | Pending |
| PRE-04 | Phase 8 | Pending |
| PRE-05 | Phase 8 | Pending |
| DIST-01 | Phase 10 | Pending |
| DIST-02 | Phase 10 | Pending |
| DIST-03 | Phase 10 | Pending |
| DIST-04 | Phase 10 | Pending |
| DIST-05 | Phase 10 | Pending |
| QA-01 | Phase 1 | Pending |
| QA-02 | Phase 1 | Pending |
| QA-03 | Phase 4 | Pending |
| QA-04 | Phase 1 | Pending |
| QA-05 | Phase 1 | Pending |
| QA-06 | Phase 4 | Pending |
| QA-07 | Phase 1 | Pending |
| QA-08 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 88 total
- Mapped to phases: 88
- Unmapped: 0

**Gap Closure (added 2026-02-18):**
- Phase 11 addresses: CFG-03 (integration wiring), PRE-02 (preset use wiring), CLI-05 (list enhancements)
- Phase 12 verifies: REG-01-05, UX-06-07 (Phase 2), ADD-01-04, CLI-02 (Phase 6), DIST-01-05, DIAG-03, QA-08 (Phase 10)

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-18 after milestone audit gap closure*
