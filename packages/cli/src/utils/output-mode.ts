/**
 * Runtime mode singleton for --json structured output (Phase 33).
 *
 * Detection runs synchronously at module-evaluation time, BEFORE Commander's
 * parseAsync() and BEFORE checkForUpdate() at the top of index.ts. This
 * placement is mandatory: update-check fires before parseAsync, so a
 * Commander preAction hook would be too late (D-15).
 *
 * Strict-equality argv check (`argv.includes('--json')`) is intentional —
 * forms like `--json=true` are not supported. Commander still validates
 * the global option for help symmetry.
 */

let jsonMode = false

/**
 * Inspect argv and flip the module-level jsonMode flag.
 * Call this at the very top of the CLI entry point.
 */
export function detectJsonMode(argv: readonly string[] = process.argv): void {
  jsonMode = argv.includes('--json')
}

/** Current mode — true when the CLI was invoked with `--json`. */
export function isJsonMode(): boolean {
  return jsonMode
}

/**
 * Emit a single JSON object to stdout followed by exactly one newline (D-12).
 * Use this for the success envelope and for the error envelope (D-05).
 */
export function emitJson(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`)
}

/**
 * TEST-ONLY: reset module state. Exported so co-located unit tests can
 * verify detection idempotently. Production code MUST NOT call this.
 */
export function __resetJsonModeForTests(): void {
  jsonMode = false
}
