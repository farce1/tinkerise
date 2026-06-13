---
"@tinkerise/cli": patch
---

Fix fish shell completion under fish 4.x: complete global flags after subcommands, suppress file fallback for unknown commands, and complete value flags (e.g. `--preset`) without leaking subcommand names.
