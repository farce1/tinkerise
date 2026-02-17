# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** One command to scaffold any project with any stack, delegating to official tools developers already trust
**Current focus:** Phase 4: Web Framework Scaffolders

## Current Position

Phase: 4 of 10 (Web Framework Scaffolders)
Plan: 5 of 5 in current phase
Status: Phase 04 complete -- all 5 plans executed
Last activity: 2026-02-17 -- Plan 04-04 complete (E2E scaffold tests for all 7 web frameworks)

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: ~4 min/plan
- Total execution time: ~67 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4/4 | ~15 min | ~4 min |
| 2 | 3/3 | ~13 min | ~4 min |
| 3 | 3/3 | ~15 min | ~5 min |
| 4 | 5/5 | ~15 min | ~3 min |

**Recent Trend:**
- Last 5 plans: 04-01, 04-02, 04-05, 04-03, 04-04
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

### Pending Todos

None yet.

### Blockers/Concerns

- Research flags backend/mobile scaffolders (Phase 7) may need phase-specific research for Django, FastAPI, Flutter SDK detection
- Preset npm distribution (Phase 8) needs end-to-end validation during implementation
- Turborepo bun.lock warning: "Could not resolve workspaces" -- cosmetic, does not affect builds

## Session Continuity

Last session: 2026-02-17
Stopped at: Completed 04-04-PLAN.md (E2E scaffold tests for all 7 web frameworks)
Resume file: .planning/phases/04-web-framework-scaffolders/04-04-SUMMARY.md
