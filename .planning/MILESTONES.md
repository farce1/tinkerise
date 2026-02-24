# Milestones

## v1.0 MVP (Shipped: 2026-02-18)

**Phases:** 1-12 (45 plans)
**Lines of code:** 18,820 TypeScript
**Tests:** 757 passing across 3 packages
**Timeline:** 3 days (2026-02-16 → 2026-02-18)
**Git range:** `feat(01-01)` → `docs(v1.0)`

**Key accomplishments:**
1. Bun monorepo with Turborepo, tsup ESM build, CI cross-platform matrix, and 757 passing tests
2. Declarative scaffolder registry with detect-map-execute pipeline supporting 14 scaffolders (7 web, 5 backend, 2 mobile)
3. Interactive prompt flows with @clack/prompts, non-interactive CLI mode, and smart package manager detection
4. Enhancement module system with topological dependency sorting, conflict resolution, and 10 enhancement modules
5. Configuration system with 4-layer merge chain (CLI > project > global > preset) and shareable npm presets
6. npm publishing pipeline with changesets, GitHub Actions release, self-update command, and Homebrew tap automation

**Delivered:** A unified CLI scaffolding tool that wraps 14 official framework scaffolders behind one beautiful interface, with composable enhancements, team-shareable presets, and automated distribution.

**Tech debt:** 10 items documented in v1.0-MILESTONE-AUDIT.md (preset enhancement capture, diff display quality, Homebrew external infra, drift detection scope)

**Archive:** `.planning/milestones/v1.0-*`

---


## v1.1 Tech Debt (Shipped: 2026-02-19)

**Phases:** 13-16 (7 plans)
**Lines of code:** 20,859 TypeScript (+2,039 from v1.0)
**Timeline:** 3 days (2026-02-16 → 2026-02-19)
**Git range:** `feat(13-01)` → `feat(16-01)`

**Key accomplishments:**
1. Fixed enhancement conflict diff to show actual before/after content differences
2. Completed preset save/use enhancement lifecycle — save captures installed IDs, use auto-applies them
3. Wired defaultCategory config to interactive scaffold flow with preset precedence
4. Created standalone changelog enhancement module and expanded testing with example test generation
5. Expanded drift detection from 7 web to all 14 scaffolders with CI setup for Go, Flutter, Python, Rust
6. Deployed Homebrew tap (farce1/homebrew-tap) with auto-update workflow triggered by npm publish

**Delivered:** Closed all 10 tech debt items from v1.0 audit — fixed 6 code-level issues, deployed Homebrew tap infrastructure, and expanded 2 enhancement modules.

**Tech debt:** 5 items (none blockers) — documentation-based drift snapshots, HOMEBREW_TAP_TOKEN PAT pending, placeholder formula version, tap on personal account

**Archive:** `.planning/milestones/v1.1-*`

---


## v2.0 Quality & Robustness (Shipped: 2026-02-20)

**Phases:** 17-23 (13 plans)
**Lines of code:** 21,591 TypeScript (+732 from v1.1)
**Changes:** +2,641 / -38 across 31 files
**Timeline:** 1 day (2026-02-19 → 2026-02-20)
**Git range:** `feat(17-01)` → `fix(23-01)`

**Key accomplishments:**
1. Fixed all ESLint errors across 3 packages — `bun run lint` exits zero with Bun dependency caching in CI
2. Fixed release pipeline — exited pre-release mode, corrected repo slugs, removed double-build, switched to jq for Homebrew version
3. Added 139 tests across 10 previously untested modules (changelog, _utils, platform, version, shared templates, update-check, install-method, project-name, prompt flow, update command)
4. Completed npm package metadata across all 4 packages with consistent `farce1/tinkerise` URLs everywhere
5. Hardened drift detection CI — dedicated tool install steps, PEP 668 compatibility, GitHub Issue creation on drift
6. Added CODE_OF_CONDUCT.md (Contributor Covenant v2.1), cleaned .gitignore, removed dead TinkeriseConfig export

**Delivered:** Made the repo production-ready — green CI on all platforms, comprehensive test coverage for all modules, working npm+Homebrew release pipeline, proper package metadata, and clean codebase.

**Tech debt:** 1 item (CI matrix verified locally only — full 9-combination verification requires push to GitHub)

**Archive:** `.planning/milestones/v2.0-*`

---


## v3.0 Documentation & Polish (Shipped: 2026-02-22)

**Phases:** 24-29 (17 plans)
**Changes:** +5,110 / -486 across 102 files
**Timeline:** 3 days (2026-02-20 → 2026-02-22)
**Git range:** `feat(24-01)` → `docs(29-03)`

**Key accomplishments:**
1. Introduced structured CLI error handling with centralized `TinkeriseError` classes, top-level boundary handling, and typo suggestions
2. Launched `apps/docs` Starlight infrastructure with monorepo integration, branding, and production build/deploy readiness
3. Published full docs content coverage: onboarding, 14 scaffolder guides, 11 enhancement guides, generated command reference, and recipes
4. Added deterministic VHS tape workflows and generated terminal demo GIF assets for docs and README
5. Rewrote README into a conversion-focused landing page with hero proof, quickstart path, and docs-forward deep links
6. Automated docs deployment, release note categorization, and generated changelog ingestion from GitHub Releases

**Delivered:** Made v3.0 a polish-and-discovery release: complete docs site, better first-run UX and CLI ergonomics, visual demos, and release/documentation automation.

**Known gaps:** 8 of 21 requirements remained unchecked at ship time (`DOCS-01`, `DOCS-08`, `DOCS-09`, `CLI-01`, `CLI-02`, `CLI-03`, `CLI-04`, `CLI-05`).

**Archive:** `.planning/milestones/v3.0-*`

---

## v3.1 Reliability Sweep (Shipped: 2026-02-24)

**Phases:** 30-32 (9 plans)
**Changes:** +3,501 / -81 across 38 files
**Timeline:** 1 day (2026-02-23 -> 2026-02-24)
**Git range:** `feat(30-01)` -> `docs(32-03)`

**Key accomplishments:**
1. Added deterministic production docs smoke verification for route reachability, search relevance, and code-block rendering with requirement-tagged evidence output.
2. Hard-gated docs deploy flow with post-deploy smoke checks and auditable artifacts so broken production docs fail CI immediately.
3. Locked CLI runtime error UX contracts with deterministic typo suggestions, help-example coverage enforcement, and a fixture-driven conformance matrix.
4. Implemented requirement-to-evidence closure bundle generation that maps all 12 v3.1 requirements to objective docs and CLI artifacts.
5. Enforced reliability checks as blocking CI/release gates with stable job naming and uploaded reliability evidence artifacts.
6. Recorded required-check policy enforcement for `CI / Reliability Gates` with concrete branch-protection evidence and pass/fail run references.

**Delivered:** Closed all remaining v3.0 reliability gaps and turned docs/CLI reliability into auditable, enforceable release gates.

**Tech debt:** 2 non-blocking items remain in `v3.1-MILESTONE-AUDIT.md` (deploy-time runtime re-check cadence and manual merge-button behavior confirmation).

**Archive:** `.planning/milestones/v3.1-*`

---
