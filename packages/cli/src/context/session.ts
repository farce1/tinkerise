/**
 * Session context for scaffold -> enhance flow.
 *
 * Two layers:
 * 1. In-memory singleton — same-process scaffold -> enhance reuse (priority)
 * 2. File-based persistence — cross-process reuse within a 5-minute window
 *
 * The scaffold command writes a `.tinkerise-session.json` file in the
 * scaffolded project directory. If `tinkerise add` is invoked in that
 * directory within 5 minutes, session context is transparently reused.
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

/** Session filename written to the scaffolded project directory */
export const SESSION_FILENAME = '.tinkerise-session.json'

/** Session expires after 5 minutes (cross-process reuse window) */
const SESSION_EXPIRY_MS = 5 * 60 * 1000

/** Zod schema for validating the session file on disk */
const SessionFileSchema = z.object({
  version: z.literal(1),
  framework: z.string(),
  packageManager: z.string(),
  projectDir: z.string(),
  createdAt: z.number(),
})

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
 * Checks in-memory singleton first (same-process priority).
 * Falls back to file-based session in the current working directory
 * if in-memory session is empty.
 */
export async function getSessionContext(): Promise<SessionContext> {
  // In-memory takes priority (Pitfall 4 from research)
  if (session.framework || session.packageManager || session.projectDir) {
    return { ...session }
  }

  // Fall back to file-based session
  return readSessionFile(process.cwd())
}

/**
 * Reset the session context to empty.
 *
 * Used in tests to ensure clean state between test cases.
 */
export function clearSessionContext(): void {
  session = {}
}

/**
 * Write session context to a JSON file in the project directory.
 *
 * Called after successful scaffolding to enable cross-process reuse.
 * Best-effort: silently fails on any error (session is convenience, not critical).
 */
export async function writeSessionFile(
  projectDir: string,
  data: { framework: string, packageManager: string },
): Promise<void> {
  try {
    const sessionData = {
      version: 1 as const,
      framework: data.framework,
      packageManager: data.packageManager,
      projectDir,
      createdAt: Date.now(),
    }

    await writeFile(
      join(projectDir, SESSION_FILENAME),
      `${JSON.stringify(sessionData, null, 2)}\n`,
      'utf-8',
    )

    await addToGitignore(projectDir, SESSION_FILENAME)
  }
  catch {
    // Best-effort: session persistence is not critical
  }
}

/**
 * Read and validate a session file from the given directory.
 *
 * Returns an empty SessionContext if the file is missing, invalid,
 * expired, or points to a non-existent project directory.
 */
export async function readSessionFile(dir: string): Promise<SessionContext> {
  try {
    const raw = await readFile(join(dir, SESSION_FILENAME), 'utf-8')
    const parsed = JSON.parse(raw)
    const result = SessionFileSchema.safeParse(parsed)

    if (!result.success)
      return {}

    const data = result.data

    // Check expiry
    if (Date.now() - data.createdAt > SESSION_EXPIRY_MS)
      return {}

    // Light validation: project directory should contain package.json
    if (!existsSync(join(data.projectDir, 'package.json')))
      return {}

    return {
      framework: data.framework,
      packageManager: data.packageManager,
      projectDir: data.projectDir,
    }
  }
  catch {
    return {}
  }
}

/**
 * Add an entry to .gitignore if not already present.
 *
 * Handles edge cases: missing file, no trailing newline, duplicate entries.
 * Pattern copied from core env module to avoid cross-package dependency.
 */
async function addToGitignore(rootDir: string, entry: string): Promise<boolean> {
  const gitignorePath = join(rootDir, '.gitignore')

  let content: string
  try {
    content = await readFile(gitignorePath, 'utf-8')
  }
  catch {
    // .gitignore doesn't exist, create it
    await writeFile(gitignorePath, `${entry}\n`, 'utf-8')
    return true
  }

  // Check if entry already present (line-by-line to avoid partial matches)
  const lines = content.split('\n')
  if (lines.some(line => line.trim() === entry)) {
    return false
  }

  // Append with leading newline if file doesn't end with one
  const prefix = content.endsWith('\n') ? '' : '\n'
  await writeFile(gitignorePath, `${content}${prefix}${entry}\n`, 'utf-8')
  return true
}
