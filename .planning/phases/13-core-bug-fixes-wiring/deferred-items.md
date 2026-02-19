# Deferred Items - Phase 13

## Pre-existing Test Failures (Out of Scope)

**packages/cli/tests/commands/preset.test.ts** - 2 failing tests (`preset save` tests)
- Error: `buildProjectContext` export not defined on `@tinkerise/core` mock
- Root cause: Mock in preset.test.ts does not include `buildProjectContext` from `@tinkerise/core`
- This failure exists on the clean main branch before any Phase 13 changes
- Needs: Add `buildProjectContext` to the `@tinkerise/core` mock in preset.test.ts

**packages/core/tests/enhancements/executor.test.ts** - 3 failing tests
- Errors: `result.installed` assertions failing (expecting empty array, getting items)
- Tests: "skips enhancement when onConflict returns skip", "stops on first failure", "fails with error in non-interactive mode when conflict detected"
- This failure exists on the clean main branch before any Phase 13 changes
- Needs: Investigation and fix of enhancement executor test expectations
