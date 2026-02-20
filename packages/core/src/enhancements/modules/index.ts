/**
 * Enhancement module registry — barrel exports for all enhancement modules.
 *
 * Provides individual module exports, a recommended-order array,
 * and a Map-based registry for ID lookup.
 */

import type { EnhancementModule } from '../types.js'
import { changelogModule } from './changelog.js'
import { ciModule } from './ci.js'
import { commitlintModule } from './commitlint.js'
import { dockerModule } from './docker.js'
import { editorconfigModule } from './editorconfig.js'
import { envModule } from './env.js'
import { eslintModule } from './eslint.js'
import { huskyModule } from './husky.js'
import { prettierModule } from './prettier.js'
import { renovateModule } from './renovate.js'
import { testingModule } from './testing.js'

export { changelogModule } from './changelog.js'
export { ciModule } from './ci.js'
export { commitlintModule } from './commitlint.js'
export { dockerModule } from './docker.js'
export { editorconfigModule } from './editorconfig.js'
export { envModule } from './env.js'
export { eslintModule } from './eslint.js'
export { huskyModule } from './husky.js'
export { prettierModule } from './prettier.js'
export { renovateModule } from './renovate.js'
export { testingModule } from './testing.js'

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
