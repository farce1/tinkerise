/**
 * Package manager detection — lockfile, packageManager field, flag override.
 *
 * Detection follows antfu/ni precedence:
 *   flag > lockfile > packageManager field > default
 *
 * When a lockfile or packageManager field is detected but the binary is not
 * installed, returns `source: 'binary-missing'` with the detected PM name
 * so the caller can warn and fall back to prompting.
 */

import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { verifyPmBinary } from './verify.js'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface DetectResult {
  pm: PackageManager
  source: 'flag' | 'lockfile' | 'packageManager-field' | 'prompt' | 'default' | 'binary-missing'
}

/**
 * Lockfile-to-PM mapping.
 * Precedence: pnpm > bun > yarn > npm (less common PMs first since their
 * lockfile presence is more intentional — per research Pitfall 4).
 */
export const LOCKFILE_MAP: ReadonlyArray<[file: string, pm: PackageManager]> = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
]

export const VALID_PMS = ['npm', 'pnpm', 'yarn', 'bun'] as const

/**
 * Detect package manager from lockfile presence in cwd.
 * Returns the first matching PM by precedence order, or null.
 */
export async function detectFromLockfile(cwd: string): Promise<PackageManager | null> {
  for (const [file, pm] of LOCKFILE_MAP) {
    try {
      await access(join(cwd, file))
      return pm
    }
    catch {
      // File doesn't exist, try next
    }
  }
  return null
}

/**
 * Detect package manager from the `packageManager` field in package.json.
 * Format: "pnpm@8.15.0" — splits on "@" and validates the name.
 */
export async function detectFromPackageJson(cwd: string): Promise<PackageManager | null> {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw) as { packageManager?: string }
    if (pkg.packageManager) {
      const parts = pkg.packageManager.split('@')
      const name = parts[0] ?? ''
      if ((VALID_PMS as readonly string[]).includes(name)) {
        return name as PackageManager
      }
    }
  }
  catch {
    // No package.json or invalid JSON
  }
  return null
}

/**
 * Full detection pipeline:
 *   1. Explicit --package-manager flag
 *   2. Lockfile in cwd (with binary verification)
 *   3. packageManager field in package.json (with binary verification)
 *   4. Default to npm
 *
 * When a PM is detected but its binary is not installed, returns
 * `{ pm, source: 'binary-missing' }` so the caller can warn the user.
 */
export async function detectPackageManager(
  cwd: string,
  flagValue?: string,
): Promise<DetectResult> {
  // 1. Explicit flag takes precedence
  if (flagValue && (VALID_PMS as readonly string[]).includes(flagValue)) {
    return { pm: flagValue as PackageManager, source: 'flag' }
  }

  // 2. Lockfile detection
  const fromLockfile = await detectFromLockfile(cwd)
  if (fromLockfile) {
    const exists = await verifyPmBinary(fromLockfile)
    if (exists)
      return { pm: fromLockfile, source: 'lockfile' }
    return { pm: fromLockfile, source: 'binary-missing' }
  }

  // 3. packageManager field in package.json
  const fromPkgJson = await detectFromPackageJson(cwd)
  if (fromPkgJson) {
    const exists = await verifyPmBinary(fromPkgJson)
    if (exists)
      return { pm: fromPkgJson, source: 'packageManager-field' }
    return { pm: fromPkgJson, source: 'binary-missing' }
  }

  // 4. Default
  return { pm: 'npm', source: 'default' }
}
