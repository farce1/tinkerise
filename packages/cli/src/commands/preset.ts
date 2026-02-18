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

import type { Command } from 'commander'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import type { PresetData, TinkeriseUserConfig } from '@tinkerise/shared'
import {
  savePreset,
  loadPreset,
  listPresets,
  deletePreset,
  discoverNpmPresets,
  loadNpmPreset,
  loadProjectConfig,
  getPresetsDir,
} from '@tinkerise/core'

/**
 * Registers the `preset` command group on the given Commander program.
 */
export function registerPresetCommand(program: Command): void {
  const preset = program
    .command('preset')
    .summary('Manage configuration presets')
    .description('Save, apply, list, and delete reusable configuration presets.')

  // --- preset save <name> ---
  preset
    .command('save <name>')
    .description('Save current config as a named preset')
    .option('--description <desc>', 'Description of what this preset does')
    .option('--framework <fw>', 'Framework/scaffolder ID (e.g., next, vite)')
    .option('--category <cat>', 'Scaffolder category (web, backend, mobile)')
    .action(async (name: string, options: { description?: string; framework?: string; category?: string }) => {
      // Read project config for config overrides
      const projectConfig = await loadProjectConfig(process.cwd())
      const config: Partial<TinkeriseUserConfig> = projectConfig ?? {}

      // Determine framework and category from flags or prompt
      let framework = options.framework
      let category = options.category

      if (!framework) {
        const result = await p.text({
          message: 'Framework/scaffolder ID (e.g., next, vite, astro):',
          validate: (v) => (!v || v.length === 0 ? 'Framework is required' : undefined),
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

      const presetData: PresetData = {
        version: 1,
        name,
        description: options.description,
        scaffold: {
          framework,
          category,
          flags: {},
        },
        enhancements: [],
        config,
      }

      await savePreset(presetData)

      const presetsDir = getPresetsDir()
      p.log.success(`Preset "${name}" saved to ${presetsDir}/${name}.json`)
    })

  // --- preset use <name> ---
  preset
    .command('use <name>')
    .description('Apply a saved preset')
    .action(async (name: string) => {
      // Try local first
      let presetData = await loadPreset(name)

      // Try npm if not found locally
      if (!presetData) {
        presetData = await loadNpmPreset('tinkerise-preset-' + name)
      }

      if (!presetData) {
        // Show available presets for guidance
        const locals = await listPresets()
        const npms = await discoverNpmPresets(process.cwd())
        const available = [...locals, ...npms]

        p.log.error(pc.red(`Preset "${name}" not found.`))
        if (available.length > 0) {
          p.log.info(`Available presets: ${available.join(', ')}`)
        } else {
          p.log.info('No presets available. Create one with: tinkerise preset save <name>')
        }
        process.exit(1)
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

      p.log.success(`Preset "${name}" applied. Use --preset ${name} with scaffold commands to include in config resolution.`)
    })

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
      } else {
        p.log.info('  (none)')
      }

      p.log.info(pc.bold('npm presets:'))
      if (npms.length > 0) {
        for (const pkg of npms) {
          p.log.info(`  ${pkg}`)
        }
      } else {
        p.log.info('  (none)')
      }
    })

  // --- preset delete <name> ---
  preset
    .command('delete <name>')
    .description('Remove a local preset')
    .action(async (name: string) => {
      const deleted = await deletePreset(name)

      if (deleted) {
        p.log.success(`Preset "${name}" deleted.`)
      } else {
        p.log.error(pc.red(`Preset "${name}" not found.`))
      }
    })
}
