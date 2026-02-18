/**
 * Configuration types for tinkerise user config and preset data.
 *
 * These are the primary type exports — direct interfaces for clarity
 * (per Phase 5 decision: direct interfaces over z.infer).
 */

/**
 * User-level configuration for tinkerise.
 * All fields are optional — partial configs are the norm.
 */
export interface TinkeriseUserConfig {
  /** Preferred package manager for scaffolding */
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'
  /** Whether to enable TypeScript by default */
  typescript?: boolean
  /** Default scaffolder category */
  defaultCategory?: 'web' | 'backend' | 'mobile'
}

/**
 * Preset data — captures a reusable project setup recipe.
 *
 * A preset bundles framework choice, flags, enhancements, and user config
 * into a single shareable artifact (PRE-04).
 */
export interface PresetData {
  /** Schema version — always 1 for now */
  version: 1
  /** Human-readable preset name */
  name: string
  /** Optional description of what this preset does */
  description?: string
  /** Scaffold configuration — which framework and how to invoke it */
  scaffold: {
    /** Framework/scaffolder ID, e.g., 'next', 'vite', 'astro' */
    framework: string
    /** Scaffolder category, e.g., 'web', 'backend' */
    category: string
    /** Flag overrides, e.g., { typescript: true, tailwind: 'yes' } */
    flags: Record<string, string | boolean>
  }
  /** Enhancement module IDs to apply after scaffolding */
  enhancements: string[]
  /** User config overrides bundled with the preset */
  config: Partial<TinkeriseUserConfig>
}
