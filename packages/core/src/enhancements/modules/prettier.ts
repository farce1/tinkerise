/**
 * Prettier enhancement module.
 *
 * Installs Prettier with pure defaults (no config file) unless
 * Tailwind is detected, in which case it creates a .prettierrc
 * with the Tailwind plugin.
 */

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { dependencyVersionMap } from '../version-map.js'
import type { ProjectContext } from '../types.js'
import { installPackages, writeConfigFile, addScript } from './_utils.js'

/** Prettier config file patterns to check */
const CONFIG_FILES = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
  '.prettierrc.toml',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
]

export const prettierModule = defineEnhancement({
  id: 'prettier',
  name: 'Prettier',
  description: 'Code formatting with Tailwind plugin auto-detection',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    for (const file of CONFIG_FILES) {
      try {
        await access(join(ctx.rootDir, file))
        configFiles.push(join(ctx.rootDir, file))
      }
      catch {
        // File doesn't exist
      }
    }

    const hasPackageJsonConfig = !!ctx.packageJson['prettier']
    const hasDep = 'prettier' in ctx.installedDeps

    return {
      installed: configFiles.length > 0 || hasPackageJsonConfig || hasDep,
      configFiles,
      partial: hasDep && configFiles.length === 0 && !hasPackageJsonConfig,
    }
  },

  async install(ctx: ProjectContext) {
    const hasTailwind = 'tailwindcss' in ctx.installedDeps
    const filesModified: string[] = []

    // Step 1: Build packages list
    const packages = ['prettier']
    if (hasTailwind) packages.push('prettier-plugin-tailwindcss')

    // Version from dependencyVersionMap
    const versionedPackages = packages.map((pkg) => {
      const version = dependencyVersionMap[pkg as keyof typeof dependencyVersionMap]
      return version ? `${pkg}@${version}` : pkg
    })

    // Step 2: Install packages
    await installPackages(versionedPackages, {
      cwd: ctx.rootDir,
      packageManager: ctx.packageManager,
      verbose: ctx.verbose,
    })

    // Step 3: Config file — only if Tailwind detected
    if (hasTailwind) {
      const configContent = JSON.stringify(
        { plugins: ['prettier-plugin-tailwindcss'] },
        null,
        2,
      ) + '\n'
      const configPath = await writeConfigFile(ctx.rootDir, '.prettierrc', configContent)
      filesModified.push(configPath)
    }

    // Step 4: Add scripts
    await addScript(ctx.rootDir, 'format', 'prettier --write .')
    await addScript(ctx.rootDir, 'format:check', 'prettier --check .')

    return {
      success: true,
      filesModified,
      packagesAdded: versionedPackages,
      warnings: [],
    }
  },
})
