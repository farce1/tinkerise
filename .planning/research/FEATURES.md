# Feature Research

**Domain:** Milestone v3.1 reliability sweep (production docs verification + CLI runtime error UX)
**Researched:** 2026-02-23
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features required to close pending v3.0 requirements only (`DOCS-01`, `DOCS-08`, `DOCS-09`, `CLI-01..CLI-05`).

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Production docs URL is reachable and serves built site (`DOCS-01`) | If docs link is published, users expect it to load reliably from GitHub Pages without manual branch tricks. | LOW | Acceptance should verify HTTP success, expected homepage content, and no default 404/empty shell. |
| Production docs search works on deployed site (`DOCS-08`) | Starlight docs are expected to be searchable; non-working search makes docs feel broken. | MEDIUM | Verify search UI loads Pagefind assets in production build and returns relevant results for known terms (e.g., `doctor`, `preset`, `add`). |
| Production code blocks render with highlighting (`DOCS-09`) | Developer docs must render code samples correctly; plain/unformatted code harms readability and trust. | LOW | Verify Expressive Code output appears on deployed pages, including at least one TS and shell snippet. |
| Friendly actionable command failure messaging (`CLI-01`) | CLI users expect human-readable errors with a next step, not raw Node stack traces. | MEDIUM | Error copy pattern: what failed, why (if known), what to do next. Keep raw stack behind debug path only. |
| Mistyped command suggestion (`CLI-02`) | Modern CLIs suggest close commands to reduce friction and support burden. | LOW | Commander supports suggestions; verify typo cases (e.g., `ad`, `scafold`) produce guidance and non-zero exit. |
| Usage examples in `--help` per command (`CLI-03`) | Help text is incomplete without concrete examples for common invocations. | LOW | Ensure each user-facing command has at least 1 realistic example and examples stay in sync with actual flags. |
| Structured error hierarchy and normalized handling (`CLI-04`) | Consistent error classes are needed for consistent UX and predictable exit behavior. | MEDIUM | Define class contract (code, message, hint, cause optional) and map known failures to typed errors. |
| Top-level error boundary catches unhandled failures (`CLI-05`) | Users expect graceful failure even for unexpected runtime issues. | MEDIUM | Cover both sync throws and unhandled promise rejections; print safe message and deterministic exit code. |

### Differentiators (Competitive Advantage)

Useful additions that improve reliability confidence for this milestone without re-scoping product surface.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Requirements-to-checklist closure matrix | Makes closure objective: each pending requirement has explicit verification steps and pass criteria. | LOW | Helps requirements writer and reviewer avoid ambiguous "looks good" sign-off. |
| Error scenario conformance matrix (5-10 representative failures) | Proves UX consistency across real failure modes instead of one happy-path check. | MEDIUM | Include dependency install failure, invalid command, invalid option, scaffolder process failure, unexpected exception. |
| Deterministic error contract snapshot tests | Prevents regressions in wording structure and exit code behavior after future refactors. | MEDIUM | Snapshot key fields (code, headline, hint presence, exit code), not full volatile stack content. |
| Production docs smoke check script for deploy artifacts | Converts manual docs verification into repeatable checks after each docs deploy. | MEDIUM | Keep lightweight: URL reachable, search assets present, highlighted code block markup present. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Rewriting docs IA/content for v3.1 | "While we are in docs, improve structure/copy." | Expands scope beyond pending reliability requirements and risks slipping milestone closure. | Limit to production verification + minimal fixes required to satisfy `DOCS-01/08/09`. |
| Building advanced search features (ranking tuning, filters, analytics) | "If touching search, make it smarter." | Not required for closure; adds config churn and debugging surface. | Verify default Pagefind/Starlight search works reliably in production. |
| Full observability pipeline for CLI errors | "Track every crash in telemetry." | Changes privacy/product posture and requires infra decisions outside milestone scope. | Keep local structured error handling + deterministic UX and exit semantics. |
| Showing stack traces by default for all errors | "More detail helps debugging." | Violates friendly UX goal and increases noise/confusion for normal users. | Show concise actionable message by default; provide stack only in debug mode. |
| Adding new commands/options to make help examples richer | "Help examples need more scenarios." | Creates net-new product scope instead of closing existing requirement gaps. | Add examples using already-shipped commands and options only. |

## Feature Dependencies

```text
[DOCS-01 Production Availability]
    └──unblocks──> [DOCS-08 Search Verification]
                          └──requires──> [Pagefind assets present in production output]

[DOCS-01 Production Availability]
    └──unblocks──> [DOCS-09 Code Rendering Verification]
                          └──requires──> [Expressive Code-rendered markup in production pages]

[CLI-04 Structured Error Classes]
    └──enables──> [CLI-01 Friendly Actionable Errors]

[CLI-04 Structured Error Classes]
    └──enables──> [CLI-05 Top-level Error Boundary Consistency]

[CLI-01 Friendly Errors]
    └──complements──> [CLI-02 Suggestion UX]

[CLI-03 Help Examples]
    └──independent-but-related──> [CLI-01 Actionability]
```

### Dependency Notes

- **Docs sequencing:** verify deployment availability first, then validate search/code rendering on the live URL; otherwise failures are ambiguous.
- **CLI sequencing:** finalize error class contract before polishing copy; copy work is unstable until class mapping is stable.
- **Top-level boundary last:** install and validate global boundary after command-level handling to avoid masking typed error behavior.
- **Parallelization:** docs verification stream and CLI error UX stream can run in parallel once acceptance checklists are defined.

## Acceptance Outcomes (Definition of Done)

| Requirement | Done When | Evidence |
|-------------|-----------|----------|
| `DOCS-01` | GitHub Pages docs URL consistently serves expected docs homepage and key routes in production. | Recorded verification log with URLs, timestamp, and pass/fail checks. |
| `DOCS-08` | Search input returns relevant results for at least 3 known terms on production site; no missing Pagefind assets. | Production screenshots or automated check output + searched terms/results. |
| `DOCS-09` | Code examples render with syntax highlighting and readable formatting on production pages. | Production screenshots/check output for at least TS + shell examples. |
| `CLI-01` | Known runtime failures show friendly actionable message with no raw stack by default. | CLI transcript fixtures for representative failure scenarios. |
| `CLI-02` | Mistyped command names display "Did you mean ..." suggestions and fail predictably. | CLI transcripts for typo cases (`ad`, `scafold`, unknown command). |
| `CLI-03` | `--help` output for each command includes practical usage examples. | Help output snapshot/tests covering top-level and subcommands. |
| `CLI-04` | Error handling paths use `TinkeriseError` hierarchy with consistent shape and semantics. | Unit tests proving class mapping and serialization/printing contract. |
| `CLI-05` | Unhandled sync and async errors are caught by a top-level boundary with graceful output and deterministic exit code. | E2E/integ tests intentionally triggering uncaught throw + unhandled rejection. |

## MVP Definition

### Launch With (v3.1 closeout)

- [ ] Production verification and closure for `DOCS-01`, `DOCS-08`, `DOCS-09`.
- [ ] Runtime error UX hardening and closure for `CLI-01` through `CLI-05`.
- [ ] Acceptance evidence bundle (test output/transcripts/checklist) attached to requirement closure.

### Add After Validation (v3.1.x)

- [ ] Lightweight automated production docs smoke check in CI post-deploy.
- [ ] Broader error scenario conformance matrix to guard regressions.

### Future Consideration (v2+)

- [ ] Advanced docs search tuning (ranking/filters/analytics).
- [ ] Optional structured machine-readable error output mode (`--json`) from future requirement set.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Close `DOCS-01/08/09` with production verification | HIGH | MEDIUM | P1 |
| Close `CLI-01..CLI-05` with consistent runtime UX | HIGH | MEDIUM | P1 |
| Add acceptance evidence checklist artifacts | HIGH | LOW | P1 |
| Add automated docs smoke checks | MEDIUM | MEDIUM | P2 |
| Expand error conformance matrix beyond MVP set | MEDIUM | MEDIUM | P2 |

**Priority key:**
- P1: Must have for milestone closure
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Sources

- `.planning/PROJECT.md` (milestone scope and active requirements context) [HIGH]
- `.planning/milestones/v3.0-REQUIREMENTS.md` (pending requirement definitions: `DOCS-01/08/09`, `CLI-01..CLI-05`) [HIGH]
- https://starlight.astro.build/ (Starlight includes docs search and code highlighting capabilities at framework level) [MEDIUM]
- https://pagefind.app/docs/ (Pagefind deployment/runtime behavior and asset expectations) [MEDIUM]
- https://expressive-code.com/ (Expressive Code rendering/highlighting behavior) [MEDIUM]
- https://github.com/tj/commander.js (command suggestion and help text extension behaviors) [MEDIUM]
- https://nodejs.org/api/process.html (uncaught exception and unhandled rejection handling constraints) [MEDIUM]

---
*Feature research for: v3.1 Reliability Sweep (pending v3.0 closure only)*
*Researched: 2026-02-23*
