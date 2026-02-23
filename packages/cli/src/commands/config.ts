/**
 * `tinkerise config` command — manage configuration values.
 *
 * Subcommands:
 * - `config list`           — show all current config values
 * - `config get <key>`      — read a specific config value
 * - `config set <key> <value>` — persist a config value
 * - `config init`           — interactively create configuration
 *
 * All subcommands default to global scope (~/.config/tinkerise/config.json).
 * Pass `--project` to target the project-level tinkerise.config.ts instead.
 */

import type { TinkeriseUserConfig } from '@tinkerise/shared'
import type { Command } from 'commander'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as p from '@clack/prompts'
import {
  CONFIG_FILENAME,
  ConfigValidationError,
  getConfigPath,
  getGlobalConfigValue,
  InvalidConfigKeyError,
  loadGlobalConfig,
  loadProjectConfig,
  saveGlobalConfig,
  setGlobalConfigValue,
} from '@tinkerise/core'

/** The three valid config keys. */
const VALID_KEYS = ['packageManager', 'typescript', 'defaultCategory'] as const
type ConfigKey = (typeof VALID_KEYS)[number]

/** Valid values for packageManager. */
const VALID_PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const

/** Valid values for defaultCategory. */
const VALID_CATEGORIES = ['web', 'backend', 'mobile'] as const

/**
 * Check whether a string is a valid config key.
 */
function isValidKey(key: string): key is ConfigKey {
  return (VALID_KEYS as readonly string[]).includes(key)
}

/**
 * Generates a tinkerise.config.ts file string from a partial config.
 * Only includes keys that have defined values.
 */
export function generateProjectConfig(config: Partial<TinkeriseUserConfig>): string {
  const lines: string[] = [
    `import { defineConfig } from '@tinkerise/shared'`,
    '',
    'export default defineConfig({',
  ]

  if (config.packageManager !== undefined) {
    lines.push(`  packageManager: '${config.packageManager}',`)
  }
  if (config.typescript !== undefined) {
    lines.push(`  typescript: ${config.typescript},`)
  }
  if (config.defaultCategory !== undefined) {
    lines.push(`  defaultCategory: '${config.defaultCategory}',`)
  }

  lines.push('})')
  lines.push('')

  return lines.join('\n')
}

/**
 * Register the `config` command group on a Commander program.
 */
export function registerConfigCommand(program: Command): void {
  const name = program.name()

  const configCmd = program
    .command('config')
    .summary('Manage tinkerise configuration')
    .description('Get, set, list, or initialize tinkerise configuration values. Defaults to global scope; use --project for project-level config.')
    .addHelpText('after', `
Examples:
  $ ${name} config list                     Show all current configuration values
  $ ${name} config set packageManager pnpm  Set and persist a default package manager`)

  // --- config list ---
  configCmd
    .command('list')
    .description('Show current configuration values')
    .option('--project', 'Show project config instead of global')
    .action(async (opts: { project?: boolean }) => {
      if (opts.project) {
        const projectDir = process.cwd()
        const configPath = resolve(projectDir, CONFIG_FILENAME)
        p.log.info(`Project config: ${configPath}`)
        const config = await loadProjectConfig(projectDir)
        if (!config) {
          p.log.info('No project config found.')
          return
        }
        for (const key of VALID_KEYS) {
          const value = config[key]
          p.log.info(`${key}: ${value !== undefined ? String(value) : '(not set)'}`)
        }
      }
      else {
        const configPath = getConfigPath()
        p.log.info(`Global config: ${configPath}`)
        const config = await loadGlobalConfig()
        if (!config) {
          p.log.info('No global config found. Run "tinkerise config init" to create one.')
          return
        }
        for (const key of VALID_KEYS) {
          const value = config[key]
          p.log.info(`${key}: ${value !== undefined ? String(value) : '(not set)'}`)
        }
      }
    })
    .addHelpText('after', `
Examples:
  $ ${name} config list                Show global configuration
  $ ${name} config list --project      Show project configuration`)

  // --- config get <key> ---
  configCmd
    .command('get <key>')
    .description('Read a specific configuration value')
    .option('--project', 'Read from project config instead of global')
    .action(async (key: string, opts: { project?: boolean }) => {
      if (!isValidKey(key)) {
        throw new InvalidConfigKeyError(key)
      }

      if (opts.project) {
        const config = await loadProjectConfig(process.cwd())
        const value = config?.[key]
        p.log.info(value !== undefined ? String(value) : '(not set)')
      }
      else {
        const value = await getGlobalConfigValue(key)
        p.log.info(value !== undefined ? String(value) : '(not set)')
      }
    })
    .addHelpText('after', `
Examples:
  $ ${name} config get packageManager  Get package manager setting
  $ ${name} config get typescript      Get TypeScript default
  $ ${name} config list                Recover from invalid key by listing valid keys first`)

  // --- config set <key> <value> ---
  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .option('--project', 'Set in project config instead of global')
    .action(async (key: string, value: string, opts: { project?: boolean }) => {
      if (!isValidKey(key)) {
        throw new InvalidConfigKeyError(key)
      }

      // Validate and coerce value based on key
      let coerced: string | boolean

      if (key === 'packageManager') {
        if (!(VALID_PACKAGE_MANAGERS as readonly string[]).includes(value)) {
          throw new ConfigValidationError('packageManager', value, VALID_PACKAGE_MANAGERS.join(', '))
        }
        coerced = value
      }
      else if (key === 'typescript') {
        if (value !== 'true' && value !== 'false') {
          throw new ConfigValidationError('typescript', value, 'true, false')
        }
        coerced = value === 'true'
      }
      else {
        // defaultCategory
        if (!(VALID_CATEGORIES as readonly string[]).includes(value)) {
          throw new ConfigValidationError('defaultCategory', value, VALID_CATEGORIES.join(', '))
        }
        coerced = value
      }

      if (opts.project) {
        // Read existing project config, update key, write back
        const projectDir = process.cwd()
        const configPath = resolve(projectDir, CONFIG_FILENAME)
        const existing = (await loadProjectConfig(projectDir)) ?? {}
        const updated = { ...existing, [key]: coerced }
        const content = generateProjectConfig(updated)
        await writeFile(configPath, content, 'utf-8')
        p.log.success(`Set ${key} = ${String(coerced)} in ${configPath}`)
      }
      else {
        await setGlobalConfigValue(key, coerced as TinkeriseUserConfig[ConfigKey])
        p.log.success(`Set ${key} = ${String(coerced)}`)
      }
    })
    .addHelpText('after', `
Examples:
  $ ${name} config set packageManager pnpm   Set default package manager
  $ ${name} config set typescript true       Enable TypeScript by default
  $ ${name} config set defaultCategory web   Set default category
  $ ${name} config list                       Verify updated values after setting`)

  // --- config init ---
  configCmd
    .command('init')
    .description('Interactively create configuration')
    .option('--project', 'Create project config (tinkerise.config.ts) instead of global')
    .action(async (opts: { project?: boolean }) => {
      const config: Partial<TinkeriseUserConfig> = {}

      // 1. packageManager
      const pm = await p.select({
        message: 'Default package manager?',
        options: [
          { value: 'skip', label: 'Skip' },
          { value: 'npm', label: 'npm' },
          { value: 'pnpm', label: 'pnpm' },
          { value: 'yarn', label: 'yarn' },
          { value: 'bun', label: 'bun' },
        ],
      })
      if (p.isCancel(pm)) {
        p.cancel('Config init cancelled.')
        process.exit(0)
      }
      if (pm !== 'skip') {
        config.packageManager = pm as TinkeriseUserConfig['packageManager']
      }

      // 2. typescript
      const ts = await p.confirm({
        message: 'Default to TypeScript?',
      })
      if (p.isCancel(ts)) {
        p.cancel('Config init cancelled.')
        process.exit(0)
      }
      config.typescript = ts

      // 3. defaultCategory
      const cat = await p.select({
        message: 'Default project category?',
        options: [
          { value: 'skip', label: 'Skip' },
          { value: 'web', label: 'web' },
          { value: 'backend', label: 'backend' },
          { value: 'mobile', label: 'mobile' },
        ],
      })
      if (p.isCancel(cat)) {
        p.cancel('Config init cancelled.')
        process.exit(0)
      }
      if (cat !== 'skip') {
        config.defaultCategory = cat as TinkeriseUserConfig['defaultCategory']
      }

      if (opts.project) {
        const projectDir = process.cwd()
        const configPath = resolve(projectDir, CONFIG_FILENAME)

        // Check for existing file per research pitfall #4
        let existingConfig: Partial<TinkeriseUserConfig> | null = null
        try {
          await readFile(configPath, 'utf-8')
          existingConfig = await loadProjectConfig(projectDir)
        }
        catch {
          // File doesn't exist, that's fine
        }

        if (existingConfig) {
          p.log.info('Existing project config found:')
          for (const key of VALID_KEYS) {
            const val = existingConfig[key]
            if (val !== undefined) {
              p.log.info(`  ${key}: ${String(val)}`)
            }
          }

          const overwrite = await p.confirm({
            message: 'Overwrite existing project config?',
          })
          if (p.isCancel(overwrite) || !overwrite) {
            p.cancel('Config init cancelled.')
            process.exit(0)
          }
        }

        const content = generateProjectConfig(config)
        await writeFile(configPath, content, 'utf-8')
        p.log.success(`Created ${configPath}`)
      }
      else {
        await saveGlobalConfig(config)
        p.log.success(`Global config saved to ${getConfigPath()}`)
      }
    })
    .addHelpText('after', `
Examples:
  $ ${name} config init                Interactive global config setup
  $ ${name} config init --project      Create project-level config`)
}
