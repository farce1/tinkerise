---
"@tinkerise/core": patch
---

Fix error UX: a missing `package.json` (e.g. running `add` outside a project) and a malformed JSON
config now throw structured errors (`MissingPackageJsonError`, `InvalidJsonConfigError`) with
actionable suggestions, instead of generic errors the CLI rendered as an "unexpected runtime
failure" telling users to file a bug report for their own fixable mistakes.
