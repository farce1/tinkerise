#!/usr/bin/env node

/**
 * @tinkerise/cli — Scaffold any project with any stack.
 */

import { createRequire } from 'node:module'
import { Command } from 'commander'

const require = createRequire(import.meta.url)
const { version } = require('../package.json')

const program = new Command()

program
  .name('tinkerise')
  .description('Scaffold any project with any stack')
  .version(version, '-v, --version')

program
  .command('list')
  .summary('Show available scaffolders')
  .description('Show all available scaffolders and enhancements grouped by category.')
  .action(() => {
    console.log('Coming soon. No scaffolders registered yet.')
  })

program.addHelpText('after', `
Examples:
  $ tinkerise web next my-app          Create a Next.js project
  $ tinkerise web vite my-app --ts     Create a Vite + TypeScript project
  $ tinkerise add eslint prettier      Add ESLint and Prettier
  $ tinkerise list                     Show available scaffolders`)

program.parse()
