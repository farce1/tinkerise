/**
 * Central error boundary for the tinkerise CLI.
 *
 * All errors flow through handleError(), which formats them consistently
 * using @clack/prompts, shows suggestions when available, and only reveals
 * stack traces in verbose mode (--verbose flag or DEBUG env var).
 */

import { CommanderError } from 'commander'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { TinkeriseError } from '@tinkerise/core'

const isVerbose = process.argv.includes('--verbose') || !!process.env.DEBUG

export function handleError(error: unknown): never {
  // Commander non-error exits (help displayed, version printed)
  if (error instanceof CommanderError) {
    if (error.code === 'commander.helpDisplayed'
      || error.code === 'commander.version') {
      process.exit(0)
    }
    // Commander validation errors (unknown command, missing arg)
    // Already formatted by configureOutput, just exit with its code
    process.exit(error.exitCode)
  }

  // Known tinkerise errors — show friendly message + suggestion
  if (error instanceof TinkeriseError) {
    p.log.error(pc.red(error.message))
    if (error.suggestion) {
      p.log.info(pc.dim(error.suggestion))
    }
    if (isVerbose && error.stack) {
      console.error(pc.dim(`\n${error.stack}`))
    }
    process.exit(error.exitCode)
  }

  // Zod validation errors (config schema failures)
  if (error instanceof Error && error.name === 'ZodError') {
    p.log.error(pc.red('Configuration validation failed.'))
    p.log.info(pc.dim(error.message))
    if (isVerbose && error.stack) {
      console.error(pc.dim(`\n${error.stack}`))
    }
    process.exit(1)
  }

  // Unknown/unexpected errors
  p.log.error(pc.red('An unexpected error occurred.'))
  if (error instanceof Error) {
    p.log.info(pc.dim(error.message))
    if (isVerbose) {
      console.error(pc.dim(`\n${error.stack}`))
    }
  }
  else if (isVerbose) {
    console.error(error)
  }
  if (!isVerbose) {
    p.log.info(pc.dim('Run with --verbose for more details.'))
  }
  process.exit(1)
}
