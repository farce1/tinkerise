/**
 * External enhancement loader (Tier C) — import a `tinkerise-enhancement-*`
 * package and validate it exposes a well-formed EnhancementModule.
 *
 * SECURITY: importing a package executes its module-load code, so callers MUST
 * gate this behind explicit per-source consent (`ensureSourceTrusted`). The
 * importer is injectable for testing.
 */

import type { EnhancementModule } from '../enhancements/index.js'

export type ModuleImporter = (specifier: string) => Promise<unknown>

/** Strictly validate the full EnhancementModule contract before trusting the cast. */
function isEnhancementModule(value: unknown): value is EnhancementModule {
  if (typeof value !== 'object' || value === null)
    return false
  const m = value as Record<string, unknown>
  return typeof m.id === 'string'
    && typeof m.name === 'string'
    && typeof m.description === 'string'
    && Array.isArray(m.dependsOn)
    && typeof m.detect === 'function'
    && typeof m.install === 'function'
}

/**
 * Load and validate an enhancement module from an npm package. Returns null if
 * the import fails or the export is not a well-formed EnhancementModule.
 */
export async function loadNpmEnhancement(
  packageName: string,
  importModule: ModuleImporter = specifier => import(specifier),
): Promise<EnhancementModule | null> {
  try {
    const mod = await importModule(packageName) as Record<string, unknown>
    const candidate = (mod && typeof mod === 'object' && 'default' in mod) ? mod.default : mod
    return isEnhancementModule(candidate) ? candidate : null
  }
  catch {
    return null
  }
}
