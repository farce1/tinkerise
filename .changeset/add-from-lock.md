---
"@tinkerise/cli": minor
---

Add `tinkerise add --from-lock`: re-apply the enhancements recorded in `tinkerise.lock` through the normal `add` pipeline (conflict-aware). Errors clearly when no lock is present, and reports when the lock records no enhancements. Lock ids are merged with any explicitly-passed enhancement names.
