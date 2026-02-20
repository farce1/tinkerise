/**
 * Husky + lint-staged enhancement module.
 *
 * Creates pre-commit hooks that run lint-staged with adaptive
 * configuration based on installed tools (ESLint, Prettier).
 * Guards against missing .git directory.
 */

import type { ProjectContext } from '../types.js'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { dependencyVersionMap } from '../version-map.js'
import { addScript, installPackages, readPackageJson } from './_utils.js'

export const huskyModule = defineEnhancement({
  id: 'husky',
  name: 'Husky + lint-staged',
  description: 'Pre-commit hooks for linting and formatting staged files',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    // Check for .husky directory
    let huskyDirExists = false
    try {
      await access(join(ctx.rootDir, '.husky'))
      huskyDirExists = true
      configFiles.push(join(ctx.rootDir, '.husky'))
    }
    catch {
      // Directory doesn't exist
    }

    const hasDep = 'husky' in ctx.installedDeps

    // Check for prepare script containing husky
    const scripts = (ctx.packageJson.scripts ?? {}) as Record<string, string>
    const hasPrepareScript = scripts.prepare?.includes('husky') ?? false

    return {
      installed: huskyDirExists || hasDep,
      configFiles,
      partial: false,
      description: hasPrepareScript ? 'Husky prepare script found' : undefined,
    }
  },

  async install(ctx: ProjectContext) {
    // Step 0: Check for .git directory
    try {
      await access(join(ctx.rootDir, '.git'))
    }
    catch {
      return {
        success: false,
        filesModified: [],
        packagesAdded: [],
        warnings: ['No .git directory found. Initialize git first: git init'],
      }
    }

    const filesModified: string[] = []

    // Step 1: Install packages
    const packages = ['husky', 'lint-staged']
    const versionedPackages = packages.map((pkg) => {
      const version = dependencyVersionMap[pkg as keyof typeof dependencyVersionMap]
      return version ? `${pkg}@${version}` : pkg
    })

    await installPackages(versionedPackages, {
      cwd: ctx.rootDir,
      packageManager: ctx.packageManager,
      verbose: ctx.verbose,
    })

    // Step 2: Add prepare script
    await addScript(ctx.rootDir, 'prepare', 'husky')

    // Step 3: Create .husky directory
    const huskyDir = join(ctx.rootDir, '.husky')
    await mkdir(huskyDir, { recursive: true })

    // Step 4: Write pre-commit hook
    const preCommitPath = join(huskyDir, 'pre-commit')
    await writeFile(preCommitPath, 'npx lint-staged\n', 'utf-8')
    filesModified.push(preCommitPath)

    // Step 5: Build lint-staged config from fresh package.json
    const freshPkg = await readPackageJson(ctx.rootDir)
    const allDeps = {
      ...((freshPkg.dependencies ?? {}) as Record<string, string>),
      ...((freshPkg.devDependencies ?? {}) as Record<string, string>),
    }

    const lintStagedConfig: Record<string, string[]> = {}

    if ('eslint' in allDeps) {
      lintStagedConfig['*.{js,jsx,ts,tsx,vue,svelte,astro}'] = ['eslint --fix']
    }

    if ('prettier' in allDeps) {
      lintStagedConfig['*.{js,jsx,ts,tsx,vue,svelte,astro,json,md,css,html}'] = ['prettier --write']
    }

    // Step 6: Write lint-staged config to package.json
    const pkg = await readPackageJson(ctx.rootDir)
    pkg['lint-staged'] = lintStagedConfig
    const pkgPath = join(ctx.rootDir, 'package.json')
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
    filesModified.push(pkgPath)

    return {
      success: true,
      filesModified,
      packagesAdded: versionedPackages,
      warnings: [],
    }
  },
})
