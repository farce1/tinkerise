---
"@tinkerise/core": patch
---

Harden the `cli`, `lib`, and `mcp` template generators: validate the project name and package
manager before any filesystem work. Previously these commands passed the name straight to
`mkdir`/generated files with no validation, allowing path traversal (`tinkerise cli ../foo`),
invalid npm names, and an unknown `--package-manager` that surfaced as an "unexpected runtime
failure". They now reject such input with a structured `ConfigValidationError`, matching the
scaffold and preset paths.
