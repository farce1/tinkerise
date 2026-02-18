# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** One command to scaffold any project with any stack, delegating to official tools developers already trust
**Current focus:** Phase 9 in progress -- Additional Enhancements & Utility Templates

## Current Position

Phase: 9 of 10 (Additional Enhancements & Utility Templates)
Plan: 3 of 5 in current phase (09-01 through 09-03 complete)
Status: Docker, Env, Commitlint, Testing, Renovate, EditorConfig modules done + all 10 registered -- 3 of 5 plans complete
Last activity: 2026-02-18 -- Plan 09-03 complete (Renovate + EditorConfig modules, all 10 enhancements registered)

Progress: [█████████░] 93%

## Performance Metrics

**Velocity:**
- Total plans completed: 36
- Average duration: ~4 min/plan
- Total execution time: ~131 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4/4 | ~15 min | ~4 min |
| 2 | 3/3 | ~13 min | ~4 min |
| 3 | 3/3 | ~15 min | ~5 min |
| 4 | 5/5 | ~15 min | ~3 min |
| 5 | 5/5 | ~21 min | ~4 min |
| 6 | 4/4 | ~14 min | ~4 min |
| 7 | 3/3 | ~7 min | ~2 min |
| 8 | 5/5 | ~20 min | ~4 min |

**Recent Trend:**
- Last 5 plans: 08-04, 08-05, 09-01, 09-02, 09-03
- Trend: Stable

*Updated after each plan completion*
| Phase 03 P01 | 4min | 2 tasks | 10 files |
| Phase 03 P02 | 7min | 3 tasks | 12 files |
| Phase 03 P03 | 4min | 2 tasks | 7 files |
| Phase 04 P01 | 3min | 2 tasks | 7 files |
| Phase 04 P02 | 3min | 2 tasks | 9 files |
| Phase 04 P05 | 3min | 1 task | 8 files |
| Phase 04 P03 | 7min | 3 tasks | 10 files |
| Phase 04 P04 | 2min | 1 task | 2 files |
| Phase 05 P01 | 6min | 2 tasks | 9 files |
| Phase 05 P02 | 2min | 2 tasks | 3 files |
| Phase 05 P03 | 3min | 3 tasks | 3 files |
| Phase 05 P04 | 6min | 2 tasks | 6 files |
| Phase 05 P05 | 4min | 2 tasks | 6 files |
| Phase 06 P01 | 4min | 2 tasks | 5 files |
| Phase 06 P02 | 3min | 2 tasks | 4 files |
| Phase 06 P03 | 3min | 2 tasks | 7 files |
| Phase 06 P04 | 4min | 3 tasks | 6 files |
| Phase 07 P01 | 2min | 2 tasks | 6 files |
| Phase 07 P02 | 2min | 2 tasks | 5 files |
| Phase 07 P03 | 3min | 2 tasks | 3 files |
| Phase 08 P01 | 4min | 2 tasks | 11 files |
| Phase 08 P02 | 5min | 2 tasks | 8 files |
| Phase 08 P03 | 3min | 2 tasks | 6 files |
| Phase 08 P04 | 3min | 2 tasks | 3 files |
| Phase 08 P05 | 5min | 2 tasks | 5 files |
| Phase 09 P01 | 4min | 2 tasks | 6 files |
| Phase 09 P02 | 3min | 2 tasks | 5 files |
| Phase 09 P03 | 5min | 2 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Node.js baseline >= 20.11.0 (not >= 18 per original constraint; Node 18 EOL April 2025)
- Roadmap: Pure ESM output only, no CJS dual-package
- Roadmap: Three-package monorepo (cli/core/shared) per research recommendation
- Roadmap: Phase 7 depends on Phase 4, not Phase 6 -- can parallelize backend/mobile with enhancement work
- Phase 1: Bun@1.1.9 as package manager (user preference confirmed)
- Phase 1: @antfu/eslint-config for monorepo-wide ESLint flat config
- Phase 1: Commander.js for CLI framework (gh-style help text)
- Phase 1: createRequire for JSON imports (stable across all Node versions)
- [Phase 02]: Zod 4 (v4.3.6) for registry schemas -- z.record() requires (key, value) args
- [Phase 03]: createRequire for ci-info CJS import in ESM project
- [Phase 03]: Ordered tuple array for LOCKFILE_MAP to guarantee precedence iteration
- [Phase 03]: binary-missing source preserves detected PM name (does not fall through)
- [Phase 03]: Separate --ts/--typescript options with manual merge (Commander.js alias limitation)
- [Phase 03]: vi.hoisted() for mock fns in vi.mock() factories (vitest hoisting requirement)
- [Phase 03]: No spinner around executeScaffolder (upstream tool owns stdio with inherit)
- [Phase 03]: Commander Command passed as parameter for getOptionValueSource access
- [Phase 03]: ensureNonInteractive uses stderr for CI error output
- [Phase 03]: buildPreselectedOptions deduplicates --ts/--typescript aliases
- [Phase 04]: Multi-word native flags split on whitespace in resolver (Astro --add tailwindcss)
- [Phase 04]: Empty string native: '' sentinel for silent flag accept (always-TS scaffolders)
- [Phase 04]: Multi-word integration commands split in buildCommandArgs (TanStack @tanstack/cli create)
- [Phase 04]: Separated metadata map from Zod registry schema for display vs execution concerns
- [Phase 04]: Used 'in' operator for type-safe optional hint access on const tuples
- [Phase 04]: Shared nodePrerequisite() helper for DRY prerequisite definitions
- [Phase 04]: Snapshots include npm warn lines for consistency with CI capture
- [Phase 04]: permissions: contents: read on drift detection workflow for security hardening
- [Phase 04]: Early process.argv interception for per-scaffolder --help (Commander handles --help before action)
- [Phase 04]: CLI layer owns post-scaffold summary card (executor just runs tool, no summary output)
- [Phase 04]: extraArgs merged with nativeArgs in executor for framework-specific computed args
- [Phase 04]: E2E tests gated behind TINKERISE_E2E=true env var (skipped in normal CI runs)
- [Phase 04]: import.meta.dirname for ESM-compatible path resolution in test files
- [Phase 05]: Direct TypeScript interfaces over z.infer<> for enhancement types (z.function() inferred types too generic)
- [Phase 05]: Zod added as direct dependency to @tinkerise/core (was only in @tinkerise/shared)
- [Phase 05]: dependencyVersionMap as const satisfies Record<string, string> (create-t3-app pattern)
- [Phase 05]: onAmbiguousFramework as optional callback (non-interactive/CI gets null framework gracefully)
- [Phase 05]: detectPackageManager result mapped to just .pm name for ProjectContext simplicity
- [Phase 05]: Set-based O(1) lookup for cycle ID detection in topologicalSort (refactor from linear scan)
- [Phase 05]: diff v8 ships built-in TypeScript types (no @types/diff needed)
- [Phase 05]: deepmergeCustom with flat+Set dedup for primitive arrays, concatenate for object arrays
- [Phase 05]: picocolors for diff coloring (already a project dependency, zero added weight)
- [Phase 05]: Non-null assertion for strict-mode index-based array access in executor loop
- [Phase 05]: Callback-based conflict/dependency resolution (onConflict, onDependencyApproval) decouples executor from UI
- [Phase 06]: FRAMEWORK_ESLINT_MAP as static config object mapping framework IDs to packages/imports/spreads
- [Phase 06]: ESLint config filename: .js for type:module, .mjs otherwise
- [Phase 06]: Prettier: no config file when no Tailwind (pure defaults per locked decision)
- [Phase 06]: Husky: .git check before install with clear error message
- [Phase 06]: lint-staged: separate glob patterns for ESLint (code files) vs Prettier (code + data files)
- [Phase 06]: PM_CI_MAP static config for all 4 package managers (npm/pnpm/yarn/bun)
- [Phase 06]: Bun CI omits setup-node entirely, uses oven-sh/setup-bun@v2
- [Phase 06]: basename(process.argv[1]) for tk alias detection
- [Phase 06]: ExecutionSummary.results as Map<string, InstallResult> for per-module detail
- [Phase 07]: python3 command (not python) for macOS Monterey+ compatibility
- [Phase 07]: Go versionFlag 'version' not '--version' (go uses subcommand)
- [Phase 07]: Two-level prerequisites ordered runtime-first (tool install depends on runtime)
- [Phase 07]: Express uses npx (Node.js ecosystem); other backends use native CLIs
- [Phase 07]: Rust no-git flag maps to --init (cargo-generate convention)
- [Phase 07]: Flutter uses native CLI directly (not npx) -- non-Node.js ecosystem
- [Phase 07]: React Native registered as 'rn' (universally understood abbreviation)
- [Phase 07]: Only flutter prerequisite, no dart check (Flutter bundles Dart SDK)
- [Phase 07]: Flutter no-install maps to --no-pub (flutter-specific equivalent)
- [Phase 07]: React Native typescript maps to --template blank-typescript (Expo template)
- [Phase 07]: Manual string padding for doctor table alignment (no table library dependency)
- [Phase 07]: Dart informational-only check in doctor (no versionRange, bundled with Flutter)
- [Phase 07]: DOCTOR_CHECKS exported for test assertion access
- [Phase 08]: TinkeriseUserConfig as direct interface, not z.infer (per Phase 5 decision)
- [Phase 08]: Graceful null return on missing/invalid config (loadGlobalConfig never throws)
- [Phase 08]: XDG_CONFIG_HOME with bracket notation env access per codebase pattern
- [Phase 08]: Empty Zod parse result treated as null (jiti no-default-export returns module namespace)
- [Phase 08]: deepmerge-ts default array replacement for config merge (not custom mergeConfigs)
- [Phase 08]: resolveConfig defaults projectDir to process.cwd() when not specified
- [Phase 08]: Preset files stored as {name}.json in presets/ subdirectory of config dir
- [Phase 08]: loadPreset returns null on any error (same graceful pattern as loadGlobalConfig)
- [Phase 08]: import.meta.resolve for npm preset package resolution (throws on missing, caught gracefully)
- [Phase 08]: Commander .command() chaining for config subcommands (list, get, set, init)
- [Phase 08]: String-to-boolean coercion for typescript config key (CLI args are always strings)
- [Phase 08]: generateProjectConfig omits undefined keys for clean TS output
- [Phase 08]: preset save prompts for framework/category when flags not provided (interactive fallback)
- [Phase 08]: preset use applies directly without confirmation (per user decision)
- [Phase 08]: preset use falls back to npm lookup (tinkerise-preset-<name>) when local not found
- [Phase 09]: Docker detectDockerFramework() for backend detection (FastAPI/Django/Go/Rust) without extending FrameworkId type
- [Phase 09]: Zod ^3.24.0 in dependencyVersionMap for user projects (t3-env requires Zod 3.x; tinkerise uses Zod 4)
- [Phase 09]: Env module auto-detects src/ directory for env.ts placement
- [Phase 09]: VITE_FRAMEWORKS Set for O(1) static build framework lookup
- [Phase 09]: Commitlint config uses .js for type:module, .mjs otherwise (consistent with ESM pattern)
- [Phase 09]: Testing module always generates vitest.config.ts (locked: always Vitest, no Jest)
- [Phase 09]: No example test files generated (locked: config only)
- [Phase 09]: config:recommended as Renovate baseline (auto-merge patch, group minor, weekly)
- [Phase 09]: EditorConfig: 2-space indent, LF, UTF-8, Makefile tab exception, markdown trim exception
- [Phase 09]: Config-only enhancement pattern: no installPackages, empty packagesAdded, writeConfigFile only

### Pending Todos

None yet.

### Blockers/Concerns

- Research flags backend/mobile scaffolders (Phase 7) may need phase-specific research for Django, FastAPI, Flutter SDK detection
- Preset npm distribution (Phase 8) needs end-to-end validation during implementation
- Turborepo bun.lock warning: "Could not resolve workspaces" -- cosmetic, does not affect builds

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 09-03-PLAN.md
Resume file: .planning/phases/09-additional-enhancements-utility-templates/09-03-SUMMARY.md
