# Pitfalls Research

**Domain:** v3.1 reliability sweep for production docs verification (GitHub Pages + Starlight/Pagefind/Expressive Code) and CLI runtime error UX verification (Commander + centralized handler)
**Researched:** 2026-02-23
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Verifying Staging Behavior Instead of Production GitHub Pages Behavior

**What goes wrong:**
Verification passes locally (`astro dev`/`astro build`) and even in CI build logs, but users still hit production issues (404s, missing assets, broken search index URLs, or stale site).

**Why it happens:**
Teams verify build artifacts, not the deployed URL and deployment metadata. GitHub Pages adds production-specific constraints (artifact shape, branch/source config, propagation delay, Pages environment).

**How to avoid:**
- Add post-deploy smoke checks against the real Pages URL (`/`, a docs page, and one code-block-heavy page).
- Assert deployment output URL from `actions/deploy-pages` and verify it serves expected content.
- Add a deterministic wait/retry window (up to 10 minutes, then fail with diagnostics).
- Record deployment SHA -> verified URL in CI summary.

**Warning signs:**
- `docs-deploy` workflow green but `DOCS-01` still manually marked as uncertain.
- Intermittent 404s on `farce1.github.io/tinkerise` after successful deploy.
- Verification relies on `apps/docs/dist` existence only.

**Phase to address:**
Phase 2 (Docs production verification implementation), then enforced in Phase 4 (regression gates).

---

### Pitfall 2: Base Path Drift (`/tinkerise`) Breaking Search and Asset Resolution

**What goes wrong:**
Site renders at root route checks but search bundle/code block assets fail because absolute/relative paths were validated outside the GitHub Pages subpath context.

**Why it happens:**
Astro/Starlight on GitHub Pages requires correct `site` + `base`. Teams often validate on localhost root and miss subpath-specific failures.

**How to avoid:**
- Keep explicit CI assertions that built URLs include `/tinkerise` prefixes where expected.
- Add an integration smoke test for one search request and one code block page under the deployed base path.
- Fail verification if any runtime request returns 404 under `/tinkerise/*` for critical assets.

**Warning signs:**
- Home page loads but internal docs links/search modal fail.
- Browser console/network shows 404s for `/pagefind/*` or code assets without `/tinkerise` prefix.
- Verifications use root URL only.

**Phase to address:**
Phase 1 (verification contract/baseline) for test targets; Phase 2 for automation.

---

### Pitfall 3: Treating Search as "Enabled" Instead of "Indexed and Queryable"

**What goes wrong:**
Search UI appears (header search control exists) but returns no/partial results in production because index generation or indexing scope is wrong.

**Why it happens:**
Starlight enables Pagefind by default, which creates false confidence. Verification stops at UI presence instead of exercising real queries against built index output.

**How to avoid:**
- Add a deploy-time acceptance check: query for 3 known terms and require matching result slugs.
- Include one negative control term to ensure query pipeline actually executes.
- Verify pages intentionally excluded from search remain excluded (frontmatter `pagefind: false` / `data-pagefind-ignore`).

**Warning signs:**
- Search input opens but "no results" for obvious page titles.
- Search works locally with `--serve` but fails on deployed site.
- `DOCS-08` closure criteria mention UI only, not query outcomes.

**Phase to address:**
Phase 2 (docs verification test suite).

---

### Pitfall 4: Code Rendering Validation Ignores Language/Theme Edge Cases

**What goes wrong:**
Basic code blocks look fine, but syntax highlighting/frames fail for specific languages or marker syntaxes used in real docs, causing unreadable examples in production.

**Why it happens:**
Expressive Code is configured globally, but verification often checks only one sample block and one theme mode.

**How to avoid:**
- Build a fixture page with representative blocks (plain fenced, shell frame, diff markers, highlighted lines/text markers).
- Validate both light/dark theme rendering for readability and structure.
- Add screenshot or DOM-assert regression check for class/structure presence on fixture page.

**Warning signs:**
- `DOCS-09` checks use a single JavaScript fence only.
- Reports of "unstyled" or "plain text" blocks in one theme.
- Visual regressions after Starlight/Expressive Code updates.

**Phase to address:**
Phase 2 implementation; Phase 4 ongoing guardrail.

---

### Pitfall 5: Path-Filtered Workflow Blind Spots (Verification Never Runs for Certain Changes)

**What goes wrong:**
Docs verification silently skips on pushes that should trigger re-validation (for example release/changelog generation dependencies or workflow-level behavior changes), leaving stale production issues undetected.

**Why it happens:**
GitHub Actions path filters are strict and include ordering/coverage constraints. Brownfield pipelines accumulate implicit dependencies faster than path lists are updated.

**How to avoid:**
- Define and document a "verification trigger matrix" for docs reliability.
- Add a scheduled nightly docs verification run (unfiltered) to catch path-filter misses.
- Add CI assertion that changed files matched at least one intended docs-verification trigger class.

**Warning signs:**
- Docs-related failures discovered after merges where docs workflow did not run.
- Repeated manual re-runs of docs deploy to "force" verification.
- Trigger logic changes with no corresponding verification update.

**Phase to address:**
Phase 1 (trigger matrix design), Phase 4 (scheduled + mandatory checks).

---

### Pitfall 6: Central Error Handler Exists but Exit-Code Semantics Regress

**What goes wrong:**
CLI prints friendlier messages but returns wrong exit codes (or always `1`/`0`), breaking CI scripts and automations that depend on operational vs usage failures.

**Why it happens:**
Retrofit focuses on message formatting and ignores contract-level behavior for `CommanderError`, `TinkeriseError`, and unexpected errors.

**How to avoid:**
- Define a runtime error contract table: input, expected message class, expected exit code.
- Execute E2E subprocess tests that assert both stderr/stdout text and process exit code.
- Keep a dedicated matrix for `CLI-01..CLI-05` with at least one test per class.

**Warning signs:**
- Verification artifacts include screenshots/text but no captured exit codes.
- Help/version/error paths share same exit status.
- Automation consumers report "command succeeded" on obvious failure or vice versa.

**Phase to address:**
Phase 3 (CLI error UX verification), then locked in Phase 4.

---

### Pitfall 7: Over-Catching Unknown Errors Masks Crash Signals and Root Cause

**What goes wrong:**
Top-level boundary catches everything and always prints generic text, erasing actionable diagnostics for maintainers or making unrecoverable states look safe.

**Why it happens:**
Boundary design optimizes for end-user friendliness but under-specifies debug channel behavior (`--verbose`, stack emission, underlying `cause`).

**How to avoid:**
- Require dual-mode verification: normal mode (friendly) and verbose mode (diagnostic fidelity).
- Assert unknown-error path includes user-safe message plus deterministic operator hint (`--verbose`).
- Assert verbose mode surfaces stack/cause details for triage.

**Warning signs:**
- Multiple distinct runtime failures produce indistinguishable output.
- Incident triage requires reproducing locally because CI logs lack root cause.
- "Unexpected error occurred" with no differentiation in verbose mode.

**Phase to address:**
Phase 3.

---

### Pitfall 8: Brownfield Regression from Changing CLI Error Surface Without Backward Checks

**What goes wrong:**
Message wording, stream target (`stdout` vs `stderr`), or suggestion formatting changes break tests/docs/scripts that parse known outputs.

**Why it happens:**
Reliability sweep changes are made in-place on a released CLI with existing behavioral consumers.

**How to avoid:**
- Freeze compatibility-critical output contracts (error prefix policy, suggestion line shape, stream placement).
- Add snapshot tests for high-value paths (unknown command, missing args, invalid scaffolder).
- Add "legacy-safe" acceptance tests for top 5 scripted usage patterns.

**Warning signs:**
- Existing integration tests fail due to text diffs, not logic changes.
- Documentation examples diverge from actual error UX.
- Support issues: "tutorial says X, CLI now says Y".

**Phase to address:**
Phase 1 (contract definition) and Phase 3 (verification), enforced in Phase 4.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Mark docs verification complete from CI build success only | Fast closure of DOCS-01/08/09 | Production regressions escape | Never |
| Verify search by checking UI renders | Minimal test work | False positives; no index quality signal | Never |
| Collapse all error cases to one generic message and code | Simpler handler logic | Breaks automation, poor diagnostics | Never |
| Update path filters ad hoc per incident | Quick fix | Fragile trigger coverage; recurring misses | Only as emergency patch, must be followed by trigger matrix update |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages Actions | Missing `pages: write`/`id-token: write` or bad `needs` wiring | Keep explicit deploy permissions and build->deploy dependency |
| GitHub Actions path filters | Assuming all relevant docs changes are covered | Maintain trigger matrix + nightly unfiltered verification run |
| Starlight + Pagefind | Assuming default enablement means valid index | Run production query assertions against known terms/slugs |
| Starlight + Expressive Code | Validating one simple fenced block | Validate representative fixture page across marker/frame/theme cases |
| Commander + top-level boundary | Friendly output without exit-code contract | Assert message + exit code + stream target in E2E subprocess tests |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full docs verification on every irrelevant push | Slow CI, skipped checks pressure | Path filter + scheduled full verification split | Medium repo activity (daily merges) |
| Unbounded retry loops for Pages propagation | Long hangs in CI | Fixed retry budget and explicit timeout diagnostics | First intermittent deployment delay |
| Verbose-mode logs always on in CI | Noisy logs obscure failures | Keep default concise logs, verbose only on failure reruns | As error matrix grows |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Printing raw unexpected error objects in non-verbose mode | Potential path/env leakage to end users | Gate full details behind `--verbose`; keep normal mode sanitized |
| Deploy verification scripts exposing tokens in logs | Secret leakage in Actions logs | Use scoped tokens, avoid echoing env vars, rely on masked secrets |
| Treating private repo Pages as private site content | Sensitive docs accidentally public | Enforce content review and explicit public-safe checks before deploy |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Stack traces shown by default on user errors | CLI feels unstable/intimidating | Friendly primary message + optional verbose diagnostics |
| "Did you mean" suggestions not verified for real typos | Misdirection on common mistakes | Add typo corpus tests for command names/options |
| Help hints inconsistent across commands | Discoverability drops | Verify standardized help-after-error and per-command examples |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **DOCS-01:** Workflow green, but production URL (`https://farce1.github.io/tinkerise/`) was not smoke-tested post-deploy.
- [ ] **DOCS-08:** Search modal opens, but no assertion that known terms return known pages.
- [ ] **DOCS-09:** One code block renders, but no fixture coverage for frames/markers/light-dark behavior.
- [ ] **CLI-01/04/05:** Friendly message exists, but exit codes per error class are not asserted via subprocess tests.
- [ ] **CLI-02:** Suggestion feature enabled, but typo corpus verification absent.
- [ ] **CLI-03:** Help examples present, but command-level `--help` output not regression-checked.
- [ ] **Brownfield safety:** New verification added, but no protection against breaking existing scripts/docs snapshots.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Production Pages mismatch | MEDIUM | Re-run deploy, validate URL + critical routes, patch base/path handling, backfill smoke test |
| Search appears but no results | MEDIUM | Inspect built `pagefind` assets, confirm indexing scope, add query assertions for fixed terms |
| CLI error UX regression | MEDIUM | Reproduce via subprocess matrix, restore contract-compliant exit/message behavior, add regression snapshot |
| Path filter skip bug | LOW | Hotfix workflow trigger patterns, run manual verification, add nightly unfiltered job |
| Over-generic unknown-error handling | LOW | Restore verbose diagnostic path and include root-cause metadata in operator mode |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Production-vs-build verification gap | Phase 2 (Docs prod verification) | CI runs post-deploy URL smoke checks and stores evidence |
| Base path drift on GitHub Pages | Phase 1 (contract) + Phase 2 (automation) | Asset/search endpoints under `/tinkerise` return 200 |
| Search enabled but not queryable | Phase 2 | Known query set returns expected slugs; excluded page stays absent |
| Code rendering edge-case gaps | Phase 2 | Fixture page checks pass for frame/marker/theme matrix |
| Path-filter trigger blind spots | Phase 1 + Phase 4 | Trigger matrix documented; nightly unfiltered verification job green |
| CLI exit-code regression | Phase 3 | Subprocess E2E asserts message + stream + exit code per error class |
| Over-caught unknown errors | Phase 3 | Normal mode sanitized; verbose mode includes stack/cause |
| Brownfield output compatibility break | Phase 1 + Phase 4 | Contract snapshots and script-compat tests pass |

## Sources

- GitHub Pages custom workflows and deployment requirements (permissions, `needs`, environment): https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages (HIGH)
- GitHub Pages availability + 404 troubleshooting behavior: https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites (HIGH)
- Astro GitHub Pages deployment (`site`/`base` guidance): https://docs.astro.build/en/guides/deploy/github/ (HIGH)
- Starlight configuration (`pagefind`, `expressiveCode`, `prerender` constraints): https://starlight.astro.build/reference/configuration/ (HIGH)
- Starlight site search behavior and exclusions: https://starlight.astro.build/guides/site-search/ (HIGH)
- Starlight authoring/code blocks and Expressive Code usage: https://starlight.astro.build/guides/authoring-content/ (HIGH)
- Expressive Code syntax-highlighting behavior and config limits: https://expressive-code.com/key-features/syntax-highlighting/ (HIGH)
- Pagefind indexing/configuration options: https://pagefind.app/docs/config-options/ (HIGH)
- Commander behavior for help/errors/suggestions/exit override: https://github.com/tj/commander.js (MEDIUM, official repo docs)
- Node.js process error events and safe handling caveats (`uncaughtException`, `unhandledRejection`): https://nodejs.org/api/process.html (HIGH)
- GitHub Actions path filter semantics and diff limits: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax (HIGH)
- Repo-specific workflow and CLI context: `.github/workflows/docs-deploy.yml`, `apps/docs/astro.config.mjs`, `packages/cli/src/index.ts`, `packages/cli/src/utils/error-handler.ts` (HIGH)

---
*Pitfalls research for: v3.1 Reliability Sweep (DOCS-01/08/09, CLI-01..CLI-05)*
*Researched: 2026-02-23*
