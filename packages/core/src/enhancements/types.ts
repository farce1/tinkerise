/**
 * Enhancement module type system.
 *
 * Defines the standard interface all enhancement modules implement,
 * plus supporting types for project context, detection results, and
 * install results.
 */

import type { PackageManager } from '../pm/detect.js'

/** Framework identifiers for adaptation */
export type FrameworkId
  = | 'next'
    | 'react'
    | 'vue'
    | 'svelte'
    | 'angular'
    | 'astro'
    | 'remix'
    | 'nuxt'
    | 'solid'

/** Result of detecting whether an enhancement is already present */
export interface DetectionResult {
  /** Whether the enhancement is already configured */
  installed: boolean
  /** Config files found (for conflict resolution) */
  configFiles: string[]
  /** Partial installation detected (some files but not all) */
  partial: boolean
  /** Human-readable description of what was found */
  description?: string
}

/** Project context passed to every enhancement module */
export interface ProjectContext {
  /** Absolute path to project root */
  rootDir: string
  /** Detected or specified package manager */
  packageManager: PackageManager
  /** Detected framework (null if none detected) */
  framework: FrameworkId | null
  /** Contents of package.json (parsed) */
  packageJson: Record<string, unknown>
  /** All installed dependencies (merged deps + devDeps) */
  installedDeps: Record<string, string>
  /** Whether tinkerise just scaffolded this project (same session) */
  freshScaffold: boolean
  /** Verbose mode flag */
  verbose: boolean
}

/** Result of an install operation */
export interface InstallResult {
  /** Whether installation succeeded */
  success: boolean
  /** Files created or modified */
  filesModified: string[]
  /** Packages added to package.json */
  packagesAdded: string[]
  /** Warning messages */
  warnings: string[]
}

/** Standard enhancement module definition */
export interface EnhancementModule {
  /** Unique identifier, e.g., 'eslint', 'prettier', 'husky' */
  id: string
  /** Human-readable name for display */
  name: string
  /** One-line description */
  description: string
  /** Module IDs this depends on (for topological sort) */
  dependsOn: string[]
  /** Detect whether this enhancement is already configured */
  detect: (ctx: ProjectContext) => Promise<DetectionResult>
  /** Install the enhancement into the project */
  install: (ctx: ProjectContext) => Promise<InstallResult>
}
