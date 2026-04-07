/**
 * Process executor — spawns upstream scaffolders with inherited stdio.
 *
 * stdio: 'inherit' gives the subprocess direct terminal access,
 * enabling interactive prompts, colored output, and progress indicators
 * to pass through to the user unmodified (UX-06).
 *
 * execa handles signal forwarding automatically (Ctrl+C terminates child).
 */

import { execa } from 'execa'

export interface SpawnOptions {
  cwd?: string
}

export interface SpawnResult {
  exitCode: number
}

/**
 * Spawn an upstream scaffolder with inherited stdio for direct terminal passthrough.
 */
export async function spawnScaffolder(
  command: string,
  args: string[],
  options: SpawnOptions = {},
): Promise<SpawnResult> {
  const result = await execa(command, args, {
    stdio: 'inherit',
    cwd: options.cwd,
    reject: false,
  })

  // Use ?? (not ||) to preserve exitCode 0 — only fallback when null/undefined
  return { exitCode: result.exitCode ?? 1 }
}
