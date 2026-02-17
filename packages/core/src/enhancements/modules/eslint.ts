/**
 * ESLint flat config enhancement module.
 *
 * Generates an eslint.config.{js,mjs} with framework-appropriate plugins,
 * TypeScript support when detected, and globals for browser/node.
 */

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { dependencyVersionMap } from '../version-map.js'
import type { FrameworkId, ProjectContext } from '../types.js'
import { installPackages, writeConfigFile, addScript } from './_utils.js'

/** ESLint config file patterns to check (flat + legacy) */
const CONFIG_FILES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
]

/** Framework-specific ESLint plugin configuration */
interface FrameworkEslintConfig {
  packages: string[]
  configImports: string[]
  configSpreads: string[]
  /** Extra config blocks to add (e.g., Vue SFC parser) */
  extraBlocks?: string[]
  /** Settings to add to the global config block */
  settings?: string
}

const FRAMEWORK_ESLINT_MAP: Partial<Record<FrameworkId, FrameworkEslintConfig>> = {
  next: {
    packages: ['eslint-plugin-react'],
    configImports: ["import react from 'eslint-plugin-react'"],
    configSpreads: ['react.configs.flat.recommended', "react.configs.flat['jsx-runtime']"],
    settings: "settings: { react: { version: 'detect' } },",
  },
  react: {
    packages: ['eslint-plugin-react'],
    configImports: ["import react from 'eslint-plugin-react'"],
    configSpreads: ['react.configs.flat.recommended', "react.configs.flat['jsx-runtime']"],
    settings: "settings: { react: { version: 'detect' } },",
  },
  remix: {
    packages: ['eslint-plugin-react'],
    configImports: ["import react from 'eslint-plugin-react'"],
    configSpreads: ['react.configs.flat.recommended', "react.configs.flat['jsx-runtime']"],
    settings: "settings: { react: { version: 'detect' } },",
  },
  vue: {
    packages: ['eslint-plugin-vue'],
    configImports: ["import pluginVue from 'eslint-plugin-vue'"],
    configSpreads: ["...pluginVue.configs['flat/recommended']"],
  },
  nuxt: {
    packages: ['eslint-plugin-vue'],
    configImports: ["import pluginVue from 'eslint-plugin-vue'"],
    configSpreads: ["...pluginVue.configs['flat/recommended']"],
  },
  svelte: {
    packages: ['eslint-plugin-svelte'],
    configImports: ["import svelte from 'eslint-plugin-svelte'"],
    configSpreads: ['...svelte.configs.recommended'],
  },
  astro: {
    packages: ['eslint-plugin-astro'],
    configImports: ["import astro from 'eslint-plugin-astro'"],
    configSpreads: ['...astro.configs.recommended'],
  },
}

export const eslintModule = defineEnhancement({
  id: 'eslint',
  name: 'ESLint',
  description: 'Flat config with framework-appropriate plugins',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    // Check each config file pattern
    for (const file of CONFIG_FILES) {
      try {
        await access(join(ctx.rootDir, file))
        configFiles.push(join(ctx.rootDir, file))
      }
      catch {
        // File doesn't exist
      }
    }

    // Check for eslintConfig in package.json
    const hasPackageJsonConfig = !!ctx.packageJson['eslintConfig']

    return {
      installed: configFiles.length > 0 || hasPackageJsonConfig,
      configFiles,
      partial: false,
    }
  },

  async install(ctx: ProjectContext) {
    const hasTypeScript = 'typescript' in ctx.installedDeps
    const fwConfig = ctx.framework ? FRAMEWORK_ESLINT_MAP[ctx.framework] : undefined

    // Step 1: Build packages list
    const basePackages = ['eslint', '@eslint/js', 'globals']
    if (hasTypeScript) basePackages.push('typescript-eslint')
    if (fwConfig) basePackages.push(...fwConfig.packages)

    // Version each package from dependencyVersionMap
    const versionedPackages = basePackages.map((pkg) => {
      const version = dependencyVersionMap[pkg as keyof typeof dependencyVersionMap]
      return version ? `${pkg}@${version}` : pkg
    })

    // Step 2: Install packages
    await installPackages(versionedPackages, {
      cwd: ctx.rootDir,
      packageManager: ctx.packageManager,
      verbose: ctx.verbose,
    })

    // Step 3: Generate config content
    const configContent = buildEslintConfig(hasTypeScript, fwConfig, ctx.framework)

    // Step 4: Determine filename
    const filename = ctx.packageJson.type === 'module'
      ? 'eslint.config.js'
      : 'eslint.config.mjs'

    // Step 5: Write config file
    const configPath = await writeConfigFile(ctx.rootDir, filename, configContent)

    // Step 6: Add lint script
    await addScript(ctx.rootDir, 'lint', 'eslint .')

    return {
      success: true,
      filesModified: [configPath],
      packagesAdded: versionedPackages,
      warnings: [],
    }
  },
})

/**
 * Build the ESLint flat config file content.
 */
function buildEslintConfig(
  hasTypeScript: boolean,
  fwConfig: FrameworkEslintConfig | undefined,
  framework: FrameworkId | null,
): string {
  const imports: string[] = [
    "import { defineConfig } from 'eslint/config'",
    "import js from '@eslint/js'",
  ]

  if (hasTypeScript) {
    imports.push("import tseslint from 'typescript-eslint'")
  }

  if (fwConfig) {
    imports.push(...fwConfig.configImports)
  }

  imports.push("import globals from 'globals'")

  const configEntries: string[] = [
    '  js.configs.recommended,',
  ]

  if (hasTypeScript) {
    configEntries.push('  ...tseslint.configs.recommended,')
  }

  if (fwConfig) {
    for (const spread of fwConfig.configSpreads) {
      configEntries.push(`  ${spread},`)
    }
  }

  // Vue/Nuxt with TypeScript: add SFC parser config block
  if (hasTypeScript && (framework === 'vue' || framework === 'nuxt')) {
    configEntries.push(`  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },`)
  }

  // Global config block
  const globalBlockParts: string[] = [
    '    languageOptions: {',
    '      globals: {',
    '        ...globals.browser,',
    '        ...globals.node,',
    '      },',
    '    },',
  ]

  if (fwConfig?.settings) {
    globalBlockParts.push(`    ${fwConfig.settings}`)
  }

  configEntries.push(`  {\n${globalBlockParts.join('\n')}\n  },`)

  return `${imports.join('\n')}\n\nexport default defineConfig([\n${configEntries.join('\n')}\n])\n`
}
