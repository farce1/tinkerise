# Stack Research

**Domain:** Milestone v3.1 reliability verification (docs production checks + CLI runtime error UX)
**Researched:** 2026-02-23
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@playwright/test` | `1.58.2` | Browser-level verification of deployed GitHub Pages docs (`DOCS-01`, `DOCS-08`, `DOCS-09`) | Production verification needs real browser behavior (search modal, Pagefind JS loading, rendered code blocks), not only static HTML checks. Playwright is the lowest-friction, CI-friendly option for that. |
| `vitest` + `execa` (existing) | `4.0.18` + `9.6.1` | End-to-end CLI runtime error UX checks (`CLI-01`..`CLI-05`) against built CLI binary | The repo already runs this stack well. It is sufficient for exit code, stderr/stdout, suggestion text, help hints, and top-level error boundary behavior without adding another test runner. |
| Astro + Starlight docs app | `astro ^5.17.3` + `@astrojs/starlight ^0.37.6` | Keep docs runtime current while verifying production behavior | Starlight `0.37.6` is current. Astro in repo is behind (`^5.5.0`) and can be safely updated within the same major for bugfix/stability improvements before locking verification baselines. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `actions/configure-pages` | `v5` | GitHub Pages metadata + deployment setup | Keep in docs deploy workflow (already present). |
| `actions/upload-pages-artifact` | `v4` | Upload built docs artifact for Pages deployment | Keep in docs deploy workflow (already present). |
| `actions/deploy-pages` | `v4` | Deploy docs artifact to GitHub Pages | Keep in docs deploy workflow (already present), then run post-deploy smoke verification job. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| GitHub Actions job: `docs-smoke-prod` (new) | Verify deployed docs URL, search interaction, and expressive code rendering in production | Add as a `needs: deploy` job in `.github/workflows/docs-deploy.yml`; consume deploy URL output and run Playwright Chromium smoke checks with retry/backoff. |
| GitHub Actions job: `cli-runtime-ux` (new) | Validate CLI runtime error UX end-to-end in CI | Add focused integration tests in `packages/cli/tests/integration/` and run in CI (single Ubuntu/Node lane is enough, no matrix expansion needed). |

## Installation

```bash
# Root dev dependency for production docs smoke tests
bun add -d @playwright/test@1.58.2

# Keep docs stack current (minimal churn, same major lines)
bun add --cwd apps/docs astro@^5.17.3 @astrojs/starlight@^0.37.6

# CI bootstrap for Playwright job
bunx playwright install --with-deps chromium
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Playwright smoke tests on deployed Pages | `curl`-only checks | Only if you want ultra-minimal checks for availability/assets; not enough for true search UX validation. |
| Vitest + execa for CLI runtime UX | Add a second CLI testing framework | Only if current stack cannot express required assertions (it can). |
| Targeted Astro minor update within v5 | Freeze at `astro ^5.5.0` | Only if milestone timeline cannot tolerate lockfile refresh; reliability confidence is lower on older patch line. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Cypress for this milestone | Introduces parallel E2E stack churn for simple smoke needs; duplicates Playwright capability | `@playwright/test` Chromium smoke suite |
| Visual diff tooling (Percy/Chromatic/Applitools) | Not required to close DOCS-01/08/09; adds SaaS and maintenance overhead | Deterministic functional smoke assertions |
| New CLI error libraries | `TinkeriseError` hierarchy + `handleError()` already exist and are testable | Add integration coverage with existing Vitest stack |
| Bun/Turbo/Commander major migrations in v3.1 | Out of scope for verification-only milestone; high churn, low closure value | Keep existing toolchain and add targeted tests/workflow jobs |

## Stack Patterns by Variant

**If verifying pull requests before merge:**
- Run docs smoke against local build output + `astro preview` URL
- Because Pages URL is unavailable pre-merge

**If verifying post-deploy production closure (required for this milestone):**
- Run Playwright smoke against `actions/deploy-pages` output URL
- Because DOCS-01/08/09 are explicitly production-verification gaps

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@astrojs/starlight@0.37.6` | `astro ^5.5.0` (peer), validated with `astro ^5.17.3` | Current Starlight release line; no Starlight upgrade needed now. |
| `@playwright/test@1.58.2` | Node `>=18` | Repo Node floor `>=20.11.0` already satisfies this. |
| `vitest@4.0.18` | Node `^20 || ^22 || >=24` | Matches current CI matrix and existing setup. |

## Sources

- https://starlight.astro.build/guides/site-search/ - default Pagefind behavior and deployment requirement (HIGH)
- https://starlight.astro.build/reference/configuration/ - `expressiveCode` and `pagefind` config behavior (HIGH)
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages - required Pages workflow actions/pattern (HIGH)
- https://playwright.dev/docs/intro - Playwright capabilities and system requirements (HIGH)
- https://playwright.dev/docs/ci-intro - CI workflow pattern for Playwright on GitHub Actions (HIGH)
- https://raw.githubusercontent.com/tj/commander.js/master/Readme.md - Commander error suggestion/help behavior (`showSuggestionAfterError`, `showHelpAfterError`) (HIGH)
- https://registry.npmjs.org/@playwright/test/latest - latest stable version `1.58.2` (HIGH)
- https://registry.npmjs.org/vitest/latest - latest stable version `4.0.18` (HIGH)
- https://registry.npmjs.org/@astrojs/starlight/latest - latest stable version `0.37.6` (HIGH)
- https://registry.npmjs.org/astro/latest - latest stable version `5.17.3` (HIGH)
- https://api.github.com/repos/oven-sh/bun/releases/latest - current Bun release `1.3.9` (MEDIUM, not recommended to adopt in this milestone)
- `package.json`, `apps/docs/package.json`, `.github/workflows/docs-deploy.yml`, `.github/workflows/ci.yml`, `packages/cli/src/index.ts`, `packages/cli/src/utils/error-handler.ts` - current repo integration baseline (HIGH)

---
*Stack research for: v3.1 Reliability Sweep verification closure*
*Researched: 2026-02-23*
