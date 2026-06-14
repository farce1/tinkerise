---
"@tinkerise/cli": minor
---

`tinkerise add` now records applied enhancements into `tinkerise.lock`, keeping the lock an accurate, reproducible record of a project's stack. Best-effort: a lock update never fails an otherwise-successful `add`, and projects without a lock are left untouched.
