/**
 * @tinkerise/shared — Types, constants, and utilities shared across all tinkerise packages.
 */

/**
 * Current tinkerise version. Updated at release time.
 */
export const VERSION = '0.0.0'

/**
 * Base configuration interface for tinkerise.
 */
export interface TinkeriseConfig {
  /** Project name */
  name: string
  /** Package manager to use */
  packageManager?: 'bun' | 'pnpm' | 'npm' | 'yarn'
}

/**
 * Supported scaffolder categories.
 */
export type ScaffolderCategory = 'web' | 'backend' | 'mobile' | 'utility'
