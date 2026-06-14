---
"@tinkerise/core": patch
---

The `cli`, `lib`, and `mcp` template generators now refuse to generate into a directory that already
exists and is non-empty (throwing `TargetDirectoryExistsError`), instead of silently overwriting an
existing project's files. A missing or empty target directory is still fine.
