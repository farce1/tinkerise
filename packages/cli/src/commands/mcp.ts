/**
 * CLI command for scaffolding MCP server projects.
 *
 * Registers `tinkerise mcp <name>` as a top-level command.
 * Delegates to generateMcpServer from @tinkerise/core.
 */

import type { Command } from 'commander'
import { generateMcpServer } from '@tinkerise/core'

export function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .summary('Scaffold an MCP server')
    .description('Scaffold a new MCP server project with TypeScript and stdio transport.')
    .argument('<name>', 'Project name')
    .option('--package-manager <pm>', 'Package manager (npm, pnpm, yarn, bun)')
    .option('--no-install', 'Skip dependency installation')
    .action(async (name: string, options) => {
      await generateMcpServer(name, {
        packageManager: options.packageManager,
        noInstall: options.install === false, // Commander inverts --no-install
      })
    })
}
