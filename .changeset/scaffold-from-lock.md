---
"@tinkerise/cli": minor
---

Add `tinkerise <name> --from-lock`: reproduce a project non-interactively from a `tinkerise.lock`, replaying the recorded framework, flags, and package manager. Works for all frameworks except those with interactive variant selection (Vite, T3), which surface a clear, actionable error since their variants aren't captured in the lock yet.
