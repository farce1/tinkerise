import type { Command } from 'commander'
import { execFileSync } from 'node:child_process'
import * as p from '@clack/prompts'
import { detectInstallMethod } from '../utils/install-method.js'

export function registerUpdateCommand(program: Command): void {
  program
    .command('update')
    .summary('Update tinkerise to the latest version')
    .description('Detect installation method and run the appropriate update command.')
    .action(async () => {
      const method = detectInstallMethod()

      switch (method) {
        case 'homebrew':
          p.log.info('Detected Homebrew installation. Updating...')
          execFileSync('brew', ['upgrade', 'tinkerise'], { stdio: 'inherit' })
          p.log.success('Updated successfully via Homebrew.')
          break

        case 'npm-global':
          p.log.info('Detected npm global installation. Updating...')
          execFileSync('npm', ['update', '-g', 'tinkerise'], { stdio: 'inherit' })
          p.log.success('Updated successfully via npm.')
          break

        case 'npx':
          p.log.info('You are running via npx — it always fetches the latest version.')
          p.log.info('To ensure the latest: npx tinkerise@latest')
          break

        default:
          p.log.warn('Could not detect installation method.')
          p.log.info('Update manually:')
          p.log.info('  npm:      npm update -g tinkerise')
          p.log.info('  Homebrew: brew upgrade tinkerise')
          break
      }
    })
}
