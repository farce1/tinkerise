/**
 * Zod schemas for the scaffolder registry data model.
 *
 * These schemas define the structure of scaffolder entries, flag mappings,
 * prerequisites, and integration strategies. TypeScript types are inferred
 * from these schemas in types.ts via z.infer<>.
 */

import { z } from 'zod'

/**
 * Prerequisite for a scaffolder — a tool that must exist with an optional
 * minimum version requirement.
 */
export const PrerequisiteSchema = z.object({
  /** Executable name, e.g., 'node', 'python3', 'go' */
  command: z.string(),
  /** Flag to retrieve version, defaults to '--version' */
  versionFlag: z.string().default('--version'),
  /** Semver range, e.g., '>=20.11.0' */
  versionRange: z.string().optional(),
  /** Platform-specific install instructions. Keys: 'darwin', 'linux', 'win32' */
  installInstructions: z.record(z.string(), z.string()).optional(),
})

/**
 * Maps a tinkerise unified flag to a native upstream flag.
 */
export const FlagMappingSchema = z.object({
  /** Tinkerise flag name, e.g., 'typescript' */
  unified: z.string(),
  /** Native upstream flag, e.g., '--typescript' */
  native: z.string(),
  /** Negation flag, e.g., '--no-typescript' (used when user passes false) */
  nativeDisable: z.string().optional(),
  /** Value mapping for flags with arguments, e.g., { pnpm: 'pnpm', yarn: 'yarn' } */
  valueMap: z.record(z.string(), z.string()).optional(),
})

/**
 * Version-specific flag mappings. When the upstream tool version matches
 * the semver range, these flags override the base flags.
 */
export const VersionedFlagMapSchema = z.object({
  /** Semver range, e.g., '>=15.0.0' */
  versionRange: z.string(),
  /** Flags for this version range */
  flags: z.array(FlagMappingSchema),
})

/**
 * Integration strategy — how tinkerise invokes the upstream tool.
 *
 * - delegate: Run upstream tool directly (most common)
 * - wrap: Run with pre/post processing
 * - template: Copy from template directory (for custom scaffolders)
 */
export const IntegrationStrategySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('delegate'),
    /** Command to delegate to, e.g., 'create-next-app' */
    command: z.string(),
  }),
  z.object({
    type: z.literal('wrap'),
    /** Command to wrap, e.g., 'create-vite' */
    command: z.string(),
  }),
  z.object({
    type: z.literal('template'),
    /** Template directory path */
    templateDir: z.string(),
  }),
])

/**
 * Complete scaffolder registry entry. Adding a new scaffolder requires
 * only creating one of these — no logic changes (REG-01).
 */
export const ScaffolderEntrySchema = z.object({
  /** Unique identifier, e.g., 'next', 'vite', 'astro' */
  name: z.string(),
  /** Category for grouping, e.g., 'web', 'backend' */
  category: z.enum(['web', 'backend', 'mobile', 'utility']),
  /** Executable to run, e.g., 'npx' */
  command: z.string(),
  /** npm package name, e.g., 'create-next-app' */
  packageName: z.string(),
  /** How tinkerise invokes the upstream tool */
  integration: IntegrationStrategySchema,
  /** Tools that must be installed before running */
  prerequisites: z.array(PrerequisiteSchema).default([]),
  /** Base flag mappings (unified -> native) */
  flags: z.array(FlagMappingSchema).default([]),
  /** Version-specific flag overrides */
  versionedFlags: z.array(VersionedFlagMapSchema).optional(),
  /** Whether to support raw passthrough with -- separator */
  passthroughArgs: z.boolean().default(true),
})
