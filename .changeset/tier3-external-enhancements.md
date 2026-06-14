---
"@tinkerise/cli": minor
"@tinkerise/core": minor
---

`tinkerise add npm:<package>` can now install an external `tinkerise-enhancement-*` package, gated by explicit per-source consent. Adds `loadNpmEnhancement` (imports + strictly validates an external EnhancementModule). Running an untrusted source prompts an explicit warning (defaults to No) and remembers the decision; in CI an untrusted source errors with `tinkerise trust add <source>` first (pre-trust required) so third-party code never runs non-interactively without prior consent. Only npm enhancements are supported for now; `github:` sources are rejected.
