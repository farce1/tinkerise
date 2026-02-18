/**
 * Testing (Vitest) enhancement module.
 *
 * Generates vitest.config.ts and adds test scripts to package.json.
 * Always uses Vitest regardless of framework (per locked decision).
 * Config only — does NOT generate example test files.
 */

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { dependencyVersionMap } from '../version-map.js'
import type { ProjectContext } from '../types.js'
import { installPackages, writeConfigFile, addScript } from './_utils.js'

/** Test config file patterns to check */
const VITEST_CONFIG_FILES = [
  'vitest.config.ts',
  'vitest.config.js',
  'vitest.config.mts',
  'vitest.config.mjs',
]

const JEST_CONFIG_FILES = [
  'jest.config.js',
  'jest.config.ts',
  'jest.config.mjs',
  'jest.config.cjs',
]

export const testingModule = defineEnhancement({
  id: 'testing',
  name: 'Vitest',
  description: 'Test runner configuration with Vitest',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    // Check for vitest config files
    for (const file of VITEST_CONFIG_FILES) {
      try {
        await access(join(ctx.rootDir, file))
        configFiles.push(join(ctx.rootDir, file))
      }
      catch {
        // File doesn't exist
      }
    }

    // Check for jest config files
    for (const file of JEST_CONFIG_FILES) {
      try {
        await access(join(ctx.rootDir, file))
        configFiles.push(join(ctx.rootDir, file))
      }
      catch {
        // File doesn't exist
      }
    }

    // Check for vitest or jest in installed deps
    const hasVitest = 'vitest' in ctx.installedDeps
    const hasJest = 'jest' in ctx.installedDeps

    return {
      installed: configFiles.length > 0 || hasVitest || hasJest,
      configFiles,
      partial: false,
    }
  },

  async install(ctx: ProjectContext) {
    const filesModified: string[] = []

    // Step 1: Install vitest
    const version = dependencyVersionMap['vitest']
    const versionedPackages = [`vitest@${version}`]

    await installPackages(versionedPackages, {
      cwd: ctx.rootDir,
      packageManager: ctx.packageManager,
      verbose: ctx.verbose,
    })

    // Step 2: Generate vitest.config.ts
    const configContent = `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
})
`
    const configPath = await writeConfigFile(ctx.rootDir, 'vitest.config.ts', configContent)
    filesModified.push(configPath)

    // Step 3: Add test scripts to package.json
    await addScript(ctx.rootDir, 'test', 'vitest')
    await addScript(ctx.rootDir, 'test:run', 'vitest run')

    // Step 4: No example test files (per locked decision)

    return {
      success: true,
      filesModified,
      packagesAdded: versionedPackages,
      warnings: [],
    }
  },
})
