/**
 * Config module — global config, preset CRUD, npm preset discovery.
 */

export {
  getConfigDir,
  getConfigPath,
  getGlobalConfigValue,
  loadGlobalConfig,
  saveGlobalConfig,
  setGlobalConfigValue,
} from './global.js'

export {
  deletePreset,
  getPresetsDir,
  listPresets,
  loadPreset,
  savePreset,
} from './preset.js'

export {
  discoverNpmPresets,
  loadNpmPreset,
} from './discovery.js'
