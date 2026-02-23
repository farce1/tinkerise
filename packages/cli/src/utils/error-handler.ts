import { basename } from 'node:path'
import { TinkeriseError } from '@tinkerise/core'
import { CommanderError } from 'commander'
import pc from 'picocolors'
import { formatBoundaryError } from './error-ux-contract.js'

const invokedAs = basename(process.argv[1] ?? 'tinkerise')
const programName = invokedAs === 'tk' ? 'tk' : 'tinkerise'

function isDebugEnabled(): boolean {
  return process.argv.includes('--verbose') || !!process.env.DEBUG
}

function toStableCode(input: string): string {
  return input
    .replace(/^commander\./, 'COMMANDER_')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

function renderAndExit(options: {
  code: string
  headline: string
  cause: string
  nextStep: string
  stack?: string
  exitCode: number
}): never {
  const debug = isDebugEnabled()
  const formatted = formatBoundaryError({
    content: {
      code: options.code,
      headline: options.headline,
      cause: options.cause,
      nextStep: options.nextStep,
    },
    stack: options.stack,
    debug,
  })

  for (const [index, line] of formatted.lines.entries()) {
    const styled = index === 0 ? pc.red(line) : pc.dim(line)
    console.error(styled)
  }

  if (formatted.stack) {
    console.error(pc.dim(`\n${formatted.stack}`))
  }

  process.exit(options.exitCode)
}

function nextStepForCommander(code: string): string {
  if (code === 'commander.unknownCommand') {
    return `Run '${programName} --help' to see available commands.`
  }

  if (code === 'commander.unknownOption') {
    return `Run '${programName} --help' to review supported options.`
  }

  if (code === 'commander.missingArgument') {
    return `Run '${programName} --help' to check required arguments.`
  }

  return `Run '${programName} --help' for usage guidance.`
}

export function handleError(error: unknown): never {
  if (error instanceof CommanderError) {
    if (error.code === 'commander.helpDisplayed'
      || error.code === 'commander.version') {
      process.exit(0)
    }

    renderAndExit({
      code: toStableCode(error.code),
      headline: 'Command input is invalid.',
      cause: error.message.replace(/^error:\s*/i, ''),
      nextStep: nextStepForCommander(error.code),
      stack: error.stack,
      exitCode: error.exitCode,
    })
  }

  if (error instanceof TinkeriseError) {
    renderAndExit({
      code: toStableCode(error.code),
      headline: 'Command failed.',
      cause: error.message,
      nextStep: error.suggestion ?? `Run '${programName} --help' for command guidance.`,
      stack: error.stack,
      exitCode: error.exitCode,
    })
  }

  if (error instanceof Error && error.name === 'ZodError') {
    renderAndExit({
      code: 'CONFIG_VALIDATION',
      headline: 'Configuration is invalid.',
      cause: error.message,
      nextStep: `Run '${programName} config list' to review current configuration values.`,
      stack: error.stack,
      exitCode: 1,
    })
  }

  if (error instanceof Error) {
    renderAndExit({
      code: 'UNEXPECTED_RUNTIME',
      headline: 'Unexpected runtime failure.',
      cause: error.message,
      nextStep: `Retry with '--verbose'. If the issue persists, open an issue at https://github.com/farce1/tinkerise/issues.`,
      stack: error.stack,
      exitCode: 1,
    })
  }

  renderAndExit({
    code: 'UNEXPECTED_RUNTIME',
    headline: 'Unexpected runtime failure.',
    cause: 'A non-error value was thrown during command execution.',
    nextStep: `Retry with '--verbose'. If the issue persists, open an issue at https://github.com/farce1/tinkerise/issues.`,
    stack: String(error),
    exitCode: 1,
  })
}
