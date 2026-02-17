#!/usr/bin/env node

/**
 * @tinkerise/cli — Scaffold any project with any stack.
 *
 * Entry modes:
 * - `tinkerise` — full interactive flow
 * - `tinkerise <category>` — category-filtered framework selection
 * - `tinkerise <category> <framework> [name]` — direct execution
 */

import { createRequire } from 'node:module'
import { Command } from 'commander'
import { runInteractiveFlow, runCategoryFlow, runDirectExecution } from './commands/scaffold.js'

const require = createRequire(import.meta.url)
const { version } = require('../package.json')

const program = new Command()

program
  .name('tinkerise')
  .description('Scaffold any project with any stack')
  .version(version, '-v, --version')

// Global options available to all entry modes
program
  .option('--typescript', 'Use TypeScript')
  .option('--ts', 'Use TypeScript (alias)')
  .option('--tailwind', 'Add Tailwind CSS')
  .option('--eslint', 'Add ESLint')
  .option('--no-git', 'Skip git initialization')
  .option('--no-install', 'Skip dependency installation')
  .option('--package-manager <pm>', 'Package manager to use (npm, pnpm, yarn, bun)')

// Default action with optional positional arguments
program
  .argument('[category]', 'Project category (web, backend, mobile)')
  .argument('[framework]', 'Framework name')
  .argument('[name]', 'Project name')
  .action(async (category: string | undefined, framework: string | undefined, name: string | undefined, options) => {
    // Merge --ts alias into --typescript
    if (options.ts) {
      options.typescript = true
    }

    if (!category) {
      await runInteractiveFlow(options)
    } else if (!framework) {
      await runCategoryFlow(category, options)
    } else {
      await runDirectExecution(category, framework, name, options)
    }
  })

// List command stub
program
  .command('list')
  .summary('Show available scaffolders')
  .description('Show all available scaffolders and enhancements grouped by category.')
  .action(() => {
    console.log('Coming soon.')
  })

program.addHelpText('after', `
Examples:
  $ tinkerise                            Interactive guided flow
  $ tinkerise web                        Select from web frameworks
  $ tinkerise web next my-app            Create a Next.js project
  $ tinkerise web next my-app --ts       Create with TypeScript
  $ tinkerise list                       Show available scaffolders`)

program.parse()
