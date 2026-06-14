---
"@tinkerise/core": minor
"@tinkerise/shared": minor
---

Add the Tier C foundation for external sources: a persisted trust store and a per-source consent gate (`ensureSourceTrusted`). No source is ever loaded or executed without explicit, per-source consent, which is remembered across runs. The consent prompt is supplied by the caller (callback-decoupled, like the enhancement conflict callbacks), so core stays UI-free.
