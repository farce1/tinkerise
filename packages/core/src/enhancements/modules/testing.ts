/**
 * Testing (Vitest) enhancement module.
 *
 * Generates vitest.config.ts, adds test scripts to package.json,
 * and creates example test files (tests/sum.ts + tests/sum.test.ts)
 * so users see tests working immediately.
 * Always uses Vitest regardless of framework (per locked decision).
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

    // Step 4: Generate example source file
    const sumContent = `/**
 * Adds two numbers together.
 *
 * @example
 * \`\`\`ts
 * sum(1, 2) // 3
 * \`\`\`
 */
export function sum(a: number, b: number): number {
  return a + b
}
`
    const sumPath = await writeConfigFile(ctx.rootDir, 'tests/sum.ts', sumContent)
    filesModified.push(sumPath)

    // Step 5: Generate example test file
    const testContent = `import { describe, expect, it } from 'vitest'
import { sum } from './sum'

describe('sum', () => {
  it('adds two positive numbers', () => {
    expect(sum(1, 2)).toBe(3)
  })

  it('handles zero', () => {
    expect(sum(0, 5)).toBe(5)
  })

  it('handles negative numbers', () => {
    expect(sum(-1, -2)).toBe(-3)
  })
})
`
    const testPath = await writeConfigFile(ctx.rootDir, 'tests/sum.test.ts', testContent)
    filesModified.push(testPath)

    return {
      success: true,
      filesModified,
      packagesAdded: versionedPackages,
      warnings: [],
    }
  },
})
