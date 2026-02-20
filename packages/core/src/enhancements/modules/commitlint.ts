/**
 * Commitlint enhancement module.
 *
 * Installs @commitlint/cli + @commitlint/config-conventional and
 * generates commitlint.config.js. Integrates with husky if the
 * .husky directory already exists (adds commit-msg hook), otherwise
 * warns the user to install husky first.
 */

import type { ProjectContext } from '../types.js'
import { access, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { dependencyVersionMap } from '../version-map.js'
import { installPackages, readPackageJson, writeConfigFile } from './_utils.js'

/** Commitlint config file patterns to check */
const CONFIG_FILES = [
  'commitlint.config.js',
  'commitlint.config.mjs',
  'commitlint.config.cjs',
  'commitlint.config.ts',
  '.commitlintrc',
  '.commitlintrc.json',
  '.commitlintrc.yaml',
  '.commitlintrc.yml',
  '.commitlintrc.js',
]

export const commitlintModule = defineEnhancement({
  id: 'commitlint',
  name: 'Commitlint',
  description: 'Conventional commit message enforcement with config-conventional',
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

    // Check for commitlint key in package.json
    const hasPackageJsonConfig = !!ctx.packageJson.commitlint

    return {
      installed: configFiles.length > 0 || hasPackageJsonConfig,
      configFiles,
      partial: false,
    }
  },

  async install(ctx: ProjectContext) {
    const filesModified: string[] = []
    const warnings: string[] = []

    // Step 1: Install packages
    const packages = ['@commitlint/cli', '@commitlint/config-conventional']
    const versionedPackages = packages.map((pkg) => {
      const version = dependencyVersionMap[pkg as keyof typeof dependencyVersionMap]
      return version ? `${pkg}@${version}` : pkg
    })

    await installPackages(versionedPackages, {
      cwd: ctx.rootDir,
      packageManager: ctx.packageManager,
      verbose: ctx.verbose,
    })

    // Step 2: Determine config file extension
    // Use .js for type:module packages (ESM default export), .mjs otherwise
    const pkg = await readPackageJson(ctx.rootDir)
    const isModule = pkg.type === 'module'
    const configFilename = isModule ? 'commitlint.config.js' : 'commitlint.config.mjs'

    const configContent = `export default { extends: ['@commitlint/config-conventional'] };\n`
    const configPath = await writeConfigFile(ctx.rootDir, configFilename, configContent)
    filesModified.push(configPath)

    // Step 3: Husky integration — only if .husky directory already exists
    let huskyPresent = false
    try {
      await access(join(ctx.rootDir, '.husky'))
      huskyPresent = true
    }
    catch {
      // .husky directory doesn't exist
    }

    if (huskyPresent) {
      const commitMsgPath = join(ctx.rootDir, '.husky', 'commit-msg')
      await writeFile(commitMsgPath, 'npx --no -- commitlint --edit $1\n', 'utf-8')
      filesModified.push(commitMsgPath)
    }
    else {
      warnings.push('Add husky (`tinkerise add husky`) to enable git hook enforcement')
    }

    return {
      success: true,
      filesModified,
      packagesAdded: versionedPackages,
      warnings,
    }
  },
})
