/**
 * Config module — global config, project config, merge chain,
 * resolve orchestrator, preset CRUD, npm preset discovery.
 */

export {
  discoverNpmPresets,
  loadNpmPreset,
} from './discovery.js'

export {
  getConfigDir,
  getConfigPath,
  getGlobalConfigValue,
  loadGlobalConfig,
  saveGlobalConfig,
  setGlobalConfigValue,
} from './global.js'

export { mergeConfigChain } from './merge.js'

export {
  deletePreset,
  getPresetsDir,
  listPresets,
  loadPreset,
  savePreset,
} from './preset.js'
export { CONFIG_FILENAME, loadProjectConfig } from './project.js'

export { resolveConfig } from './resolve.js'

export type { ResolveConfigOptions } from './resolve.js'
