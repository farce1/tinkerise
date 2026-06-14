---
"@tinkerise/cli": patch
---

`tinkerise add` now shows the per-enhancement summary card (files modified, packages added) for
external npm enhancements too. The card was looked up from the built-in registry, which doesn't
contain external modules, so they were silently omitted — exactly the "what did this third-party
code touch" feedback that matters most for untrusted sources. It now resolves from the executed
module list.
