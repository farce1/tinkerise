---
"@tinkerise/cli": minor
"@tinkerise/core": minor
---

`tinkerise trust list` now also surfaces installed-but-untrusted source packages (`tinkerise-scaffolder-*` / `tinkerise-enhancement-*`) found in the current project, so you can see what's available and grant trust. Adds `discoverNpmSources` (offline package.json scan, mirroring npm preset discovery; listing only — nothing is loaded or executed).
