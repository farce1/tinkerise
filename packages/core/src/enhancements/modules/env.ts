/**
 * Env enhancement module.
 *
 * Generates .env, .env.example, and a Zod-based env validation module
 * following the t3-env pattern. Adds .env to .gitignore automatically.
 */

import { access, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { dependencyVersionMap } from '../version-map.js'
import type { ProjectContext } from '../types.js'
import { installPackages, writeConfigFile } from './_utils.js'

/** Env-related files to check for detection */
const ENV_FILES = [
  '.env',
  '.env.example',
  'src/env.ts',
  'src/env.js',
  'env.ts',
  'env.js',
]

export const envModule = defineEnhancement({
  id: 'env',
  name: 'Environment Variables',
  description: 'Type-safe env validation with t3-env and Zod',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    for (const file of ENV_FILES) {
      try {
        await access(join(ctx.rootDir, file))
        configFiles.push(join(ctx.rootDir, file))
      }
      catch {
        // File doesn't exist
      }
    }

    return {
      installed: configFiles.length > 0,
      configFiles,
      partial: false,
    }
  },

  async install(ctx: ProjectContext) {
    const filesModified: string[] = []

    // Step 1: Install @t3-oss/env-core and zod
    const packages = [
      `@t3-oss/env-core@${dependencyVersionMap['@t3-oss/env-core']}`,
      `zod@${dependencyVersionMap['zod']}`,
    ]

    await installPackages(packages, {
      cwd: ctx.rootDir,
      packageManager: ctx.packageManager,
      verbose: ctx.verbose,
    })

    // Step 2: Determine env.ts location (src/ if it exists, otherwise root)
    let envTsPath: string
    try {
      await access(join(ctx.rootDir, 'src'))
      envTsPath = 'src/env.ts'
    }
    catch {
      envTsPath = 'env.ts'
    }

    // Step 3: Generate env.ts with t3-env pattern
    const envTsContent = buildEnvModule()
    const envTsFullPath = await writeConfigFile(ctx.rootDir, envTsPath, envTsContent)
    filesModified.push(envTsFullPath)

    // Step 4: Generate .env.example
    const envExampleContent = buildEnvExample()
    const envExamplePath = await writeConfigFile(ctx.rootDir, '.env.example', envExampleContent)
    filesModified.push(envExamplePath)

    // Step 5: Generate .env (copy of .env.example)
    const envPath = await writeConfigFile(ctx.rootDir, '.env', envExampleContent)
    filesModified.push(envPath)

    // Step 6: Add .env to .gitignore
    const gitignoreModified = await addToGitignore(ctx.rootDir, '.env')
    if (gitignoreModified) {
      filesModified.push(join(ctx.rootDir, '.gitignore'))
    }

    return {
      success: true,
      filesModified,
      packagesAdded: packages,
      warnings: [],
    }
  },
})

/**
 * Build the t3-env style env validation module.
 */
function buildEnvModule(): string {
  return `import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
`
}

/**
 * Build the .env.example template.
 */
function buildEnvExample(): string {
  return `# Database
DATABASE_URL=

# Environment
NODE_ENV=development
`
}

/**
 * Add an entry to .gitignore if not already present.
 *
 * Handles edge cases: missing file, no trailing newline, duplicate entries.
 *
 * @returns true if .gitignore was modified, false if entry already existed
 */
async function addToGitignore(rootDir: string, entry: string): Promise<boolean> {
  const gitignorePath = join(rootDir, '.gitignore')

  let content: string
  try {
    content = await readFile(gitignorePath, 'utf-8')
  }
  catch {
    // .gitignore doesn't exist, create it
    await writeFile(gitignorePath, `${entry}\n`, 'utf-8')
    return true
  }

  // Check if entry already present (line-by-line to avoid partial matches)
  const lines = content.split('\n')
  if (lines.some(line => line.trim() === entry)) {
    return false
  }

  // Append with leading newline if file doesn't end with one
  const prefix = content.endsWith('\n') ? '' : '\n'
  await writeFile(gitignorePath, `${content}${prefix}${entry}\n`, 'utf-8')
  return true
}
