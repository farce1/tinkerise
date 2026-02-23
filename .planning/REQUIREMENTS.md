# Requirements: tinkerise

**Defined:** 2026-02-23
**Milestone:** v3.1 Reliability Sweep
**Core Value:** One command to scaffold any project with any stack, delegating to official tools developers already trust

## v3.1 Requirements

Requirements for the v3.1 reliability milestone. Each requirement maps to exactly one roadmap phase.

### Documentation Production Verification

- [x] **DOCS-01**: User can access the documentation site at the project's GitHub Pages URL in production.
- [x] **DOCS-08**: User can search docs content on the deployed production docs site.
- [x] **DOCS-09**: User can view syntax-highlighted code examples on the deployed production docs site.
- [x] **DOCS-13**: Maintainer can run an automated post-deploy smoke check that validates docs availability, search behavior, and code-block rendering in production.

### CLI Runtime Error UX

- [x] **CLI-01**: User sees a friendly actionable error message (not a raw stack trace) for expected command failures.
- [ ] **CLI-02**: User sees a "Did you mean ..." suggestion when a command name is mistyped.
- [ ] **CLI-03**: User sees practical usage examples in `--help` output for each public command.
- [x] **CLI-04**: User-facing error paths are backed by a consistent structured error hierarchy.
- [x] **CLI-05**: User sees graceful output from a top-level error boundary for unhandled runtime failures.
- [ ] **CLI-08**: Maintainer can run a conformance matrix for representative CLI failure scenarios with stable UX and exit-code assertions.

### Reliability Evidence & Enforcement

- [ ] **REL-01**: Maintainer can produce a requirement-to-evidence closure bundle (logs/transcripts/checklists) for all v3.1 requirements.
- [ ] **REL-02**: Maintainer can enforce docs and CLI reliability verification checks as required CI gates.

## Future Requirements

Deferred to future release. Tracked but not in this milestone roadmap.

### Reliability Operations

- **REL-03**: Maintainer can run scheduled unfiltered docs verification to catch path-filter trigger gaps.

### CLI Expansion

- **CLI-06**: User can use shell completions (bash, zsh, fish).
- **CLI-07**: User can use `--json` output mode for scripting.

### Documentation Expansion

- **DOCS-10**: User can read contributor documentation on the docs site.
- **DOCS-11**: User can browse a showcase of projects created with tinkerise.
- **DOCS-12**: User can access localized docs content.

## Out of Scope

Explicitly excluded from v3.1 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full docs IA/content rewrite | v3.1 is reliability closure, not documentation expansion |
| Advanced search ranking/filter/analytics | Not required to close DOCS-08 |
| New CLI commands or major flag surface additions | Not required to close CLI-01..05 |
| CLI telemetry/observability platform | Changes product/privacy posture outside milestone scope |
| Showing full stack traces by default | Conflicts with friendly actionable error UX objective |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCS-01 | Phase 30 | Complete |
| DOCS-08 | Phase 30 | Complete |
| DOCS-09 | Phase 30 | Complete |
| DOCS-13 | Phase 30 | Complete |
| CLI-01 | Phase 31 | Complete |
| CLI-02 | Phase 31 | Pending |
| CLI-03 | Phase 31 | Pending |
| CLI-04 | Phase 31 | Complete |
| CLI-05 | Phase 31 | Complete |
| CLI-08 | Phase 31 | Pending |
| REL-01 | Phase 32 | Pending |
| REL-02 | Phase 32 | Pending |

**Coverage:**
- v3.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after roadmap phase mapping (v3.1 Reliability Sweep)*
