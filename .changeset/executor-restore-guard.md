---
"@tinkerise/core": patch
---

Harden the enhancement executor: restoring a module's original files after an install error or a
"skip" decision no longer aborts the whole run if a restore write fails. A failed restore is now
logged as a warning and the remaining modules still run, honoring the executor's continue-on-failure
contract.
