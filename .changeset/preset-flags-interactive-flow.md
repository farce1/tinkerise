---
"@tinkerise/cli": patch
---

Fix preset/CLI scaffold flags being silently dropped in the interactive and category flows. Flags
not offered as interactive checkboxes (e.g. `app-router`, `src-dir` for Next.js) were discarded by
the options multiselect, so `tinkerise --preset <name>` could scaffold a project missing flags the
preset requested. `selectFrameworkOptions` now preserves preselected flags that aren't on the
checklist (and returns them for frameworks with no interactive options).
