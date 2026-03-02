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
import * as p from '@clack/prompts'
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
import { PresetNameSchema } from '@tinkerise/shared'
import pc from 'picocolors'

const PRESET_NAME_VALID_VALUES = 'lowercase letters, numbers, hyphens, dots, underscores; max 64 chars'

function assertValidPresetName(name: string): void {
  if (!PresetNameSchema.safeParse(name).success) {
    throw new ConfigValidationError('presetName', name, PRESET_NAME_VALID_VALUES)
  }
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
        const result = await p.text({
          message: 'Framework/scaffolder ID (e.g., next, vite, astro):',
          validate: v => (!v || v.length === 0 ? 'Framework is required' : undefined),
        })
        if (p.isCancel(result)) {
          p.cancel('Cancelled.')
          process.exit(0)
        }
        framework = result
      }

      if (!category) {
        const result = await p.select({
          message: 'Scaffolder category:',
          options: [
            { value: 'web', label: 'web' },
            { value: 'backend', label: 'backend' },
            { value: 'mobile', label: 'mobile' },
          ],
        })
        if (p.isCancel(result)) {
          p.cancel('Cancelled.')
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
      p.log.success(`Preset "${name}" saved to ${presetsDir}/${name}.json`)
      if (installedEnhancements.length > 0) {
        p.log.info(`  Enhancements: ${installedEnhancements.join(', ')}`)
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
      p.log.info(`Applying preset "${presetData.name}"${presetData.description ? ` — ${presetData.description}` : ''}`)
      p.log.info(`  Framework: ${presetData.scaffold.framework} (${presetData.scaffold.category})`)
      if (presetData.enhancements.length > 0) {
        p.log.info(`  Enhancements: ${presetData.enhancements.join(', ')}`)
      }
      if (Object.keys(presetData.config).length > 0) {
        p.log.info(`  Config: ${JSON.stringify(presetData.config)}`)
      }

      // Apply enhancements if the preset has any
      if (presetData.enhancements.length > 0) {
        p.log.info('')
        p.log.info(pc.bold('Applying enhancements...'))

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
          p.log.warn(pc.yellow(`Unknown enhancements (skipped): ${unknownEnhancements.join(', ')}`))
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
              const action = await p.select({
                message: 'Config file already exists. What would you like to do?',
                options: [
                  { value: 'replace', label: 'Accept', hint: 'Apply the new config' },
                  { value: 'skip', label: 'Skip', hint: 'Keep existing config' },
                ],
              })
              if (p.isCancel(action)) {
                p.cancel('Cancelled.')
                process.exit(0)
              }
              return action as ConflictAction
            },
            onDependencyApproval: async (_moduleId, deps): Promise<boolean> => {
              if (isCI)
                return true
              const result = await p.confirm({
                message: `Missing dependencies: ${deps.join(', ')}. Continue anyway?`,
              })
              if (p.isCancel(result)) {
                p.cancel('Cancelled.')
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

      p.log.success(`Preset "${name}" applied.`)
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
      const locals = await listPresets()
      const npms = await discoverNpmPresets(process.cwd())

      p.log.info(pc.bold('Local presets:'))
      if (locals.length > 0) {
        for (const name of locals) {
          const data = await loadPreset(name)
          const desc = data?.description ? ` — ${data.description}` : ''
          p.log.info(`  ${name}${desc}`)
        }
      }
      else {
        p.log.info('  (none)')
      }

      p.log.info(pc.bold('npm presets:'))
      if (npms.length > 0) {
        for (const pkg of npms) {
          p.log.info(`  ${pkg}`)
        }
      }
      else {
        p.log.info('  (none)')
      }
    })
    .addHelpText('after', `
Examples:
  $ ${programName} preset list                Show all local and npm presets
  $ ${programName} preset list | grep team    Filter presets to find team conventions quickly`)

  // --- preset delete <name> ---
  preset
    .command('delete <name>')
    .description('Remove a local preset')
    .action(async (name: string) => {
      assertValidPresetName(name)

      const deleted = await deletePreset(name)

      if (deleted) {
        p.log.success(`Preset "${name}" deleted.`)
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
