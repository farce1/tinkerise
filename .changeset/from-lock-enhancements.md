---
"@tinkerise/cli": minor
---

`tinkerise <name> --from-lock` now reproduces a project in full: after scaffolding the framework it re-applies the enhancements recorded in the lock, so one command recreates the whole stack. Dry-run remains side-effect-free (enhancements are not applied).
