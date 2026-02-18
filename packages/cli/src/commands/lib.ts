/**
 * CLI command for scaffolding npm library projects.
 *
 * Registers `tinkerise lib <name>` as a top-level command.
 * Delegates to generateLib from @tinkerise/core.
 */

import type { Command } from 'commander'
import { generateLib } from '@tinkerise/core'

export function registerLibCommand(program: Command): void {
  program
    .command('lib')
    .summary('Scaffold an npm library')
    .description('Scaffold a new npm library with TypeScript, tsup dual CJS/ESM build, Vitest, and publish-ready package.json.')
    .argument('<name>', 'Project name')
    .option('--package-manager <pm>', 'Package manager (npm, pnpm, yarn, bun)')
    .option('--no-install', 'Skip dependency installation')
    .action(async (name: string, options) => {
      await generateLib(name, {
        packageManager: options.packageManager,
        noInstall: options.install === false, // Commander inverts --no-install
      })
    })
}
