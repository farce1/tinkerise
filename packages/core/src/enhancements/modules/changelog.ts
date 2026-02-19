/**
 * Changelog enhancement module.
 *
 * Installs conventional-changelog-cli and generates a .changelogrc.json
 * configuration file. Adds changelog and release scripts to package.json.
 * Cross-references commitlint — if not detected, adds a hint to consider
 * installing it for commit message enforcement.
 */

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { dependencyVersionMap } from '../version-map.js'
import type { ProjectContext } from '../types.js'
import { installPackages, writeConfigFile, addScript, readPackageJson } from './_utils.js'

/** Changelog config file patterns to check */
const CONFIG_FILES = [
  '.changelogrc',
  '.changelogrc.json',
  '.changelogrc.js',
  'changelog.config.js',
  'changelog.config.mjs',
  '.versionrc',
  '.versionrc.json',
]

/** Commitlint config files to check for cross-reference hint */
const COMMITLINT_CONFIG_FILES = [
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

export const changelogModule = defineEnhancement({
  id: 'changelog',
  name: 'Changelog',
  description: 'Automated changelog generation with conventional-changelog',
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

    // Check for conventional-changelog-cli or standard-version in installed deps
    const hasConventionalChangelog = 'conventional-changelog-cli' in ctx.installedDeps
    const hasStandardVersion = 'standard-version' in ctx.installedDeps

    return {
      installed: configFiles.length > 0 || hasConventionalChangelog || hasStandardVersion,
      configFiles,
      partial: false,
    }
  },

  async install(ctx: ProjectContext) {
    const filesModified: string[] = []
    const warnings: string[] = []

    // Step 1: Install conventional-changelog-cli
    const version = dependencyVersionMap['conventional-changelog-cli']
    const versionedPackages = [`conventional-changelog-cli@${version}`]

    await installPackages(versionedPackages, {
      cwd: ctx.rootDir,
      packageManager: ctx.packageManager,
      verbose: ctx.verbose,
    })

    // Step 2: Generate .changelogrc.json config
    const configContent = JSON.stringify({
      preset: {
        name: 'conventionalcommits',
        types: [
          { type: 'feat', section: 'Features' },
          { type: 'fix', section: 'Bug Fixes' },
          { type: 'perf', section: 'Performance' },
          { type: 'refactor', section: 'Refactoring' },
          { type: 'docs', section: 'Documentation' },
          { type: 'chore', hidden: true },
          { type: 'test', hidden: true },
          { type: 'ci', hidden: true },
        ],
      },
    }, null, 2) + '\n'

    const configPath = await writeConfigFile(ctx.rootDir, '.changelogrc.json', configContent)
    filesModified.push(configPath)

    // Step 3: Add changelog scripts to package.json
    await addScript(ctx.rootDir, 'changelog', 'conventional-changelog -p conventionalcommits -i CHANGELOG.md -s')
    await addScript(ctx.rootDir, 'release', 'conventional-changelog -p conventionalcommits -i CHANGELOG.md -s -r 0')

    // Step 4: Cross-reference — hint about commitlint if not detected
    let commitlintDetected = false

    for (const file of COMMITLINT_CONFIG_FILES) {
      try {
        await access(join(ctx.rootDir, file))
        commitlintDetected = true
        break
      }
      catch {
        // File doesn't exist
      }
    }

    // Also check for commitlint key in package.json
    if (!commitlintDetected) {
      const pkg = await readPackageJson(ctx.rootDir)
      if (pkg['commitlint']) {
        commitlintDetected = true
      }
    }

    if (!commitlintDetected) {
      warnings.push('Consider adding commitlint (tinkerise add commitlint) for commit message enforcement')
    }

    return {
      success: true,
      filesModified,
      packagesAdded: versionedPackages,
      warnings,
    }
  },
})
