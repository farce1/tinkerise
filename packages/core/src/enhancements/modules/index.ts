/**
 * Enhancement module registry — barrel exports for all enhancement modules.
 *
 * Provides individual module exports, a recommended-order array,
 * and a Map-based registry for ID lookup.
 */

export { eslintModule } from './eslint.js'
export { prettierModule } from './prettier.js'
export { huskyModule } from './husky.js'
export { ciModule } from './ci.js'

import { eslintModule } from './eslint.js'
import { prettierModule } from './prettier.js'
import { huskyModule } from './husky.js'
import { ciModule } from './ci.js'
import type { EnhancementModule } from '../types.js'

/** All available enhancement modules in recommended execution order */
export const allEnhancementModules: EnhancementModule[] = [
  eslintModule,
  prettierModule,
  huskyModule,
  ciModule,
]

/** Lookup map: module ID -> module */
export const enhancementRegistry: ReadonlyMap<string, EnhancementModule> = new Map(
  allEnhancementModules.map(m => [m.id, m]),
)
