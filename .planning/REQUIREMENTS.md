# Requirements: tinkerise — v3.2 CLI Power-User & Polish

**Defined:** 2026-05-11
**Core Value:** One command to scaffold any project with any stack, delegating to official tools developers already trust

## Milestone Requirements

Requirements for v3.2. Each maps to exactly one roadmap phase.

### Shell Completions

- [x] **CLI-09**: `tinkerise completion <shell>` command emits completion script to stdout for bash, zsh, and fish
- [x] **CLI-10**: Completion scripts work for both `tinkerise` and `tk` aliases — covering commands, flags, and dynamic values (scaffolder names, preset names)
- [x] **CLI-11**: Docs site documents completion install with copy-paste instructions for each shell (bash, zsh, fish)

### Structured Output (`--json`)

- [x] **CLI-12**: `tinkerise list --json` emits machine-readable list of scaffolders and enhancements
- [x] **CLI-13**: `tinkerise doctor --json` emits machine-readable diagnostics with pass/fail status per check
- [x] **CLI-14**: `tinkerise preset list --json` and `tinkerise preset show <name> --json` emit machine-readable preset data
- [x] **CLI-15**: `--json` output uses a documented schema with a `schemaVersion` field for downstream-script stability

### Reliability Operations

- [ ] **REL-04**: Scheduled GitHub Actions workflow runs full unfiltered docs verification weekly and opens a GitHub Issue on failure (covers path-filter trigger gaps from REL-03)

### CLI UX Refinements

- [ ] **CLI-16**: Ship 1–2 small CLI UX refinements identified during phase planning — each with documented before/after evidence and a test (candidates: error message guidance, doctor next-step actionability, prompt copy clarity)

## Future Requirements

Deferred to later milestones. Tracked but not in v3.2 scope.

### Docs Expansion

- **DOCS-10**: Contributor documentation on the docs site
- **DOCS-11**: Showcase/gallery of projects created with tinkerise
- **DOCS-12**: Localized docs content

## Out of Scope (v3.2)

Explicitly excluded from this milestone. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Plugin API for community scaffolders | Per PROJECT.md — defer until community demand proven |
| Programmatic API (`@tinkerise/core` as public library) | Not aligned with this milestone's CLI-polish theme; revisit if AI-agent / IDE-extension demand surfaces |
| New scaffolders (Bun create, Tauri, Nuxt 4, Solid Start) | Ecosystem expansion is a separate milestone theme |
| AI-assisted project init | Preserves wrap-official-tools principle |
| Telemetry | Post-v2 per PROJECT.md |
| VS Code extension | Post-v2 per PROJECT.md |
| PowerShell / Nushell completion | bash/zsh/fish covers ~99% of users; PowerShell/Nushell only if demand surfaces |
| Backwards-incompatible `--json` schema changes | `schemaVersion` field is a stability contract — breaking changes deferred to v4.0 |

## Traceability

Which phase covers which requirement. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-09 | Phase 34 | Complete |
| CLI-10 | Phase 34 | Complete |
| CLI-11 | Phase 34 | Complete |
| CLI-12 | Phase 33 | Complete |
| CLI-13 | Phase 33 | Complete |
| CLI-14 | Phase 33 | Complete |
| CLI-15 | Phase 33 | Complete |
| REL-04 | Phase 35 | Pending |
| CLI-16 | Phase 36 | Pending |

**Coverage:**
- v3.2 requirements: 9 total
- Mapped to phases: 9 ✓
- Unmapped: 0

---
*Requirements defined: 2026-05-11*
*Last updated: 2026-05-11 after roadmap creation (Phases 33-36)*
</content>
