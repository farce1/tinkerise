/**
 * `tinkerise trust` command — manage the external sources tinkerise may load.
 *
 * Subcommands:
 * - `trust list` — show trusted sources
 * - `trust add <source>` — trust a source (npm:<package> or github:<owner>/<repo>)
 * - `trust remove <source>` — revoke trust
 *
 * Running `trust add` is itself explicit consent, so it trusts directly; the
 * interactive consent prompt is for sources encountered implicitly (later).
 */

import type { Command } from 'commander'
import { listTrustedSources, parseSource, trustSource, untrustSource } from '@tinkerise/core'
import pc from 'picocolors'
import { log } from '../utils/clack-output.js'

export function registerTrustCommand(program: Command): void {
  const programName = program.name()

  const trust = program
    .command('trust')
    .summary('Manage trusted external sources')
    .description('List, add, or remove the external sources tinkerise may load (npm:<package>, github:<owner>/<repo>).')
    .addHelpText('after', `
Examples:
  $ ${programName} trust list                       Show trusted sources
  $ ${programName} trust add github:acme/widgets    Trust a source
  $ ${programName} trust remove github:acme/widgets Revoke trust`)

  trust
    .command('list')
    .description('Show trusted external sources')
    .action(async () => {
      const sources = await listTrustedSources()
      if (sources.length === 0) {
        log.info('No trusted sources.')
        return
      }
      for (const s of sources) {
        log.info(`  ${s.id} ${pc.dim(`(trusted ${s.trustedAt})`)}`)
      }
    })

  trust
    .command('add <source>')
    .description('Trust an external source (npm:<package> or github:<owner>/<repo>)')
    .action(async (source: string) => {
      const { id } = parseSource(source)
      await trustSource(id)
      log.success(`Trusted ${id}`)
    })

  trust
    .command('remove <source>')
    .description('Revoke trust for an external source')
    .action(async (source: string) => {
      const { id } = parseSource(source)
      const removed = await untrustSource(id)
      if (removed) {
        log.success(`Removed ${id}`)
      }
      else {
        log.info(`${id} was not trusted.`)
      }
    })
}
