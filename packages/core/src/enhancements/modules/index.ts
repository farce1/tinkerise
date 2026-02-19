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
export { dockerModule } from './docker.js'
export { envModule } from './env.js'
export { commitlintModule } from './commitlint.js'
export { changelogModule } from './changelog.js'
export { testingModule } from './testing.js'
export { renovateModule } from './renovate.js'
export { editorconfigModule } from './editorconfig.js'

import { eslintModule } from './eslint.js'
import { prettierModule } from './prettier.js'
import { huskyModule } from './husky.js'
import { ciModule } from './ci.js'
import { dockerModule } from './docker.js'
import { envModule } from './env.js'
import { commitlintModule } from './commitlint.js'
import { changelogModule } from './changelog.js'
import { testingModule } from './testing.js'
import { renovateModule } from './renovate.js'
import { editorconfigModule } from './editorconfig.js'
import type { EnhancementModule } from '../types.js'

/** All available enhancement modules in recommended execution order */
export const allEnhancementModules: EnhancementModule[] = [
  eslintModule,
  prettierModule,
  huskyModule,
  commitlintModule,
  changelogModule,
  ciModule,
  testingModule,
  dockerModule,
  envModule,
  renovateModule,
  editorconfigModule,
]

/** Lookup map: module ID -> module */
export const enhancementRegistry: ReadonlyMap<string, EnhancementModule> = new Map(
  allEnhancementModules.map(m => [m.id, m]),
)
