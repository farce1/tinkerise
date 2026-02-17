/**
 * Framework detection from package.json dependencies and config files.
 *
 * Detects the project's primary framework using a priority-ordered
 * rule set: meta-frameworks first (more specific), then base frameworks.
 * Config file presence confirms detection for frameworks that have
 * distinctive config files.
 *
 * When multiple frameworks are detected (ambiguity), returns null with
 * the detected list so the caller can prompt the user to choose.
 */

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { FrameworkId } from './types.js'

/** A single framework detection rule */
export interface FrameworkRule {
  /** Framework identifier */
  id: FrameworkId
  /** package.json dependency names (any match = candidate) */
  packages: string[]
  /** Config files that confirm this framework (empty = dep presence is sufficient) */
  configFiles: string[]
}

/** Result of framework detection */
export interface FrameworkDetectResult {
  /** Detected framework, or null if none or ambiguous */
  framework: FrameworkId | null
  /** All detected frameworks (populated when ambiguous, i.e., length > 1) */
  ambiguous: FrameworkId[]
}

/**
 * Framework detection rules, ordered by specificity.
 * Meta-frameworks first (more specific) to ensure Next.js > React, Nuxt > Vue.
 */
export const FRAMEWORK_RULES: readonly FrameworkRule[] = [
  // Meta-frameworks first (more specific)
  { id: 'next', packages: ['next'], configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'] },
  { id: 'nuxt', packages: ['nuxt'], configFiles: ['nuxt.config.ts', 'nuxt.config.js'] },
  { id: 'remix', packages: ['@remix-run/react', 'react-router'], configFiles: [] },
  { id: 'astro', packages: ['astro'], configFiles: ['astro.config.mjs', 'astro.config.ts'] },
  // Base frameworks
  { id: 'svelte', packages: ['svelte'], configFiles: ['svelte.config.js'] },
  { id: 'vue', packages: ['vue'], configFiles: ['vue.config.js', 'vite.config.ts'] },
  { id: 'react', packages: ['react', 'react-dom'], configFiles: [] },
  { id: 'angular', packages: ['@angular/core'], configFiles: ['angular.json'] },
  { id: 'solid', packages: ['solid-js'], configFiles: [] },
]

/**
 * Detect the project's framework from installed dependencies and config files.
 *
 * @param rootDir - Absolute path to project root
 * @param installedDeps - Merged dependencies + devDependencies from package.json
 * @param _packageJson - Parsed package.json (reserved for future heuristics)
 * @returns Detection result with framework and ambiguity info
 */
export async function detectFramework(
  rootDir: string,
  installedDeps: Record<string, string>,
  _packageJson: Record<string, unknown>,
): Promise<FrameworkDetectResult> {
  const detected: FrameworkId[] = []

  for (const rule of FRAMEWORK_RULES) {
    const hasDep = rule.packages.some(pkg => pkg in installedDeps)
    if (!hasDep) continue

    if (rule.configFiles.length > 0) {
      // Confirm with config file existence
      let confirmed = false
      for (const cf of rule.configFiles) {
        try {
          await access(join(rootDir, cf))
          confirmed = true
          break
        }
        catch {
          // Config file not found, try next
        }
      }
      if (confirmed) {
        detected.push(rule.id)
      }
    }
    else {
      // No config files to check -- dependency presence is sufficient
      detected.push(rule.id)
    }
  }

  if (detected.length === 0) {
    return { framework: null, ambiguous: [] }
  }

  if (detected.length === 1) {
    return { framework: detected[0]!, ambiguous: [] }
  }

  // Multiple frameworks detected -- ambiguous
  // Return null framework with the detected list for caller to prompt
  return { framework: null, ambiguous: detected }
}
