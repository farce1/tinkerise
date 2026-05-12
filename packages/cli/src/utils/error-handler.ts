import { basename } from 'node:path'
import { TinkeriseError } from '@tinkerise/core'
import { CommanderError } from 'commander'
import pc from 'picocolors'
import { CLI_COMMAND_CANDIDATES, getCommandSuggestions } from './command-suggestions.js'
import { formatBoundaryError } from './error-ux-contract.js'
import { emitJson, isJsonMode } from './output-mode.js'

const invokedAs = basename(process.argv[1] ?? 'tinkerise')
const programName = invokedAs === 'tk' ? 'tk' : 'tinkerise'

function isDebugEnabled(): boolean {
  return process.argv.includes('--verbose') || !!process.env.DEBUG
}

function toStableCode(input: string): string {
  return input
    .replace(/^commander\./, 'COMMANDER_')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

/**
 * Best-effort extraction of the invoked subcommand from process.argv for the
 * JSON error envelope (D-05). Returns 'preset.list' / 'preset.show' for the
 * compound commands, the first positional token otherwise, or 'unknown' when
 * no positional argument is present.
 */
function inferCommandFromArgv(argv: readonly string[]): string {
  // process.argv[0] = node, [1] = bin path, [2+] = user args
  const userArgs = argv.slice(2).filter(a => !a.startsWith('-'))
  if (userArgs.length === 0)
    return 'unknown'
  // Recognize 'preset list' / 'preset show' compound commands
  if (userArgs[0] === 'preset' && (userArgs[1] === 'list' || userArgs[1] === 'show')) {
    return `preset.${userArgs[1]}`
  }
  return userArgs[0]!
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

function extractUnknownCommand(message: string): string | undefined {
  const singleQuoted = message.match(/unknown command '([^']+)'/i)
  if (singleQuoted?.[1])
    return singleQuoted[1]

  const doubleQuoted = message.match(/unknown command "([^"]+)"/i)
  if (doubleQuoted?.[1])
    return doubleQuoted[1]

  return undefined
}

function renderRankedSuggestions(commands: string[]): string {
  if (commands.length === 1) {
    return `'${commands[0]}'`
  }

  if (commands.length === 2) {
    return `'${commands[0]}' or '${commands[1]}'`
  }

  return `'${commands[0]}', '${commands[1]}', or '${commands[2]}'`
}

function nextStepForCommander(code: string, message: string): string {
  if (code === 'commander.unknownCommand') {
    const unknownCommand = extractUnknownCommand(message)
    if (unknownCommand) {
      const suggestions = getCommandSuggestions(unknownCommand, {
        candidates: CLI_COMMAND_CANDIDATES,
        maxSuggestions: 3,
        commandName: programName,
      })

      if (suggestions.isHighConfidence && suggestions.suggestions.length > 0) {
        const rankedCommands = suggestions.suggestions.map(item => item.command)
        const correctedCommand = suggestions.suggestions[0]!.correctedCommand
        return `Did you mean ${renderRankedSuggestions(rankedCommands)}? Try '${correctedCommand}'.`
      }
    }

    return `Run '${programName} --help' or '${programName} list' to see available commands.`
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
  // JSON mode (D-05): emit error envelope to stdout, NOT stderr, and exit
  // with a stable non-zero code derived from the error's exitCode if any.
  // This branch MUST be the first statement so the human-mode renderer
  // never runs in JSON mode (T-33-07).
  if (isJsonMode()) {
    const command = inferCommandFromArgv(process.argv)
    const code = error instanceof TinkeriseError
      ? error.code
      : error instanceof CommanderError
        ? toStableCode(error.code)
        : 'UNEXPECTED_RUNTIME'
    const message = error instanceof Error ? error.message : String(error)
    emitJson({ schemaVersion: 1, command, error: { code, message } })
    // TinkeriseError.exitCode is guaranteed by base.ts (readonly number,
    // defaults to 1). CommanderError.exitCode is part of commander 13.x's
    // public surface. Fall through to 1 otherwise.
    const exitCode = error instanceof TinkeriseError
      ? error.exitCode
      : error instanceof CommanderError
        ? error.exitCode
        : 1
    process.exit(exitCode)
  }

  if (error instanceof CommanderError) {
    if (error.code === 'commander.helpDisplayed'
      || error.code === 'commander.version') {
      process.exit(0)
    }

    renderAndExit({
      code: toStableCode(error.code),
      headline: 'Command input is invalid.',
      cause: error.message.replace(/^error:\s*/i, ''),
      nextStep: nextStepForCommander(error.code, error.message),
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
