/**
 * `tinkerise preset` command — manage reusable configuration presets.
 *
 * Subcommands:
 * - `preset save <name>` — capture current config as a preset
 * - `preset use <name>` — apply a saved preset
 * - `preset list` — show available presets (local + npm)
 * - `preset delete <name>` — remove a local preset
 *
 * Presets bundle framework, category, enhancements, and config overrides
 * into a shareable artifact. The preset layer feeds into the config
 * resolution chain as lowest priority (CLI > project > global > preset).
 */

import type { ConflictAction, EnhancementModule } from '@tinkerise/core'
import type { PresetData, TinkeriseUserConfig } from '@tinkerise/shared'
import type { Command } from 'commander'
import path from 'node:path'
import {
  allEnhancementModules,
  buildProjectContext,
  ConfigValidationError,
  deletePreset,
  discoverNpmPresets,
  ENHANCEMENT_NEXT_STEPS,
  enhancementRegistry,
  getPresetsDir,
  isCI,
  listPresets,
  loadNpmPreset,
  loadPreset,
  loadProjectConfig,
  PresetNotFoundError,
  runEnhancements,
  savePreset,
  showEnhancementSummary,
  showPerEnhancementSummary,
} from '@tinkerise/core'
import { PresetListEnvelopeV1Schema, PresetNameSchema, PresetShowEnvelopeV1Schema } from '@tinkerise/shared'
import pc from 'picocolors'
import {
  cancel,
  confirm,
  isCancel,
  log,
  select,
  text,
} from '../utils/clack-output.js'
import { emitJson, isJsonMode } from '../utils/output-mode.js'

const PRESET_NAME_VALID_VALUES = 'lowercase letters, numbers, hyphens, dots, underscores; max 64 chars'

function assertValidPresetName(name: string): void {
  if (!PresetNameSchema.safeParse(name).success) {
    throw new ConfigValidationError('presetName', name, PRESET_NAME_VALID_VALUES)
  }
}

/**
 * Build the JSON payload for `tinkerise preset list --json` (CLI-14).
 *
 * Mirrors the data the human path consumes (local presets via listPresets
 * + loadPreset for descriptions, npm presets via discoverNpmPresets) but
 * reshaped to PresetListPayloadV1. D-21: empty arrays preserved. D-22:
 * `description` omitted when absent.
 */
async function buildPresetListPayload(): Promise<{
  local: Array<{ name: string, description?: string }>
  npm: Array<{ package: string }>
}> {
  const localNames = await listPresets()
  const npmPackages = await discoverNpmPresets(process.cwd())

  const local = await Promise.all(localNames.map(async (name): Promise<{ name: string, description?: string }> => {
    const data = await loadPreset(name)
    if (data?.description) {
      return { name, description: data.description }
    }
    return { name }
  }))
  const npm = npmPackages.map(pkg => ({ package: pkg }))

  return { local, npm }
}

/**
 * Registers the `preset` command group on the given Commander program.
 */
export function registerPresetCommand(program: Command): void {
  const programName = program.name()

  const preset = program
    .command('preset')
    .summary('Manage configuration presets')
    .description('Save, apply, list, and delete reusable configuration presets.')
    .addHelpText('after', `
Examples:
  $ ${programName} preset list                Discover local and npm presets
  $ ${programName} preset use team-defaults   Apply an existing preset to the current project`)

  // --- preset save <name> ---
  preset
    .command('save <name>')
    .description('Save current config as a named preset')
    .option('--description <desc>', 'Description of what this preset does')
    .option('--framework <fw>', 'Framework/scaffolder ID (e.g., next, vite)')
    .option('--category <cat>', 'Scaffolder category (web, backend, mobile)')
    .action(async (name: string, options: { description?: string, framework?: string, category?: string }) => {
      assertValidPresetName(name)

      // Read project config for config overrides
      const projectConfig = await loadProjectConfig(process.cwd())
      const config: Partial<TinkeriseUserConfig> = projectConfig ?? {}

      // Determine framework and category from flags or prompt
      let framework = options.framework
      let category = options.category

      if (!framework) {
        const result = await text({
          message: 'Framework/scaffolder ID (e.g., next, vite, astro):',
          validate: v => (!v || v.length === 0 ? 'Framework is required' : undefined),
        })
        if (isCancel(result)) {
          cancel('Cancelled.')
          process.exit(0)
        }
        framework = result
      }

      if (!category) {
        const result = await select({
          message: 'Scaffolder category:',
          options: [
            { value: 'web', label: 'web' },
            { value: 'backend', label: 'backend' },
            { value: 'mobile', label: 'mobile' },
          ],
        })
        if (isCancel(result)) {
          cancel('Cancelled.')
          process.exit(0)
        }
        category = result as string
      }

      // Detect installed enhancements by running detect() on each module
      const ctx = await buildProjectContext({
        rootDir: process.cwd(),
        freshScaffold: false,
        verbose: false,
      })

      const installedEnhancements: string[] = []
      for (const mod of allEnhancementModules) {
        try {
          const detection = await mod.detect(ctx)
          if (detection.installed) {
            installedEnhancements.push(mod.id)
          }
        }
        catch {
          // Skip modules that fail detection (e.g., missing package.json)
        }
      }

      const presetData: PresetData = {
        version: 1,
        name,
        description: options.description,
        scaffold: {
          framework,
          category,
          flags: {},
        },
        enhancements: installedEnhancements,
        config,
      }

      await savePreset(presetData)

      const presetsDir = getPresetsDir()
      log.success(`Preset "${name}" saved to ${presetsDir}/${name}.json`)
      if (installedEnhancements.length > 0) {
        log.info(`  Enhancements: ${installedEnhancements.join(', ')}`)
      }
    })
    .addHelpText('after', `
Examples:
  $ ${programName} preset save my-stack                         Save current config as preset
  $ ${programName} preset save my-stack --framework next --category web  Save with framework info`)

  // --- preset use <name> ---
  preset
    .command('use <name>')
    .description('Apply a saved preset')
    .action(async (name: string) => {
      assertValidPresetName(name)

      // Try local first
      let presetData = await loadPreset(name)

      // Try npm if not found locally
      if (!presetData) {
        presetData = await loadNpmPreset(`tinkerise-preset-${name}`)
      }

      if (!presetData) {
        throw new PresetNotFoundError(name)
      }

      // Apply directly without confirmation (per user decision)
      log.info(`Applying preset "${presetData.name}"${presetData.description ? ` — ${presetData.description}` : ''}`)
      log.info(`  Framework: ${presetData.scaffold.framework} (${presetData.scaffold.category})`)
      if (presetData.enhancements.length > 0) {
        log.info(`  Enhancements: ${presetData.enhancements.join(', ')}`)
      }
      if (Object.keys(presetData.config).length > 0) {
        log.info(`  Config: ${JSON.stringify(presetData.config)}`)
      }

      // Apply enhancements if the preset has any
      if (presetData.enhancements.length > 0) {
        log.info('')
        log.info(pc.bold('Applying enhancements...'))

        // Build project context for enhancement execution
        const ctx = await buildProjectContext({
          rootDir: process.cwd(),
          freshScaffold: false,
          verbose: false,
        })

        // Resolve enhancement IDs to modules
        const modules: EnhancementModule[] = []
        const unknownEnhancements: string[] = []
        for (const enhId of presetData.enhancements) {
          const mod = enhancementRegistry.get(enhId)
          if (mod) {
            modules.push(mod)
          }
          else {
            unknownEnhancements.push(enhId)
          }
        }

        // Warn about unknown enhancements (may be from a newer version)
        if (unknownEnhancements.length > 0) {
          log.warn(pc.yellow(`Unknown enhancements (skipped): ${unknownEnhancements.join(', ')}`))
        }

        if (modules.length > 0) {
          const summary = await runEnhancements({
            modules,
            context: ctx,
            interactive: !isCI,
            onConflict: async (_moduleId, _filePath, diff): Promise<ConflictAction> => {
              if (isCI)
                return 'skip'
              console.log(diff)
              const action = await select({
                message: 'Config file already exists. What would you like to do?',
                options: [
                  { value: 'replace', label: 'Accept', hint: 'Apply the new config' },
                  { value: 'skip', label: 'Skip', hint: 'Keep existing config' },
                ],
              })
              if (isCancel(action)) {
                cancel('Cancelled.')
                process.exit(0)
              }
              return action as ConflictAction
            },
            onDependencyApproval: async (_moduleId, deps): Promise<boolean> => {
              if (isCI)
                return true
              const result = await confirm({
                message: `Missing dependencies: ${deps.join(', ')}. Continue anyway?`,
              })
              if (isCancel(result)) {
                cancel('Cancelled.')
                process.exit(0)
              }
              return result as boolean
            },
          })

          // Show per-enhancement summary cards
          for (const installedId of summary.installed) {
            const mod = enhancementRegistry.get(installedId)
            if (!mod)
              continue
            const result = summary.results.get(installedId) ?? {
              success: true,
              filesModified: [],
              packagesAdded: [],
              warnings: [],
            }
            const nextSteps = ENHANCEMENT_NEXT_STEPS[installedId] ?? []
            showPerEnhancementSummary({
              moduleId: installedId,
              moduleName: mod.name,
              result,
              nextSteps,
            })
          }

          // Show overall summary
          showEnhancementSummary(summary)
        }
      }

      log.success(`Preset "${name}" applied.`)
    })
    .addHelpText('after', `
Examples:
  $ ${programName} preset use my-stack        Apply a saved preset
  $ ${programName} preset use team-defaults   Apply an npm-published preset`)

  // --- preset list ---
  preset
    .command('list')
    .description('Show available presets (local + npm)')
    .action(async () => {
      // JSON mode (CLI-14): emit one validated envelope and return early
      // (D-12 — no clack log output runs in this branch).
      if (isJsonMode()) {
        const data = await buildPresetListPayload()
        const envelope = PresetListEnvelopeV1Schema.parse({ schemaVersion: 1, command: 'preset.list', data })
        emitJson(envelope)
        return
      }

      const locals = await listPresets()
      const npms = await discoverNpmPresets(process.cwd())

      log.info(pc.bold('Local presets:'))
      if (locals.length > 0) {
        for (const name of locals) {
          const data = await loadPreset(name)
          const desc = data?.description ? ` — ${data.description}` : ''
          log.info(`  ${name}${desc}`)
        }
      }
      else {
        log.info('  (none)')
      }

      log.info(pc.bold('npm presets:'))
      if (npms.length > 0) {
        for (const pkg of npms) {
          log.info(`  ${pkg}`)
        }
      }
      else {
        log.info('  (none)')
      }
    })
    .addHelpText('after', `
Examples:
  $ ${programName} preset list                Show all local and npm presets
  $ ${programName} preset list | grep team    Filter presets to find team conventions quickly`)

  // --- preset show <name> ---
  preset
    .command('show <name>')
    .description('Show full preset details (scaffold, enhancements, config)')
    .action(async (name: string) => {
      // Validate the name BEFORE any filesystem lookup — prevents path
      // traversal via crafted names (threat T-33-10 mitigation).
      assertValidPresetName(name)

      // Try local first, then fall back to npm. `getPresetsDir()` from
      // @tinkerise/core owns the directory location — no hardcoded path.
      let presetData = await loadPreset(name)
      let source: 'local' | 'npm' = 'local'
      let filePath: string | undefined

      if (presetData) {
        filePath = path.join(getPresetsDir(), `${name}.json`)
      }
      else {
        presetData = await loadNpmPreset(`tinkerise-preset-${name}`)
        source = 'npm'
      }

      if (!presetData) {
        throw new PresetNotFoundError(name) // D-08 -> handleError JSON envelope
      }

      if (isJsonMode()) {
        const data = {
          name: presetData.name,
          ...(presetData.description ? { description: presetData.description } : {}),
          source,
          ...(source === 'local' && filePath ? { filePath } : {}),
          scaffold: {
            framework: presetData.scaffold.framework,
            category: presetData.scaffold.category,
            flags: presetData.scaffold.flags,
          },
          enhancements: presetData.enhancements,
          config: presetData.config ?? {},
        }
        const envelope = PresetShowEnvelopeV1Schema.parse({ schemaVersion: 1, command: 'preset.show', data })
        emitJson(envelope)
        return
      }

      // Human path — routes through the clack-output wrapper (D-13).
      log.info(pc.bold(`Preset: ${presetData.name}`))
      if (presetData.description) {
        log.info(`  ${presetData.description}`)
      }
      log.info(`  source: ${source}`)
      if (filePath) {
        log.info(`  path: ${filePath}`)
      }
      log.info(`  framework: ${presetData.scaffold.framework} (${presetData.scaffold.category})`)
      if (presetData.enhancements.length > 0) {
        log.info(`  enhancements: ${presetData.enhancements.join(', ')}`)
      }
      if (Object.keys(presetData.config).length > 0) {
        log.info(`  config: ${JSON.stringify(presetData.config)}`)
      }
    })
    .addHelpText('after', `
Examples:
  $ ${programName} preset show team-defaults             Show full details for a local preset
  $ ${programName} preset show team-defaults --json      Same, machine-readable`)

  // --- preset delete <name> ---
  preset
    .command('delete <name>')
    .description('Remove a local preset')
    .action(async (name: string) => {
      assertValidPresetName(name)

      const deleted = await deletePreset(name)

      if (deleted) {
        log.success(`Preset "${name}" deleted.`)
      }
      else {
        throw new PresetNotFoundError(name)
      }
    })
    .addHelpText('after', `
Examples:
  $ ${programName} preset delete my-stack     Remove a local preset
  $ ${programName} preset list                Recover from preset-not-found by discovering available names`)
}
