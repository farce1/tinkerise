# Requirements: tinkerise

**Defined:** 2026-02-20
**Core Value:** One command to scaffold any project with any stack, delegating to official tools developers already trust

## v3.0 Requirements

Requirements for documentation and polish milestone. Each maps to roadmap phases.

### Documentation Site

- [ ] **DOCS-01**: User can access a Starlight documentation site at the project's GitHub Pages URL
- [x] **DOCS-02**: User can follow a Getting Started guide to install and run their first scaffold
- [x] **DOCS-03**: User can browse scaffolder guides explaining each of the 14 supported frameworks
- [x] **DOCS-04**: User can browse enhancement guides explaining each of the 11 enhancement modules
- [x] **DOCS-05**: User can read preset and configuration guides covering the 4-layer config system
- [x] **DOCS-06**: User can look up any CLI command, flag, and option in a generated Command Reference
- [x] **DOCS-07**: User can follow 3-5 recipe pages for common scaffolding scenarios (e.g., "Next.js + ESLint + Docker")
- [ ] **DOCS-08**: User can search docs content via built-in Pagefind search
- [ ] **DOCS-09**: User can view syntax-highlighted code examples via Expressive Code blocks

### CLI Polish

- [ ] **CLI-01**: User sees a friendly, actionable error message (not a raw stack trace) when a command fails
- [ ] **CLI-02**: User sees a "Did you mean X?" suggestion when they mistype a command name
- [ ] **CLI-03**: User sees usage examples in `--help` output for each command
- [ ] **CLI-04**: CLI uses structured error classes (TinkeriseError hierarchy) for consistent error handling
- [ ] **CLI-05**: CLI has a top-level error boundary that catches all unhandled errors gracefully

### Visual Discovery

- [ ] **VIS-01**: README leads with a hero GIF demonstrating the core scaffold workflow
- [ ] **VIS-02**: README has a compelling value proposition, copy-paste quickstart, and link to docs site
- [x] **VIS-03**: VHS terminal demo `.tape` files exist for key workflows (scaffold, add, list, doctor)
- [ ] **VIS-04**: Generated GIFs are embedded in both README and documentation site

### Distribution Polish

- [ ] **DIST-01**: Documentation site auto-deploys to GitHub Pages on push to main (path-filtered)
- [ ] **DIST-02**: GitHub Releases are created automatically with categorized release notes on publish
- [ ] **DIST-03**: Documentation site includes a changelog page sourced from release history

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Documentation Expansion

- **DOCS-10**: User can read contribution guide on docs site
- **DOCS-11**: User can browse a showcase of projects created with tinkerise
- **DOCS-12**: Documentation supports i18n/localization

### CLI Expansion

- **CLI-06**: CLI supports shell completions (bash, zsh, fish)
- **CLI-07**: CLI supports `--json` output mode for scripting

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Custom domain (tinkerise.dev) | Defer until traffic justifies domain purchase |
| Blog section in docs | No content strategy yet, adds maintenance burden |
| Interactive playground | High complexity, low value for CLI tool |
| Automated screenshot testing | Premature — revisit when docs are stable |
| CI-generated VHS demos | Timing fragility in CI — generate locally, commit GIFs |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCS-01 | Phase 25 | Pending |
| DOCS-02 | Phase 26 | Complete |
| DOCS-03 | Phase 26 | Complete |
| DOCS-04 | Phase 26 | Complete |
| DOCS-05 | Phase 26 | Complete |
| DOCS-06 | Phase 26 | Complete |
| DOCS-07 | Phase 26 | Complete |
| DOCS-08 | Phase 25 | Pending |
| DOCS-09 | Phase 25 | Pending |
| CLI-01 | Phase 24 | Pending |
| CLI-02 | Phase 24 | Pending |
| CLI-03 | Phase 24 | Pending |
| CLI-04 | Phase 24 | Pending |
| CLI-05 | Phase 24 | Pending |
| VIS-01 | Phase 28 | Pending |
| VIS-02 | Phase 28 | Pending |
| VIS-03 | Phase 27 | Complete |
| VIS-04 | Phase 27 | Pending |
| DIST-01 | Phase 29 | Pending |
| DIST-02 | Phase 29 | Pending |
| DIST-03 | Phase 29 | Pending |

**Coverage:**
- v3.0 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-20 after roadmap creation*
