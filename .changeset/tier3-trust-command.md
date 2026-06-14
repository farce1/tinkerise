---
"@tinkerise/cli": minor
"@tinkerise/core": minor
---

Add `tinkerise trust` to manage external sources: `trust list`, `trust add <source>`, and `trust remove <source>`, where a source is `npm:<package>` or `github:<owner>/<repo>`. A new `parseSource` resolver canonicalizes specifiers (case-normalized) so trust cannot be bypassed by format variation, and invalid specs surface a clear `INVALID_SOURCE` error. Builds on the Tier C trust store; no external code is executed yet.
