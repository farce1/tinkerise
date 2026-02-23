# Architecture Research

**Domain:** v3.1 Reliability Sweep integration architecture
**Researched:** 2026-02-23
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Runtime and UX Layer                           │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐      ┌──────────────────────────────────────┐  │
│  │ packages/cli        │      │ apps/docs (Astro + Starlight)       │  │
│  │ Commander entrypoint│      │ Static docs site for GitHub Pages    │  │
│  └──────────┬──────────┘      └───────────────┬──────────────────────┘  │
│             │                                  │                         │
├─────────────┴──────────────────────────────────┴─────────────────────────┤
│                        Core and Shared Contracts                         │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐      ┌──────────────────────────────────────┐  │
│  │ packages/core       │      │ packages/shared                      │  │
│  │ TinkeriseError tree │      │ Types + schemas                      │  │
│  └─────────────────────┘      └──────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                     Reliability Verification Layer (v3.1)               │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐      ┌──────────────────────────────────────┐  │
│  │ CLI integration     │      │ Docs production verification         │  │
│  │ tests (new)         │      │ script + workflow step (new)        │  │
│  └──────────┬──────────┘      └───────────────┬──────────────────────┘  │
│             │                                  │                         │
├─────────────┴──────────────────────────────────┴─────────────────────────┤
│                           Delivery and Evidence                          │
├──────────────────────────────────────────────────────────────────────────┤
│  .github/workflows/ci.yml   .github/workflows/docs-deploy.yml           │
│  .github/workflows/release.yml (already feeds docs changelog generation)│
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility for v3.1 | Typical Implementation |
|-----------|--------------------------|------------------------|
| `packages/cli/src/index.ts` + `packages/cli/src/utils/error-handler.ts` | Runtime error boundary and user-facing formatting contract | Commander parse boundary, `handleError`, `showSuggestionAfterError` |
| `packages/core/src/errors/*` | Canonical typed error surface consumed by CLI | `TinkeriseError` subclasses with code/suggestion/exitCode |
| `packages/cli/tests/integration/*` | End-to-end verification that users do not see raw stack traces | Spawn built CLI process and assert stdout/stderr + exit codes |
| `apps/docs` | Production docs output with search and code rendering | Starlight build and static HTML output under `apps/docs/dist` |
| `.github/workflows/docs-deploy.yml` | Deploy docs and publish Pages artifact | Build job + deploy job with Pages environment URL |
| Reliability probes (new script) | Verify DOCS-01/08/09 against deployed URL, not only local build | HTTP checks against `${{ steps.deployment.outputs.page_url }}` |

## Recommended Project Structure

```
packages/
├── cli/
│   ├── src/utils/error-handler.ts                 # existing runtime boundary
│   └── tests/integration/error-ux.test.ts         # NEW CLI-01..05 verification
apps/
├── docs/
│   ├── src/content/docs/reference/reliability-probe.mdx   # NEW deterministic probe page
│   └── scripts/verify-production.mjs                       # NEW docs prod checks
.github/workflows/
├── ci.yml                                        # MODIFY: run CLI reliability integration tests
├── docs-deploy.yml                               # MODIFY: post-deploy docs verification gate
└── release.yml                                   # keep as-is for v3.1 scope
```

### Structure Rationale

- **`packages/cli/tests/integration/`**: keeps verification at process boundary (real user path), not mocked internals.
- **`apps/docs/scripts/`**: colocates docs-specific reliability logic with docs build system and avoids monorepo-wide script sprawl.
- **`.github/workflows/docs-deploy.yml`**: single source of truth for docs production health; avoids a second parallel deploy workflow.

## Architectural Patterns

### Pattern 1: Production-First Verification Gate

**What:** Verify deployed GitHub Pages URL after `deploy-pages`, not only `astro build` output.
**When to use:** DOCS-01/08/09 closure and any future docs reliability requirement.
**Trade-offs:** Slower pipeline and potential transient network flake; much higher confidence than build-only checks.

**Example:**
```yaml
- name: Verify deployed docs
  run: node apps/docs/scripts/verify-production.mjs "$DOCS_URL"
  env:
    DOCS_URL: ${{ steps.deployment.outputs.page_url }}
```

### Pattern 2: Black-Box CLI Error Contract Testing

**What:** Assert behavior by executing `packages/cli/dist/index.js` via child process.
**When to use:** CLI-01..05 and regressions around Commander/core/CLI integration.
**Trade-offs:** More brittle than unit tests if text changes, but validates true user experience.

**Example:**
```typescript
const result = await execaNode(CLI_PATH, ['scafold'])
expect(result.exitCode).toBe(1)
expect(result.stderr).toContain('Did you mean')
expect(result.stderr).not.toContain('at handleError')
```

### Pattern 3: Minimal-Churn Integration

**What:** Add verification surfaces without changing package boundaries or command architecture.
**When to use:** Reliability sweeps that close verification gaps from prior milestones.
**Trade-offs:** Less architectural novelty; much lower migration risk.

## Data Flow

### Docs Verification Flow

```
Push to main (docs paths)
    ↓
docs-deploy build job
    ↓ (apps/docs/dist produced)
deploy-pages action
    ↓ (page_url emitted)
verify-production script (NEW)
    ↓
Pass/fail status + requirement closure evidence for DOCS-01/08/09
```

### CLI Reliability Flow

```
User-like command invocation (test)
    ↓
Commander parsing + suggestion handling
    ↓
core throws TinkeriseError OR Commander throws CommanderError
    ↓
packages/cli handleError formatting boundary
    ↓
integration assertions on message, suggestion, exit code, stack-trace suppression
```

### Key Data/Verification Flows Required in v3.1

1. **Docs availability:** assert homepage returns 200 from production URL and contains expected docs shell marker.
2. **Docs search:** assert `_pagefind` assets are reachable from deployed base path.
3. **Code rendering:** assert deterministic probe page includes rendered code block marker (and not raw fence markdown).
4. **CLI friendly errors:** assert no raw stack traces in non-verbose failures.
5. **CLI suggestion/help behavior:** assert unknown/mistyped commands show guidance and non-zero exit semantics.

## New vs Modified Components

| Item | New or Modified | Why it is needed |
|------|------------------|------------------|
| `packages/cli/tests/integration/error-ux.test.ts` | **New** | No current end-to-end coverage for CLI-01..05 runtime UX contract |
| `apps/docs/scripts/verify-production.mjs` | **New** | Existing workflow verifies build output, not deployed behavior |
| Probe doc page (`apps/docs/src/content/docs/reference/reliability-probe.mdx`) | **New** | Provides stable assertion target for code rendering and search indexing |
| `.github/workflows/docs-deploy.yml` | **Modified** | Add post-deploy verification step/job before considering docs requirements closed |
| `.github/workflows/ci.yml` | **Modified** | Ensure CLI reliability integration test runs on every PR/main push |
| `packages/cli/src/*` and `packages/core/src/errors/*` | **Unchanged unless tests find gaps** | Architecture already implements required boundary/classes; v3.1 goal is verification closure |

## Anti-Patterns

### Anti-Pattern 1: Closing DOCS-01/08/09 from local build evidence only

**What people do:** Mark docs requirements complete after `astro build` or local preview pass.
**Why it's wrong:** Requirements explicitly target production GitHub Pages behavior.
**Do this instead:** Verify the deployed Pages URL in workflow and treat that as closure evidence.

### Anti-Pattern 2: Rewriting CLI error architecture during reliability sweep

**What people do:** Refactor error classes/command routing while trying to verify UX.
**Why it's wrong:** Adds churn and new risk in a milestone meant to close verification gaps.
**Do this instead:** Keep architecture stable; add black-box tests first; patch only proven failures.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages | `docs-deploy.yml` deploy job emits `page_url`; verification script consumes URL | Core touchpoint for DOCS-01/08/09 closure |
| GitHub Actions | CI and docs workflows as enforcement gates | Reliability must be encoded as failing checks, not manual expectation |
| GitHub Releases API | Existing changelog generation in docs build (`apps/docs/scripts/generate-changelog.mjs`) | Leave unchanged; not a v3.1 target unless it blocks docs build |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `packages/core` -> `packages/cli` | Typed errors thrown, formatted at CLI boundary | Keep "core throws, CLI formats" intact |
| `apps/docs` -> workflow | Static build artifact (`apps/docs/dist`) and deployed URL checks | Add verify step, avoid second docs pipeline |
| `packages/cli/tests` -> built CLI artifact | Child-process execution of `dist/index.js` | Requires `build` before integration tests |

## Recommended Build Order (Dependency-Aware)

1. **Define verification contract fixtures (NEW):** add docs reliability probe page and CLI error UX test scenarios.
2. **Implement verification executors (NEW):** add `apps/docs/scripts/verify-production.mjs` and new CLI integration test file.
3. **Wire CI for CLI verification (MODIFY):** update `.github/workflows/ci.yml` so CLI reliability checks run on PRs first.
4. **Wire post-deploy docs verification (MODIFY):** update `.github/workflows/docs-deploy.yml` to assert production URL behavior.
5. **Run full verification sequence:** PR CI (CLI) -> merge -> docs deploy -> production checks.
6. **Close requirements with evidence:** mark DOCS-01/08/09 and CLI-01..05 complete only after workflow evidence is green.

**Ordering rationale:** steps 1-2 create stable assertions, step 3 prevents regressions before merge, step 4 validates production-specific behavior after deployment, step 6 closes requirements with the highest-confidence evidence.

## Sources

- `.planning/PROJECT.md` (active v3.1 scope and pending requirements)
- `.planning/milestones/v3.0-REQUIREMENTS.md` (DOCS-01/08/09 and CLI-01..05 definitions)
- `.planning/ROADMAP.md` and `.planning/milestones/v3.0-ROADMAP.md` (phase history and dependency context)
- `packages/cli/src/index.ts` (Commander setup, parse boundary, suggestion/help behavior)
- `packages/cli/src/utils/error-handler.ts` (central runtime error formatting)
- `packages/core/src/errors/base.ts` and `packages/core/src/errors/index.ts` (structured error hierarchy)
- `apps/docs/astro.config.mjs` and `apps/docs/package.json` (Starlight setup and build scripts)
- `.github/workflows/docs-deploy.yml`, `.github/workflows/ci.yml`, `.github/workflows/release.yml` (current workflow integration points)

---
*Architecture research for: v3.1 Reliability Sweep*
*Researched: 2026-02-23*
