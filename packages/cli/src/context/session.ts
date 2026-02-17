/**
 * In-memory session context for same-process scaffold -> enhance flow.
 *
 * When tinkerise scaffolds a project and then applies enhancements in the
 * same process, the scaffold step sets context (framework, PM, project dir)
 * so the enhance step can skip re-detection.
 *
 * No persistence, no file I/O — purely an in-memory singleton.
 */

/** Context carried between scaffold and enhance in the same session */
export interface SessionContext {
  /** Detected or user-selected framework */
  framework?: string
  /** Detected or user-selected package manager */
  packageManager?: string
  /** Absolute path to the project directory */
  projectDir?: string
}

/** In-memory singleton */
let session: SessionContext = {}

/**
 * Merge partial context into the session singleton.
 *
 * Called by the scaffold command after successful scaffolding to carry
 * framework/PM forward to the enhance step.
 */
export function setSessionContext(ctx: Partial<SessionContext>): void {
  session = { ...session, ...ctx }
}

/**
 * Return a copy of the current session context.
 *
 * Called by the enhance/add command to check for same-session overrides
 * before falling back to filesystem detection.
 */
export function getSessionContext(): SessionContext {
  return { ...session }
}

/**
 * Reset the session context to empty.
 *
 * Used in tests to ensure clean state between test cases.
 */
export function clearSessionContext(): void {
  session = {}
}
