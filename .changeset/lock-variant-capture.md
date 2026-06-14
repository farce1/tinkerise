---
"@tinkerise/cli": minor
"@tinkerise/shared": minor
---

Capture framework variant selections (Vite template + TypeScript, T3 components) in `tinkerise.lock` via a new optional `variant` field, and reproduce them with `--from-lock`. Vite and T3 are now fully supported by `tinkerise <name> --from-lock`; locks written before this change surface a clear `LOCK_MISSING_VARIANT` error for those two frameworks.
