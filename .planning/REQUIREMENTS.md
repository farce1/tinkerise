# Requirements: tinkerise

**Defined:** 2026-02-19
**Core Value:** One command to scaffold any project with any stack, delegating to official tools developers already trust

## v2.0 Requirements

Requirements for the Quality & Robustness milestone. Each maps to roadmap phases.

### CI & Lint

- [ ] **CILINT-01**: All 22 ESLint errors in @tinkerise/shared are fixed (sort-imports, lowercase-describe, dot-notation)
- [ ] **CILINT-02**: `bun run lint` passes across all 3 packages with zero errors
- [ ] **CILINT-03**: CI workflow runs green on all matrix combinations (Node 20/22/24, ubuntu/macos/windows)
- [ ] **CILINT-04**: Bun dependency caching enabled in CI and Release workflows via `oven-sh/setup-bun` cache parameter

### Release Pipeline

- [ ] **RELPIPE-01**: NPM_TOKEN setup documented with step-by-step instructions for creating and configuring npm automation token
- [ ] **RELPIPE-02**: Pre-release mode exited — `.changeset/pre.json` removed so publish creates stable versions
- [ ] **RELPIPE-03**: `ci:publish` script no longer double-builds (redundant `bun run build` step removed from release workflow or script)
- [ ] **RELPIPE-04**: `ci:version` script uses `bun install` instead of `bun update` to avoid unexpected dependency upgrades
- [ ] **RELPIPE-05**: Homebrew version-reading step uses `jq` instead of `require()` to avoid ESM/CJS mismatch
- [ ] **RELPIPE-06**: Changeset config repo slug corrected from `tinkerise/tinkerise` to `farce1/tinkerise`
- [ ] **RELPIPE-07**: HOMEBREW_TAP_TOKEN setup documented alongside NPM_TOKEN instructions

### Test Coverage

- [ ] **TEST-01**: `core/enhancements/modules/changelog.ts` has detect/install tests matching pattern of other 10 enhancement modules
- [ ] **TEST-02**: `core/enhancements/modules/_utils.ts` has tests for installPackages, writeConfigFile, addScript, readPackageJson
- [ ] **TEST-03**: `cli/utils/update-check.ts` has tests for cache read/write, HTTP fetch mock, semver comparison, printUpdateNudge
- [ ] **TEST-04**: `cli/utils/install-method.ts` has tests for all 3 detection branches (Homebrew, npx, npm global)
- [ ] **TEST-05**: `cli/prompts/project-name.ts` has tests for validateProjectName regex rules
- [ ] **TEST-06**: `cli/prompts/flow.ts` has tests for runPromptFlow orchestration, pre-fill skip logic, cancellation
- [ ] **TEST-07**: `core/prerequisites/platform.ts` has tests for detectPlatform and getInstallInstructions
- [ ] **TEST-08**: `core/executor/version.ts` has tests for detectUpstreamVersion including early-return path
- [ ] **TEST-09**: `cli/commands/update.ts` has tests for all install-method branches (brew, npm, npx, unknown)
- [ ] **TEST-10**: `core/templates/shared.ts` has tests for writeProjectFile, runInstall, printTemplateSummary

### Polish & Metadata

- [ ] **POLISH-01**: All 4 package.json files have complete metadata (description, keywords, repository, homepage, bugs, license, engines)
- [ ] **POLISH-02**: Repository URLs consistent across all files — `farce1/tinkerise` everywhere (package.json, postinstall.mjs, CONTRIBUTING.md, changeset config)
- [ ] **POLISH-03**: CODE_OF_CONDUCT.md created (Contributor Covenant or similar)
- [ ] **POLISH-04**: `tsup.config.bundled_*.mjs` pattern added to .gitignore, stale file removed
- [ ] **POLISH-05**: Dead `TinkeriseConfig` export removed from shared/src/index.ts
- [ ] **POLISH-06**: CONTRIBUTING.md clone URL updated from `your-org/tinkerise` placeholder to `farce1/tinkerise`

### Drift Detection Hardening

- [ ] **DRIFT-01**: `cargo-generate` install split into dedicated step with proper failure handling (not swallowed by `|| true`)
- [ ] **DRIFT-02**: `pip install` commands use `--break-system-packages` flag for PEP 668 compatibility on modern ubuntu runners
- [ ] **DRIFT-03**: Drift detection creates GitHub Issue when drift is detected (not just annotation + artifact)

## Future Requirements

Deferred beyond v2.0.

### Distribution

- **DIST-01**: Migrate Homebrew tap from personal account (farce1) to tinkerise org
- **DIST-02**: Cross-platform binary distribution (Node.js SEA / Bun compile)

### Features

- **FEAT-01**: Documentation site
- **FEAT-02**: VS Code extension
- **FEAT-03**: Monorepo-aware scaffolding

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI-assisted project initialization | Not a quality/robustness concern |
| Plugin API for community scaffolders | No community demand yet |
| Enterprise features | Post-v2.0 |
| Telemetry | Post-v2.0 |
| New scaffolders or enhancements | v2.0 is about hardening, not new features |
| E2E test expansion | Existing E2E tests are gated and working; focus on unit gaps |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CILINT-01 | Phase 17 | Pending |
| CILINT-02 | Phase 17 | Pending |
| CILINT-03 | Phase 17 | Pending |
| CILINT-04 | Phase 17 | Pending |
| RELPIPE-01 | Phase 18 | Pending |
| RELPIPE-02 | Phase 18 | Pending |
| RELPIPE-03 | Phase 18 | Pending |
| RELPIPE-04 | Phase 18 | Pending |
| RELPIPE-05 | Phase 18 | Pending |
| RELPIPE-06 | Phase 18 | Pending |
| RELPIPE-07 | Phase 18 | Pending |
| TEST-01 | Phase 19 | Pending |
| TEST-02 | Phase 19 | Pending |
| TEST-07 | Phase 19 | Pending |
| TEST-08 | Phase 19 | Pending |
| TEST-10 | Phase 19 | Pending |
| TEST-03 | Phase 20 | Pending |
| TEST-04 | Phase 20 | Pending |
| TEST-05 | Phase 20 | Pending |
| TEST-06 | Phase 20 | Pending |
| TEST-09 | Phase 20 | Pending |
| POLISH-01 | Phase 21 | Pending |
| POLISH-02 | Phase 21 | Pending |
| POLISH-03 | Phase 21 | Pending |
| POLISH-04 | Phase 21 | Pending |
| POLISH-05 | Phase 21 | Pending |
| POLISH-06 | Phase 21 | Pending |
| DRIFT-01 | Phase 22 | Pending |
| DRIFT-02 | Phase 22 | Pending |
| DRIFT-03 | Phase 22 | Pending |

**Coverage:**
- v2.0 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation*
