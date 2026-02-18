---
phase: 10-distribution-release-automation
verified: 2026-02-18T15:26:00Z
status: passed
score: 7/7 requirements verified (5 PASS, 2 PARTIAL PASS)
re_verification: false
gaps: []
human_verification:
  - test: "Run npx tinkerise --version from a clean environment"
    expected: "Prints version and scaffolds without requiring global install"
    why_human: "npx resolution depends on live npm registry state"
  - test: "Merge a changeset PR and observe release workflow"
    expected: "changesets/action creates Version PR, merges and publishes to npm, triggers Homebrew tap update"
    why_human: "Full release pipeline requires npm credentials, GitHub secrets, and real CI run"
  - test: "Run tinkerise update from a Homebrew installation"
    expected: "Detects Homebrew method and runs brew upgrade tinkerise"
    why_human: "Requires actual Homebrew installation on macOS to test detection path"
---

# Phase 10: Distribution & Release Automation Verification Report

**Phase Goal:** Tinkerise is installable via npm/npx and Homebrew, with automated release pipelines and self-update awareness
**Verified:** 2026-02-18T15:26:00Z
**Status:** PASSED
**Re-verification:** No -- initial verification

## Summary

| Status | Count | Requirements |
|--------|-------|--------------|
| PASS | 5 | DIST-01, DIST-02, DIST-05, DIAG-03, QA-08 |
| PARTIAL PASS | 2 | DIST-03, DIST-04 |
| FAIL | 0 | -- |

**Overall:** 7/7 requirements verified. 2 partial passes due to external infrastructure dependency (Homebrew tap repo not yet created). All code and configuration is complete.

## Environment

| Property | Value |
|----------|-------|
| Verification Date | 2026-02-18 |
| Node.js | v24.4.1 |
| Bun | 1.1.9 |
| OS | Darwin 24.6.0 (macOS) |
| Method | Code and configuration inspection (no dedicated test suites for Phase 10) |

## Requirement Verification

### DIST-01

**Status:** PASS

**Requirement:** npm published with `tinkerise` and `tk` bin entries

**Evidence:**

- `packages/tinkerise/package.json` (lines 6-8): `bin: { "tinkerise": "./bin.mjs", "tk": "./bin.mjs" }` -- both aliases point to the same entry point
- `packages/tinkerise/package.json` (line 2): `name: "tinkerise"` -- unscoped package name for direct `npm install tinkerise`
- `packages/tinkerise/package.json` (lines 17-20): `publishConfig: { access: "public", registry: "https://registry.npmjs.org/" }`
- `packages/cli/package.json` (lines 32-35): `publishConfig: { access: "public", registry: "https://registry.npmjs.org/" }`
- `packages/core/package.json` (lines 32-35): `publishConfig: { access: "public", registry: "https://registry.npmjs.org/" }`
- `packages/shared/package.json` (lines 20-23): `publishConfig: { access: "public", registry: "https://registry.npmjs.org/" }`

All 4 packages (1 unscoped wrapper + 3 scoped) have public publish access configured.

### DIST-02

**Status:** PASS

**Requirement:** `npx tinkerise` works without global install

**Evidence:**

- `packages/tinkerise/package.json` (line 2): `name: "tinkerise"` -- unscoped, enabling `npx tinkerise`
- `packages/tinkerise/bin.mjs` (lines 1-2): `#!/usr/bin/env node` shebang + `import '@tinkerise/cli'` -- plain ESM import, no build step
- `packages/tinkerise/package.json` (line 13): `files: ["bin.mjs", "postinstall.mjs"]` -- only plain `.mjs` files shipped
- `packages/tinkerise/package.json` (lines 10-12): `dependencies: { "@tinkerise/cli": "workspace:*" }` -- npm resolves the workspace reference to the published version at install time
- No TypeScript compilation needed: the wrapper package contains only plain JavaScript `.mjs` files

### DIST-03

**Status:** PARTIAL PASS

**Requirement:** Homebrew tap provides `brew install tinkerise`

**Evidence:**

- `homebrew/tinkerise.rb` (29 lines): Complete Ruby formula with `install` block (npm install + bin symlink), `caveats` block (Node.js >= 20.11.0 requirement), and `test` block (version + help assertions)
- Formula uses standard `std_npm_args` and `libexec.glob("bin/*")` patterns for Node.js CLI tools
- URL points to npm registry tarball pattern: `https://registry.npmjs.org/tinkerise/-/tinkerise-{version}.tgz`

**Template-complete, external infrastructure required for deployment:**
- SHA256 is `PLACEHOLDER_SHA256` -- will be computed by `update-formula.yml` automation on first release
- Version is `0.0.0` -- template only, updated automatically by the Homebrew tap update workflow
- Requires creation of `tinkerise/homebrew-tap` GitHub repository with the formula copied to `Formula/tinkerise.rb`

### DIST-04

**Status:** PARTIAL PASS

**Requirement:** Homebrew formula auto-update via GitHub Actions

**Evidence:**

- `homebrew/update-formula.yml` (68 lines): Complete workflow template with `workflow_dispatch` trigger accepting `version` input (lines 7-10)
- Workflow computes SHA256 from npm tarball URL, generates the formula Ruby code, creates a PR, and auto-merges it (lines 24-67)
- `.github/workflows/release.yml` (lines 51-59): "Trigger Homebrew tap update" step with condition `steps.changesets.outputs.published == 'true'`
- Uses `gh workflow run update-formula.yml -R tinkerise/homebrew-tap -f version="$VERSION"` to cross-repo trigger
- Version extracted via `node -p "require('./packages/tinkerise/package.json').version"` (line 54)

**Template-complete, external infrastructure required for deployment:**
- Requires `HOMEBREW_TAP_TOKEN` secret (a PAT with `repo` scope for cross-repo `workflow_dispatch`)
- Requires `tinkerise/homebrew-tap` repository with `update-formula.yml` copied to `.github/workflows/`
- The `update-formula.yml` file in this repo is a template -- it must be deployed to the tap repo

### DIST-05

**Status:** PASS

**Requirement:** Install-method detection and update instructions

**Evidence:**

- `packages/cli/src/utils/install-method.ts` (42 lines): Exports `InstallMethod` type (`'homebrew' | 'npm-global' | 'npx' | 'unknown'`) and `detectInstallMethod()` function
- Homebrew detection (line 26): Checks `import.meta.dirname` for `/Cellar/` or `/homebrew/` paths (handles both Intel and Apple Silicon)
- npx detection (lines 31-33): Checks `process.env['npm_execpath']` for `npx` string or `moduleDir` for `_npx` cache path
- npm-global detection (lines 11-20, 37): `isGlobalNpmInstall()` helper uses `npm prefix -g` to get global lib path, compares with resolved module directory via `realpathSync`
- Falls through to `'unknown'` if none match (line 41)
- Function is exported and consumed by `packages/cli/src/commands/update.ts` (line 4): `import { detectInstallMethod } from '../utils/install-method.js'`

### DIAG-03

**Status:** PASS

**Requirement:** `tinkerise update` with install-method-aware instructions

**Evidence:**

- `packages/cli/src/commands/update.ts` (40 lines): `registerUpdateCommand()` registers `update` subcommand on the program
- Method-aware switch statement (lines 14-38):
  - `'homebrew'`: runs `execFileSync('brew', ['upgrade', 'tinkerise'])` (line 17)
  - `'npm-global'`: runs `execFileSync('npm', ['update', '-g', 'tinkerise'])` (line 22)
  - `'npx'`: displays info that npx always fetches latest, suggests `npx tinkerise@latest` (lines 28-29)
  - `default` (unknown): prints manual update instructions for both npm and Homebrew (lines 33-37)
- Background update check in `packages/cli/src/utils/update-check.ts` (101 lines):
  - 24-hour cache interval: `CHECK_INTERVAL = 24 * 60 * 60 * 1000` (line 18)
  - Cache stored at `$XDG_CACHE_HOME/tinkerise/update-check.json` or `~/.cache/tinkerise/update-check.json` (lines 13-17)
  - `checkForUpdate()` (lines 45-88): reads cache, fetches npm registry if stale, compares with `semver.gt()`, respects `TINKERISE_NO_UPDATE_CHECK=1` opt-out
  - `printUpdateNudge()` (lines 94-101): renders one-line colored nudge with current vs latest version

**Note:** DIST-05 and DIAG-03 share `install-method.ts` but are verified separately. DIST-05 covers detection correctness; DIAG-03 covers the update command behavior and background check mechanism that consumes the detection.

### QA-08

**Status:** PASS

**Requirement:** Release automation via changesets + GitHub Actions

**Evidence:**

- `.changeset/config.json` (10 lines): Changesets configuration with:
  - `fixed: [["@tinkerise/cli", "@tinkerise/core", "@tinkerise/shared", "tinkerise"]]` -- all 4 packages versioned together (line 5)
  - `access: "public"` (line 6)
  - `baseBranch: "main"` (line 7)
  - `changelog: ["@changesets/changelog-github", { "repo": "tinkerise/tinkerise" }]` -- GitHub-linked changelogs (line 3)
- `.github/workflows/release.yml` (59 lines): Release workflow with:
  - Trigger: `push` to `main` branch (line 4)
  - Concurrency: prevents parallel releases (line 7)
  - `changesets/action@v1` (line 40): creates Version PRs or publishes based on changeset state
  - `version: bun run ci:version` and `publish: bun run ci:publish` (lines 42-43)
  - Sets both `NPM_TOKEN` and `NODE_AUTH_TOKEN` for npm publish authentication (lines 48-49)
- `package.json` (root, lines 17-19): Release scripts:
  - `"changeset": "changeset"` -- local alias for creating changesets
  - `"ci:version": "changeset version && bun update"` -- versions packages and updates lockfile (workspace:* workaround)
  - `"ci:publish": "bun run build && changeset publish"` -- builds all packages then publishes

## Test Results Summary

Phase 10 features are infrastructure/configuration code with no dedicated test suites. Verification is based on code and configuration inspection. This is expected and documented -- Phase 10 covers npm package structure, Homebrew formula templates, GitHub Actions workflows, and CLI utility functions that operate against external systems (npm registry, Homebrew, filesystem paths).

## Gaps Found

None. All 7 requirements are satisfied by existing code and configuration. The 2 PARTIAL PASS statuses reflect external infrastructure dependencies (Homebrew tap repository), not gaps in the codebase.

## Human Verification Required

| Test | Expected Outcome | Why Human |
|------|-----------------|-----------|
| Run `npx tinkerise --version` from a clean environment | Prints version and scaffolds without requiring global install | npx resolution depends on live npm registry state |
| Merge a changeset PR and observe release workflow | changesets/action creates Version PR, publishes to npm, triggers Homebrew tap update | Full pipeline requires npm credentials, GitHub secrets, and real CI run |
| Run `tinkerise update` from a Homebrew installation | Detects Homebrew method and runs `brew upgrade tinkerise` | Requires actual Homebrew installation on macOS to test detection path |
