/**
 * Project context builder for the enhancement module system.
 *
 * Assembles a complete ProjectContext by reading package.json,
 * detecting the package manager and framework, and merging in
 * any same-session overrides (fresh scaffold, CLI flags).
 *
 * Reuses the existing PM detection pipeline from ../pm/detect.js
 * and framework detection from ./framework-detect.js.
 */

import type { PackageManager } from '../pm/detect.js'
import type { FrameworkId, ProjectContext } from './types.js'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { detectPackageManager } from '../pm/detect.js'
import { detectFramework } from './framework-detect.js'

/** Options for building project context */
export interface BuildContextOptions {
  /** Absolute path to project root */
  rootDir: string
  /** Override PM detection (CLI flag or same-session) */
  packageManager?: string
  /** Override framework detection (same-session) */
  framework?: string
  /** Whether tinkerise just scaffolded this project */
  freshScaffold?: boolean
  /** Verbose mode flag */
  verbose?: boolean
  /**
   * Called when detectFramework returns ambiguous (multiple frameworks detected)
   * and no framework override is set.
   *
   * Per locked decision: "On ambiguity (multiple frameworks detected): prompt user to choose."
   * If not provided (e.g., CI/non-interactive), framework is set to null.
   */
  onAmbiguousFramework?: (detected: FrameworkId[]) => Promise<FrameworkId>
}

/**
 * Build a complete ProjectContext from the filesystem and optional overrides.
 *
 * @param opts - Build context options
 * @returns Fully assembled ProjectContext
 * @throws Error if package.json cannot be read from rootDir
 */
export async function buildProjectContext(
  opts: BuildContextOptions,
): Promise<ProjectContext> {
  const { rootDir, freshScaffold = false, verbose = false } = opts

  // 1. Read package.json
  let raw: string
  try {
    raw = await readFile(join(rootDir, 'package.json'), 'utf-8')
  }
  catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      throw new Error(
        `No package.json found in ${rootDir}. Run this command from a project directory.`,
      )
    }
    throw err
  }

  const packageJson = JSON.parse(raw) as Record<string, unknown>

  // 2. Merge dependencies + devDependencies into installedDeps
  const deps = (packageJson.dependencies ?? {}) as Record<string, string>
  const devDeps = (packageJson.devDependencies ?? {}) as Record<string, string>
  const installedDeps: Record<string, string> = { ...deps, ...devDeps }

  // 3. Detect package manager
  let packageManager: PackageManager
  if (opts.packageManager) {
    // Same-session override: skip detection
    packageManager = opts.packageManager as PackageManager
  }
  else {
    const pmResult = await detectPackageManager(rootDir)
    packageManager = pmResult.pm
  }

  // 4. Detect framework
  let framework: FrameworkId | null
  if (opts.framework) {
    // Same-session override: skip detection
    framework = opts.framework as FrameworkId
  }
  else {
    const fwResult = await detectFramework(rootDir, installedDeps, packageJson)
    framework = fwResult.framework

    // 5. Handle ambiguity
    if (framework === null && fwResult.ambiguous.length > 1) {
      if (opts.onAmbiguousFramework) {
        framework = await opts.onAmbiguousFramework(fwResult.ambiguous)
      }
      // Otherwise leave as null -- caller handles gracefully
    }
  }

  return {
    rootDir,
    packageManager,
    framework,
    packageJson,
    installedDeps,
    freshScaffold,
    verbose,
  }
}
