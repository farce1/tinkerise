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
import { basename } from 'node:path'
import { Command } from 'commander'
import { registerCompleteCommand } from './commands/__complete.js'
import { runAddCommand } from './commands/add.js'
import { registerCliToolCommand } from './commands/cli-tool.js'
import { registerCompletionCommand } from './commands/completion.js'
import { registerConfigCommand } from './commands/config.js'
import { runDoctor } from './commands/doctor.js'
import { buildScaffolderHelpText } from './commands/help.js'
import { registerLibCommand } from './commands/lib.js'
import { listScaffolders } from './commands/list.js'
import { registerMcpCommand } from './commands/mcp.js'
import { registerPresetCommand } from './commands/preset.js'
import { runCategoryFlow, runDirectExecution, runInteractiveFlow } from './commands/scaffold.js'
import { registerUpdateCommand } from './commands/update.js'
import { handleError } from './utils/error-handler.js'
import { detectJsonMode, isJsonMode } from './utils/output-mode.js'
import { checkForUpdate, printUpdateNudge } from './utils/update-check.js'

// Detect --json BEFORE the update-check so the banner is suppressed in JSON
// mode (D-15). Commander's parseAsync runs later, so a preAction hook is too
// late — we must inspect argv synchronously at module evaluation time.
detectJsonMode()

// Fire update check asynchronously (non-blocking) — suppressed in JSON mode (D-15)
const updateCheckPromise = isJsonMode() ? Promise.resolve(null) : checkForUpdate().catch(() => null)

const require = createRequire(import.meta.url)
const { version } = require('../package.json')

// Detect invocation name: 'tk' vs 'tinkerise'
const invokedAs = basename(process.argv[1] ?? 'tinkerise')
const programName = invokedAs === 'tk' ? 'tk' : 'tinkerise'

const program = new Command()

// Convert Commander's internal process.exit() calls into thrown CommanderError exceptions
program.exitOverride()

// Disable built-in suggestions; deterministic suggestion UX is handled separately.
program.showSuggestionAfterError(false)

// Show a pointer to --help after usage errors (not the full help dump)
program.showHelpAfterError('(run with --help for usage information)')

// Suppress Commander default error output so all failures flow through handleError.
program.configureOutput({
  outputError: () => {},
})

program
  .name(programName)
  .description('Scaffold any project with any stack')
  .version(version, '-v, --version')

// Global options available to all entry modes
program
  .option('--typescript', 'Use TypeScript')
  .option('--ts', 'Use TypeScript (alias)')
  .option('--tailwind', 'Add Tailwind CSS')
  .option('--eslint', 'Add ESLint')
  .option('--biome', 'Use Biome linter/formatter')
  .option('--no-git', 'Skip git initialization')
  .option('--no-install', 'Skip dependency installation')
  .option('--package-manager <pm>', 'Package manager to use (npm, pnpm, yarn, bun)')
  .option('--template <template>', 'Project template or starter name')
  .option('--src-dir', 'Use src/ directory')
  .option('--import-alias <alias>', 'Import alias (e.g. @/*, ~/)')
  .option('--empty', 'Initialize with no starter content')
  .option('--overwrite', 'Overwrite existing directory')
  .option('--app-router', 'Use App Router')
  .option('--react-compiler', 'Enable React Compiler')
  .option('--turbopack', 'Use Turbopack bundler')
  .option('--api', 'Headless API project')
  .option('--preset <name>', 'Apply a saved preset')
  .option('--verbose', 'Show detailed output')
  .option('--json', 'Emit machine-readable JSON output (list, doctor, preset list/show, dry-run)')
  .option('--dry-run', 'Show the command that would run without executing')
  .option('--explain', 'Like --dry-run, plus flag and prerequisite details (implies --dry-run)')

const VALID_CATEGORIES = ['web', 'backend', 'mobile']

// Default action with optional positional arguments
program
  .argument('[category]', 'Project category (web, backend, mobile) — or first stack token')
  .argument('[framework]', 'Framework name — or stack token')
  .argument('[name]', 'Project name — or stack token')
  .argument('[tokens...]', 'Additional natural-language stack tokens')
  .action(async (category: string | undefined, framework: string | undefined, name: string | undefined, tokens: string[], options, command) => {
    // Merge --ts alias into --typescript
    if (options.ts) {
      options.typescript = true
    }

    // Existing positional contract: first arg is a known category.
    if (!category || VALID_CATEGORIES.includes(category)) {
      if (!category) {
        await runInteractiveFlow(command, options)
      }
      else if (!framework) {
        await runCategoryFlow(category, command, options)
      }
      else {
        await runDirectExecution(category, framework, name, command, options)
      }
      return
    }

    // Natural-language stack mode: first token is not a category.
    const allTokens = [category, framework, name, ...(tokens ?? [])].filter(Boolean) as string[]
    const { runStackMode } = await import('./commands/stack.js')
    await runStackMode(allTokens, command, options)
  })

// List command — shows all scaffolders grouped by category
program
  .command('list')
  .summary('Show available scaffolders')
  .description('Show all available scaffolders grouped by category. Pass a category name for details.')
  .argument('[category]', 'Filter by category (web, backend, mobile)')
  .action(async (category?: string) => {
    await listScaffolders(category)
  })
  .addHelpText('after', `
Examples:
  $ ${programName} list                       Show all scaffolders, templates, and enhancements
  $ ${programName} list web                   Show web scaffolders with details and flags`)

// Monorepo command — routes to turbo scaffolder (WEB-07)
program
  .command('monorepo')
  .summary('Create a Turborepo monorepo')
  .description('Scaffold a new Turborepo monorepo project.')
  .argument('<name>', 'Project name')
  .option('--no-install', 'Skip dependency installation')
  .option('--package-manager <pm>', 'Package manager (npm, pnpm, yarn, bun)')
  .action(async (name: string, options) => {
    // Merge options same as scaffold command
    if (options.ts)
      options.typescript = true
    await runDirectExecution('web', 'turbo', name, program, options)
  })
  .addHelpText('after', `
Examples:
  $ ${programName} monorepo my-repo           Create a Turborepo monorepo
  $ ${programName} monorepo my-repo --no-install  Create without installing dependencies`)

// Add command — apply enhancements to existing projects
program
  .command('add')
  .summary('Add enhancements to your project')
  .description('Add ESLint, Prettier, husky, GitHub Actions CI, Docker, env, commitlint, testing, Renovate, EditorConfig, and more to your project. Run without arguments for an interactive picker.')
  .argument('[enhancements...]', 'Enhancement names (eslint, prettier, husky, ci, docker, env, commitlint, testing, renovate, editorconfig)')
  .option('--verbose', 'Show detailed output from package installation')
  .action(async (enhancements: string[], options) => {
    await runAddCommand(enhancements, options)
  })
  .addHelpText('after', `
Examples:
  $ ${programName} add eslint                 Add ESLint to your project
  $ ${programName} add eslint prettier husky  Add multiple enhancements
  $ ${programName} add                        Interactive enhancement picker`)

// Doctor command — check system for required tools and versions
program
  .command('doctor')
  .summary('Check system for required tools and versions')
  .description('Check system for required tools and versions across all supported ecosystems.')
  .action(async () => {
    await runDoctor()
  })
  .addHelpText('after', `
Examples:
  $ ${programName} doctor                     Check all system tools and versions
  $ ${programName} doctor | grep -i missing   Quickly surface missing tools`)

// Config command — manage tinkerise configuration
registerConfigCommand(program)

// Preset command — manage configuration presets
registerPresetCommand(program)

// MCP command — scaffold MCP server projects
registerMcpCommand(program)

// CLI tool command — scaffold CLI tool projects
registerCliToolCommand(program)

// Lib command — scaffold npm library projects
registerLibCommand(program)

// Update command — self-update with install-method detection
registerUpdateCommand(program)

// Hidden internal subcommand consumed by completion scripts (D-10).
// Registered before `completion` so the program tree is complete
// when the generator walks it.
registerCompleteCommand(program)

// Completion command — emit shell completion script (bash/zsh/fish).
registerCompletionCommand(program)

program.addHelpText('after', `
Examples:
  $ ${programName}                            Interactive guided flow
  $ ${programName} web                        Select from web frameworks
  $ ${programName} web next my-app            Create a Next.js project
  $ ${programName} web vite my-app --ts       Create with TypeScript
  $ ${programName} my-app next ts tailwind    Natural-language stack tokens
  $ ${programName} monorepo my-repo           Create a Turborepo monorepo
  $ ${programName} list                       Show available scaffolders
  $ ${programName} list web                   Show web scaffolders with details
  $ ${programName} add eslint prettier        Add ESLint and Prettier
  $ ${programName} doctor                     Check system tools
  $ ${programName} config list                Show configuration
  $ ${programName} config set packageManager pnpm  Set default PM
  $ ${programName} config init                Interactive config setup
  $ ${programName} preset save my-stack       Save current config as preset
  $ ${programName} preset use my-stack        Apply a saved preset
  $ ${programName} preset list                Show available presets
  $ ${programName} preset delete my-stack     Remove a preset
  $ ${programName} web next my-app --preset my-stack  Apply preset to scaffold
  $ ${programName} mcp my-server              Scaffold an MCP server
  $ ${programName} cli my-tool                Scaffold a CLI tool
  $ ${programName} lib my-lib                 Scaffold an npm library
  $ ${programName} update                     Update to latest version
  $ ${programName} completion bash             Emit bash completion script
  $ ${programName} completion zsh > "\${fpath[1]}/_tinkerise"  Install zsh completion`)

// Per-scaffolder help interception (before Commander processes --help)
// Detects: tinkerise web <framework> --help | -h
// Shows unified-only flags per locked decision, then exits.
const userArgs = process.argv.slice(2)
const helpIdx = userArgs.findIndex(a => a === '--help' || a === '-h')
try {
  if (helpIdx >= 0 && userArgs.length >= 2) {
    const [cat, fw] = userArgs.filter(a => a !== '--help' && a !== '-h')
    if (cat && fw && VALID_CATEGORIES.includes(cat)) {
      const helpText = buildScaffolderHelpText(fw)
      if (helpText) {
        console.log(helpText)
        process.exit(0)
      }
    }
  }
}
catch (err) {
  handleError(err)
}

program.parseAsync()
  .then(async () => {
    if (isJsonMode())
      return
    const latestVersion = await updateCheckPromise
    if (latestVersion) {
      printUpdateNudge(latestVersion)
    }
  })
  .catch(handleError)
