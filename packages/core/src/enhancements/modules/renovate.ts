/**
 * Renovate enhancement module.
 *
 * Generates a renovate.json with config:recommended preset for
 * automated dependency updates via Renovate.
 *
 * Config-only module — no packages to install.
 */

import type { ProjectContext } from '../types.js'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { writeConfigFile } from './_utils.js'

/** Renovate config file patterns to check */
const RENOVATE_CONFIG_FILES = [
  'renovate.json',
  'renovate.json5',
  '.renovaterc',
  '.renovaterc.json',
  '.github/renovate.json',
  '.github/renovate.json5',
]

export const renovateModule = defineEnhancement({
  id: 'renovate',
  name: 'Renovate',
  description: 'Automated dependency updates via Renovate',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    for (const file of RENOVATE_CONFIG_FILES) {
      try {
        await access(join(ctx.rootDir, file))
        configFiles.push(join(ctx.rootDir, file))
      }
      catch {
        // File doesn't exist
      }
    }

    // Also check for renovate key in package.json
    if ('renovate' in ctx.packageJson) {
      configFiles.push(join(ctx.rootDir, 'package.json'))
    }

    return {
      installed: configFiles.length > 0,
      configFiles,
      partial: false,
    }
  },

  async install(ctx: ProjectContext) {
    const config = JSON.stringify(
      {
        $schema: 'https://docs.renovatebot.com/renovate-schema.json',
        extends: ['config:recommended'],
      },
      null,
      2,
    )

    const configPath = await writeConfigFile(
      ctx.rootDir,
      'renovate.json',
      `${config}\n`,
    )

    return {
      success: true,
      filesModified: [configPath],
      packagesAdded: [],
      warnings: [],
    }
  },
})
