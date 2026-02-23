# Project Research Summary

**Project:** tinkerise
**Domain:** Milestone v3.1 reliability verification (production docs checks + CLI runtime error UX)
**Researched:** 2026-02-23
**Confidence:** HIGH

## Executive Summary

This milestone is a reliability closeout, not a feature expansion. The product is already built; the gap is verification quality for pending v3.0 requirements (`DOCS-01/08/09`, `CLI-01..CLI-05`). Expert approach in this domain is to validate behavior at user boundaries: production URL checks for docs and black-box process execution for CLI. Build-only checks and unit-only assertions are not sufficient for requirement closure.

The recommended implementation is intentionally minimal-churn: keep current architecture, add targeted verification surfaces, and enforce them in CI. For docs, deploy to GitHub Pages as usual, then run post-deploy smoke checks against the emitted `page_url` with Playwright/scripted assertions for availability, search query results, and code rendering markers. For CLI, keep the existing `TinkeriseError` + `handleError` contract and add integration tests that assert message shape, suggestion/help behavior, stream usage, and exit codes from the built binary.

Primary risks are false confidence and silent gaps: local-only docs verification, GitHub Pages base path drift (`/tinkerise`), search UI checks without query validation, and CLI message improvements that regress exit-code semantics. Mitigation is explicit contract fixtures, deterministic assertion targets, retry-bounded production checks, and regression gates in CI/docs-deploy workflows so failures block closure instead of being discovered manually.

## Key Findings

### Recommended Stack

Research converges on using the existing toolchain plus one focused addition for production browser checks. This keeps scope aligned with a verification milestone while materially increasing confidence.

**Core technologies:**
- `@playwright/test@1.58.2`: Browser-level production smoke validation for deployed docs UX (`DOCS-01/08/09`) - needed to validate search/code rendering behavior that static checks miss.
- `vitest@4.0.18` + `execa@9.6.1`: Black-box CLI runtime UX verification (`CLI-01..CLI-05`) - already proven in repo and sufficient for exit/message/suggestion assertions.
- `astro@^5.17.3` + `@astrojs/starlight@^0.37.6`: Stable docs runtime baseline for verification - same major line, reduced risk versus staying on older Astro patch.
- GitHub Pages actions (`configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`): Existing deployment backbone - extend with a post-deploy verification gate instead of replacing pipeline.

### Expected Features

The must-have scope is strict requirement closure evidence for pending docs and CLI reliability items. Differentiators are lightweight artifacts that make closure auditable and regression-resistant without expanding product surface.

**Must have (table stakes):**
- Production docs availability, production search queryability, and production code rendering validation (`DOCS-01/08/09`).
- Friendly actionable CLI failures, typo suggestions, help examples, structured error hierarchy behavior, and top-level boundary handling (`CLI-01..CLI-05`).
- Evidence-backed closure artifacts (logs/transcripts/screenshots or automated output) tied to each requirement.

**Should have (competitive):**
- Requirements-to-checklist closure matrix for objective sign-off.
- Error scenario conformance matrix across representative failure modes.
- Contract-focused snapshots for stable error UX fields (exit code/headline/hint presence).
- Automated post-deploy docs smoke script integrated into workflow.

**Defer (v2+):**
- Advanced docs search tuning (ranking/filters/analytics).
- New machine-readable CLI error mode (`--json`) unless separately scoped.
- Any docs IA/content rewrite unrelated to pending reliability requirements.

### Architecture Approach

The architecture recommendation is verification-layer augmentation, not core refactor. Keep `packages/core` error contracts and `packages/cli` formatting boundary intact, then add process-boundary tests and production docs probes as enforcement gates.

**Major components:**
1. `packages/cli/src/index.ts` + `packages/cli/src/utils/error-handler.ts` - preserve runtime boundary and ensure consistent user-facing behavior.
2. `packages/core/src/errors/*` - remain canonical typed error source for predictable mapping and exit semantics.
3. `packages/cli/tests/integration/error-ux.test.ts` (new) - assert real CLI behavior via built binary execution.
4. `apps/docs/scripts/verify-production.mjs` (new) - validate deployed Pages URL for availability/search/code rendering.
5. `.github/workflows/ci.yml` + `.github/workflows/docs-deploy.yml` (modified) - make reliability checks required gates.

### Critical Pitfalls

1. **Local/build-only docs verification** - prevent by asserting deployed `page_url` post-deploy with retry-bounded smoke checks.
2. **GitHub Pages base-path drift (`/tinkerise`)** - prevent by explicitly validating asset/search paths under deployed subpath.
3. **Search "enabled" but not queryable** - prevent by requiring known-term query results, not just search UI presence.
4. **CLI UX polish with broken exit codes** - prevent via subprocess contract tests on message + stream + exit semantics.
5. **Path-filter blind spots skipping verification** - prevent with trigger matrix and nightly unfiltered docs verification run.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Reliability Contract Definition
**Rationale:** Locks acceptance criteria before implementation so checks target real requirement semantics.
**Delivers:** Requirement-to-checklist matrix, deterministic docs probe targets, CLI error contract matrix (cases + expected exits/messages).
**Addresses:** Evidence quality for `DOCS-01/08/09` and `CLI-01..CLI-05`.
**Avoids:** Base-path drift misses, brownfield output-compat regressions, and ambiguous closure.

### Phase 2: Docs Production Verification Gate
**Rationale:** Docs requirements are explicitly production-scoped and must be proven after deploy.
**Delivers:** `apps/docs/scripts/verify-production.mjs`, probe page, post-deploy verification job with retry/backoff.
**Uses:** GitHub Pages workflow actions + Playwright/script checks.
**Implements:** Production-first verification pattern for docs URL/search/code rendering.

### Phase 3: CLI Runtime Error UX Verification
**Rationale:** CLI requirements depend on stable error contracts and must be tested at process boundary.
**Delivers:** `packages/cli/tests/integration/error-ux.test.ts` and CI gating of CLI reliability scenarios.
**Addresses:** `CLI-01..CLI-05` including typo suggestion/help behavior and top-level boundary outcomes.
**Avoids:** Exit-code regressions and over-caught unknown-error masking.

### Phase 4: Regression Hardening and Continuous Enforcement
**Rationale:** Reliability closure is incomplete unless checks keep running and prevent backslide.
**Delivers:** Required workflow gates, scheduled docs verification safety net, compatibility snapshots/conformance matrix expansion.
**Addresses:** Ongoing prevention for docs and CLI regressions beyond initial closeout.
**Avoids:** Path-filter blind spots and incremental brownfield drift.

### Phase Ordering Rationale

- Define contracts first so later automation validates the right behavior and not superficial signals.
- Run docs and CLI implementation streams in parallel after Phase 1 since their technical surfaces are mostly independent.
- Finish with enforcement hardening so reliability remains a gate, not a one-time verification event.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Production Pages propagation behavior, retry/backoff tuning, and robust search query assertions may need targeted implementation research.
- **Phase 4:** Workflow trigger matrix + scheduled verification strategy needs careful calibration to balance coverage and CI cost.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Contract definition/checklist authoring is straightforward with current requirement docs.
- **Phase 3:** Existing Vitest + execa process testing pattern is established in repo and well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs + npm release data + direct repo baseline alignment across tooling choices. |
| Features | HIGH | Requirements are explicit and scoped; dependencies and DoD criteria are clearly mapped. |
| Architecture | HIGH | Recommendations extend existing boundaries/workflows with minimal churn and clear ownership. |
| Pitfalls | HIGH | Risks are concrete, repeatedly observed in Pages/CLI ecosystems, and paired with actionable prevention. |

**Overall confidence:** HIGH

### Gaps to Address

- **Pages propagation variance:** Final retry window/backoff values should be calibrated from real CI runs to avoid flaky false negatives.
- **Search assertion stability:** Choose resilient known terms/slugs and negative controls that remain valid as docs content evolves.
- **CLI output compatibility surface:** Confirm which message/stream shapes are contract-critical for existing scripts before locking snapshots.
- **Nightly verification scope:** Define minimum unfiltered docs checks that catch path-filter misses without excessive runtime/cost.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` - stack recommendations, versions, and CI integration strategy.
- `.planning/research/FEATURES.md` - requirement mapping, dependencies, prioritization, and acceptance outcomes.
- `.planning/research/ARCHITECTURE.md` - component boundaries, patterns, and dependency-aware build order.
- `.planning/research/PITFALLS.md` - critical failure modes, prevention tactics, and phase mapping.
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages - Pages workflow requirements and deploy model.
- https://docs.astro.build/en/guides/deploy/github/ - Astro + GitHub Pages `site`/`base` deployment requirements.
- https://starlight.astro.build/guides/site-search/ and https://starlight.astro.build/reference/configuration/ - search and Expressive Code behavior/config.
- https://playwright.dev/docs/intro and https://playwright.dev/docs/ci-intro - browser automation and CI patterns.
- https://nodejs.org/api/process.html - runtime exception/rejection handling semantics.

### Secondary (MEDIUM confidence)
- https://github.com/tj/commander.js - suggestion/help/error behavior guidance and integration details.
- https://pagefind.app/docs/ and https://pagefind.app/docs/config-options/ - indexing/query behavior and configuration expectations.
- https://expressive-code.com/key-features/syntax-highlighting/ - rendering details for code block verification depth.

### Tertiary (LOW confidence)
- None identified in current research set.

---
*Research completed: 2026-02-23*
*Ready for roadmap: yes*
