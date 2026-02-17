/**
 * GitHub Actions CI enhancement module.
 *
 * Generates a CI workflow with lint, typecheck, test, and build steps.
 * Adapts to the project's package manager and conditionally includes
 * steps based on what tools are installed.
 */

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import type { ProjectContext } from '../types.js'
import { writeConfigFile, readPackageJson } from './_utils.js'
import type { PackageManager } from '../../pm/detect.js'

/** CI workflow file patterns to check */
const WORKFLOW_FILES = [
  '.github/workflows/ci.yml',
  '.github/workflows/ci.yaml',
  '.github/workflows/test.yml',
  '.github/workflows/test.yaml',
]

/** PM-specific CI configuration */
interface PmCiConfig {
  installCmd: string
  runPrefix: string
  cacheKey: string | null
  needsCorepack: boolean
  setupAction: string | null
}

const PM_CI_MAP: Record<PackageManager, PmCiConfig> = {
  npm: {
    installCmd: 'npm ci',
    runPrefix: 'npm run',
    cacheKey: 'npm',
    needsCorepack: false,
    setupAction: null,
  },
  pnpm: {
    installCmd: 'pnpm install --frozen-lockfile',
    runPrefix: 'pnpm run',
    cacheKey: 'pnpm',
    needsCorepack: true,
    setupAction: 'pnpm/action-setup@v4',
  },
  yarn: {
    installCmd: 'yarn install --frozen-lockfile',
    runPrefix: 'yarn run',
    cacheKey: 'yarn',
    needsCorepack: true,
    setupAction: null,
  },
  bun: {
    installCmd: 'bun install --frozen-lockfile',
    runPrefix: 'bun run',
    cacheKey: null,
    needsCorepack: false,
    setupAction: 'oven-sh/setup-bun@v2',
  },
}

export const ciModule = defineEnhancement({
  id: 'ci',
  name: 'GitHub Actions CI',
  description: 'CI workflow with lint, typecheck, test, and build',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    for (const file of WORKFLOW_FILES) {
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
    // Step 1: Read fresh package.json to determine available tools
    const freshPkg = await readPackageJson(ctx.rootDir)
    const allDeps = {
      ...((freshPkg.dependencies ?? {}) as Record<string, string>),
      ...((freshPkg.devDependencies ?? {}) as Record<string, string>),
    }
    const scripts = (freshPkg.scripts ?? {}) as Record<string, string>

    // Step 2: Determine which steps to include
    const hasLint = 'eslint' in allDeps || 'lint' in scripts
    const hasTypecheck = 'typescript' in allDeps
    const hasVitest = 'vitest' in allDeps
    const hasJest = 'jest' in allDeps
    const hasTest = hasVitest || hasJest || 'test' in scripts
    const hasBuild = 'build' in scripts

    // Step 3: Build PM-specific config
    const pmConfig = PM_CI_MAP[ctx.packageManager]

    // Step 4: Generate YAML
    const yaml = buildCiYaml(ctx.packageManager, pmConfig, {
      hasLint,
      hasTypecheck,
      hasTest,
      hasVitest,
      hasBuild,
      typecheckScript: scripts.typecheck ? 'typecheck' : (scripts['type-check'] ? 'type-check' : 'typecheck'),
    })

    // Step 5: Write workflow file
    const configPath = await writeConfigFile(
      ctx.rootDir,
      '.github/workflows/ci.yml',
      yaml,
    )

    return {
      success: true,
      filesModified: [configPath],
      packagesAdded: [],
      warnings: [],
    }
  },
})

interface CiSteps {
  hasLint: boolean
  hasTypecheck: boolean
  hasTest: boolean
  hasVitest: boolean
  hasBuild: boolean
  typecheckScript: string
}

function buildCiYaml(
  pm: PackageManager,
  config: PmCiConfig,
  steps: CiSteps,
): string {
  const lines: string[] = [
    'name: CI',
    '',
    'on:',
    '  pull_request:',
    '    branches: [main]',
    '  push:',
    '    branches: [main]',
    '',
    'jobs:',
    '  ci:',
    '    runs-on: ubuntu-latest',
  ]

  // Node version matrix (skip for bun)
  if (pm !== 'bun') {
    lines.push(
      '    strategy:',
      '      matrix:',
      '        node-version: [20, 22]',
    )
  }

  lines.push('    steps:',
    '      - uses: actions/checkout@v4',
  )

  // PM-specific setup
  if (pm === 'pnpm') {
    lines.push(
      '',
      `      - uses: ${config.setupAction}`,
      '        with:',
      '          version: 10',
    )
  }

  if (pm === 'bun') {
    lines.push(
      '',
      `      - uses: ${config.setupAction}`,
    )
  } else {
    // Setup Node.js
    lines.push(
      '',
      '      - uses: actions/setup-node@v4',
      '        with:',
      '          node-version: ${{ matrix.node-version }}',
    )

    if (config.cacheKey) {
      lines.push(`          cache: '${config.cacheKey}'`)
    }
  }

  // Corepack
  if (config.needsCorepack) {
    lines.push(
      '',
      '      - run: corepack enable',
    )
  }

  // Install
  lines.push(
    '',
    `      - run: ${config.installCmd}`,
  )

  // Conditional steps
  if (steps.hasLint) {
    lines.push(
      '',
      `      - run: ${config.runPrefix} lint`,
    )
  }

  if (steps.hasTypecheck) {
    lines.push(
      '',
      `      - run: ${config.runPrefix} ${steps.typecheckScript}`,
    )
  }

  if (steps.hasTest) {
    const testCmd = steps.hasVitest
      ? `${config.runPrefix} test -- --run`
      : `${config.runPrefix} test`
    lines.push(
      '',
      `      - run: ${testCmd}`,
    )
  }

  if (steps.hasBuild) {
    lines.push(
      '',
      `      - run: ${config.runPrefix} build`,
    )
  }

  lines.push('')

  return lines.join('\n')
}
