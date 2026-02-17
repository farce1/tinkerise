/**
 * Helper for defining enhancement modules with runtime validation.
 * Mirrors the defineScaffolder() pattern from the scaffolder registry.
 */

import { EnhancementModuleSchema } from './schemas.js'
import type { EnhancementModule } from './types.js'

/**
 * Define an enhancement module with full type safety.
 *
 * Validates the module definition at runtime via Zod and provides
 * autocomplete in TypeScript-aware editors. Throws ZodError if invalid.
 *
 * @example
 * ```ts
 * export const eslint = defineEnhancement({
 *   id: 'eslint',
 *   name: 'ESLint',
 *   description: 'Configure ESLint with framework-specific rules',
 *   dependsOn: [],
 *   detect: async (ctx) => ({ installed: false, configFiles: [], partial: false }),
 *   install: async (ctx) => ({ success: true, filesModified: [], packagesAdded: [], warnings: [] }),
 * })
 * ```
 */
export function defineEnhancement(module: EnhancementModule): EnhancementModule {
  return EnhancementModuleSchema.parse(module) as EnhancementModule
}
