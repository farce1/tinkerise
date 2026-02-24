# tinkerise

## What This Is

tinkerise is an open-source CLI tool that unifies project scaffolding across the modern development ecosystem. One command scaffolds any project — web, backend, mobile, or utility — through 14 official framework scaffolders, with 11 composable post-scaffold enhancements, team-shareable presets, and a 4-layer configuration system. It wraps, it does not replace.

## Core Value

One command to scaffold any project with any stack, delegating to official tools developers already trust — tinkerise wraps, it does not replace.

## Requirements

### Validated

- ✓ CLI skeleton with commander + @clack/prompts + execa — v1.0
- ✓ Scaffolder registry with declarative detect → map → execute pattern — v1.0
- ✓ Web framework scaffolders: Next.js, Vite, Astro, T3, Remix, TanStack Start, Turbo — v1.0
- ✓ Interactive mode (@clack/prompts) and non-interactive mode (CLI flags) — v1.0
- ✓ Enhancement module system (ESLint, Prettier, husky + lint-staged, GitHub Actions CI) — v1.0
- ✓ npm publishing with npx support and `tk` short alias — v1.0
- ✓ Homebrew tap with automated formula updates (template-complete) — v1.0
- ✓ Prerequisite detection and `tinkerise doctor` command — v1.0
- ✓ Backend scaffolders: FastAPI, Django, Go, Rust (Axum), Express — v1.0
- ✓ Mobile scaffolders: Flutter, React Native (Expo) — v1.0
- ✓ Preset system (save, use, npm distribution) — v1.0
- ✓ Configuration file support with defineConfig() — v1.0
- ✓ Additional enhancement modules: Docker, env, commitlint, testing, renovate, editorconfig — v1.0
- ✓ MCP server, CLI tool, and npm library templates — v1.0
- ✓ `tinkerise add` for existing projects — v1.0
- ✓ `tinkerise update` with install-method-aware self-update — v1.0
- ✓ `tinkerise list` command to show available scaffolders and add-ons — v1.0
- ✓ Conflict diff shows actual before/after content differences — v1.1
- ✓ Preset save captures installed enhancement IDs — v1.1
- ✓ Preset use auto-applies enhancements from preset — v1.1
- ✓ defaultCategory config wired to interactive scaffold flow — v1.1
- ✓ Drift detection covers all 14 scaffolders — v1.1
- ✓ Dead tinkeriseSummary export removed — v1.1
- ✓ Homebrew tap repo deployed with formula — v1.1
- ✓ Homebrew auto-update workflow on npm publish — v1.1
- ✓ Changelog enhancement module (standalone) — v1.1
- ✓ Testing enhancement generates example test files — v1.1
- ✓ Zero ESLint errors across all packages with Bun dependency caching in CI — v2.0
- ✓ Release pipeline fixed: exited pre-release mode, corrected repo slugs, jq for Homebrew version — v2.0
- ✓ NPM_TOKEN and HOMEBREW_TAP_TOKEN setup documented in RELEASE.md — v2.0
- ✓ Test coverage for all 10 previously untested modules (139 tests added) — v2.0
- ✓ Complete npm package metadata across all 4 packages — v2.0
- ✓ Consistent `farce1/tinkerise` repository URLs everywhere — v2.0
- ✓ CODE_OF_CONDUCT.md (Contributor Covenant v2.1) — v2.0
- ✓ Clean .gitignore with tsup artifact pattern, dead TinkeriseConfig export removed — v2.0
- ✓ Drift detection hardened: dedicated install steps, PEP 668 compat, GitHub Issue on drift — v2.0
- ✓ Starlight docs site infrastructure shipped in `apps/docs` with monorepo integration — v3.0
- ✓ Full documentation coverage shipped (getting started, scaffolder/enhancement guides, config/presets, recipes, command reference) — v3.0
- ✓ README converted to docs-forward landing page with hero GIF quickstart flow — v3.0
- ✓ Reproducible VHS terminal demos and committed GIF artifacts for docs and README — v3.0
- ✓ Docs deployment and changelog/release-note automation via GitHub Actions — v3.0
- ✓ Production docs reliability verification closed (`DOCS-01`, `DOCS-08`, `DOCS-09`, `DOCS-13`) — v3.1
- ✓ CLI runtime error UX reliability closed (`CLI-01`, `CLI-02`, `CLI-03`, `CLI-04`, `CLI-05`, `CLI-08`) — v3.1
- ✓ Reliability closure evidence and required CI/release gates shipped (`REL-01`, `REL-02`) — v3.1

### Active

- [ ] REL-03: Scheduled unfiltered docs verification to catch path-filter trigger gaps
- [ ] CLI-06: Shell completions (bash, zsh, fish)
- [ ] CLI-07: `--json` output mode for scripting
- [ ] DOCS-10: Contributor documentation on the docs site
- [ ] DOCS-11: Showcase/gallery of projects created with tinkerise
- [ ] DOCS-12: Localized docs content

### Out of Scope

- AI-assisted project initialization — future, not core scaffolding
- Formal plugin API for community scaffolders — defer until community demand proven
- Enterprise features (private preset registries, audit logging) — post-v2
- Cross-platform binary distribution (Node.js SEA / Bun compile) — post-v2
- VS Code extension — post-v2
- Monorepo-aware scaffolding (adding to existing workspaces) — post-v2
- Telemetry — post-v2
- AI-generated scaffolder templates — preserve wrap-official-tools principle

## Current State

Shipped **v3.1 Reliability Sweep** on 2026-02-24.

- Milestone scope: Phases 30-32 (9 plans, 24 tasks)
- Outcome: production docs reliability and CLI runtime error UX are now verified and enforceable through CI/release gates
- Audit outcome: 12/12 requirements satisfied; no blockers; 2 deferred operational tech-debt items tracked in `v3.1-MILESTONE-AUDIT.md`

## Next Milestone Goals

**Goal:** Define the next milestone scope based on post-reliability priorities while preserving the v3.1 reliability baseline.

**Candidate focus areas:**
- Reliability operations hardening (`REL-03`)
- CLI UX expansion (`CLI-06`, `CLI-07`)
- Docs expansion (`DOCS-10`, `DOCS-11`, `DOCS-12`)

<details>
<summary>Archived milestone planning context</summary>

v3.1 closed the carried-over v3.0 reliability gaps for docs production checks and CLI runtime failure UX. Planning context for that execution cycle now lives in `.planning/milestones/v3.1-*`.

</details>

## Context

Shipped v3.1 with reliability closure evidence and mandatory reliability gates across docs deploy, CI, and release preflight paths.
Tech stack: Bun monorepo, Turborepo, tsup ESM build, Commander.js, @clack/prompts, Zod 4.
Testing: 900+ Vitest tests, all modules covered, E2E gated behind env var.
Distribution: npm + Homebrew tap (farce1/homebrew-tap, auto-update on publish).
Release: changesets + GitHub Actions for automated npm + Homebrew publishing, documented in RELEASE.md.
Enhancements: 11 modules (ESLint, Prettier, husky, CI, Docker, env, commitlint, testing, renovate, editorconfig, changelog).
Canonical repo: farce1/tinkerise (GitHub).
CI: Green on all platforms, Bun dependency caching enabled, lint + test + typecheck + build pipeline verified.
Community: CODE_OF_CONDUCT.md, CONTRIBUTING.md with correct URLs.

All v2.0 known issues resolved: CI green (lint errors fixed), release pipeline working (exited pre-release mode, jq version reading), all modules tested, URLs consistent, metadata complete, .gitignore clean.

## Constraints

- **Tech stack**: TypeScript 5.x, commander.js, @clack/prompts, execa v9, Zod 4, tsup, Bun, Turborepo, Vitest
- **Node.js**: >= 20.11.0 (Node 18 EOL April 2025)
- **License**: MIT — all dependencies must be MIT, Apache-2.0, BSD, or ISC
- **Architecture**: Scaffolder registry must be declarative (adding a scaffolder = adding a registry entry, no logic changes)
- **Design principle**: Wrap, don't replace — always delegate to official scaffolding tools
- **Design principle**: Curated, not crowd-sourced — support only official, well-maintained scaffolders

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use commander.js over oclif | Lightweight, better TS support, avoids heavyweight plugin system | ✓ Good — works well at 14 scaffolders + 11 enhancements |
| @clack/prompts over inquirer | Modern UX, adopted by create-t3-app and create-astro | ✓ Good — clean interactive flows |
| Declarative scaffolder registry | Adding scaffolders requires no code changes, just data | ✓ Good — 14 scaffolders added as pure data entries |
| Bun monorepo with Turborepo | Fast, disk-efficient, independent versioning of packages | ✓ Good — parallel builds, clean workspace isolation |
| Three integration strategies | Direct delegation, wrapped execution, template-based — chosen per scaffolder's capabilities | ✓ Good — all three strategies in use |
| Custom Homebrew tap (not core) | No approval delays, full control over formula | ✓ Good — deployed to farce1/homebrew-tap |
| Zod 4 for runtime validation | Modern schema library, z.record() API, TypeScript-first | ✓ Good — clean schema definitions across all packages |
| Callback-based conflict resolution | onConflict, onDependencyApproval decouple core from UI | ✓ Good — clean separation of concerns |
| ESM-only output (no CJS) | All major deps are ESM-only | ✓ Good — simplified build, no dual-package complexity |
| createRequire for CJS imports | Stable across all Node versions for ci-info, semver | ✓ Good — reliable CJS interop |
| 4-layer config merge chain | CLI > project > global > preset priority | ✓ Good — intuitive override semantics |
| Changesets for versioning | Fixed versioning across 4 packages | ✓ Good — consistent version bumps |
| Post-install diff for conflict resolution | Install first, then diff — file content restored on skip | ✓ Good — shows real content differences |
| Changelog module independent of commitlint | Separate enhancement, dependsOn: [] with cross-reference hint | ✓ Good — independent install, clear relationship |
| Preset category > defaultCategory | Presets are more specific than global config | ✓ Good — intuitive override semantics |
| ESLint rule overrides for Bun CLI (v2.0) | process global and console.log are idiomatic in Bun CLI context | ✓ Good — 2 targeted overrides vs 17+ file changes |
| jq for Homebrew version reading (v2.0) | Avoids CJS/ESM mismatch in CI environment | ✓ Good — reliable JSON parsing in CI |
| eslint-disable for post-vi.mock imports (v2.0) | vitest hoists vi.mock calls, import-after-mock is intentional | ✓ Good — clean test patterns |
| Documentation-based drift snapshots | CI replaces on first run when tools unavailable locally | ⚠️ Revisit — 5 of 7 new snapshots are documentation-based |
| Personal account Homebrew tap | farce1/homebrew-tap instead of tinkerise org | ⚠️ Revisit — migrate when org tap available |

| Starlight for docs framework | Content-focused, built-in search/sidebar/responsive, Astro ecosystem | ✓ Good — shipped as v3.0 docs platform |
| Post-deploy production smoke gate | Verify docs availability/search/code rendering against deployed target before considering docs deploy healthy | ✓ Good — requirement-tagged smoke evidence now enforced in workflow |
| Runtime error conformance matrix | Use fixture-driven UX/channel/exit assertions as maintainers' contract test surface | ✓ Good — deterministic `test:conformance` gate shipped |
| Reliability closure + required checks | Map requirements to evidence artifacts and require `CI / Reliability Gates` on main | ✓ Good — REL-01 and REL-02 closed with auditable policy record |

---
*Last updated: 2026-02-24 after completing milestone v3.1 Reliability Sweep*
