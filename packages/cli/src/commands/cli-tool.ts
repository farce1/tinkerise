/**
 * CLI command for scaffolding CLI tool projects.
 *
 * Registers `tinkerise cli <name>` as a top-level command.
 * Delegates to generateCliTool from @tinkerise/core.
 */

import type { Command } from 'commander'
import { generateCliTool } from '@tinkerise/core'

export function registerCliToolCommand(program: Command): void {
  program
    .command('cli')
    .summary('Scaffold a CLI tool')
    .description('Scaffold a new CLI tool with Commander.js, TypeScript, and tsup.')
    .argument('<name>', 'Project name')
    .option('--package-manager <pm>', 'Package manager (npm, pnpm, yarn, bun)')
    .option('--no-install', 'Skip dependency installation')
    .action(async (name: string, options) => {
      await generateCliTool(name, {
        packageManager: options.packageManager,
        noInstall: options.install === false, // Commander inverts --no-install
      })
    })
}
