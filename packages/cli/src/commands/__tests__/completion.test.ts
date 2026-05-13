/**
 * Co-located vitest for the `tinkerise completion <shell>` command.
 *
 * Locks the user-facing contract:
 *
 * - `bash` / `zsh` / `fish` happy paths dispatch to the matching generator
 *   and write the script to stdout (D-03).
 * - Unknown shell throws UnknownShellError ({ code: COMPLETION_UNKNOWN_SHELL })
 *   with the default suggestion `Supported shells: bash, zsh, fish.` (D-04).
 * - Typo close-match yields `Did you mean '<closest>'?` via the fuzzy match
 *   wired through @tinkerise/core's findClosestMatch.
 * - `--json` on the success path is a silent no-op (D-06): the shell script
 *   is emitted unchanged, no JSON envelope wraps it.
 *
 * The end-to-end --json failure-path JSON envelope contract (where
 * UnknownShellError routes through handleError() isJsonMode branch) is
 * exercised against the built dist binary by the plan's <verify> automation
 * in execute-plan and by Plan 04's conformance matrix — not duplicated here
 * because handleError() is not invoked by program.parseAsync() within a
 * unit-test fresh-Command context.
 */

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerCompletionCommand } from '../completion.js'

describe('completion command', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
  })

  function makeProgram(): Command {
    const program = new Command()
    program.name('tinkerise')
    program.exitOverride()
    // Give the generators a small tree to walk.
    program.command('list').argument('[category]')
    program.command('add').argument('[enhancements...]')
    program.command('doctor')
    registerCompletionCommand(program)
    return program
  }

  function collectStdout(): string {
    return stdoutSpy.mock.calls.map((args: unknown[]) => String(args[0])).join('')
  }

  it('emits a bash completion script for `completion bash`', async () => {
    await makeProgram().parseAsync(['node', 'tinkerise', 'completion', 'bash'])
    const out = collectStdout()
    expect(out.split('\n')[0]).toBe('# bash completion for tinkerise')
    expect(out).toContain('complete -F _tinkerise tinkerise tk')
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('emits a zsh completion script for `completion zsh`', async () => {
    await makeProgram().parseAsync(['node', 'tinkerise', 'completion', 'zsh'])
    const out = collectStdout()
    expect(out.split('\n')[0]).toBe('#compdef tinkerise tk')
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('emits a fish completion script for `completion fish`', async () => {
    await makeProgram().parseAsync(['node', 'tinkerise', 'completion', 'fish'])
    const out = collectStdout()
    expect(out).toContain('complete -c tinkerise')
    expect(out).toContain('complete -c tk')
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('throws COMPLETION_UNKNOWN_SHELL on unknown shell with default suggestion', async () => {
    const program = makeProgram()
    await expect(
      program.parseAsync(['node', 'tinkerise', 'completion', 'powershell']),
    ).rejects.toMatchObject({
      code: 'COMPLETION_UNKNOWN_SHELL',
      suggestion: 'Supported shells: bash, zsh, fish.',
    })
    // Error branch must not pollute the script stream.
    expect(collectStdout()).toBe('')
  })

  it(`throws COMPLETION_UNKNOWN_SHELL on typo with "Did you mean 'bash'?" suggestion`, async () => {
    const program = makeProgram()
    await expect(
      program.parseAsync(['node', 'tinkerise', 'completion', 'bsh']),
    ).rejects.toMatchObject({
      code: 'COMPLETION_UNKNOWN_SHELL',
      suggestion: `Did you mean 'bash'?`,
    })
    expect(collectStdout()).toBe('')
  })

  it('emits the bash script unchanged when --json is set (D-06 silent no-op)', async () => {
    // The completion command must NOT wrap its output in a JSON envelope on the
    // success path under --json. The success-path contract is "silent no-op":
    // the shell script is emitted as-is.
    const program = makeProgram()
    // Add --json globally so Commander parses it without an unknown-option error.
    program.option('--json')
    await program.parseAsync(['node', 'tinkerise', 'completion', 'bash', '--json'])
    const out = collectStdout()
    expect(out.split('\n')[0]).toBe('# bash completion for tinkerise')
    // Output must NOT be a JSON envelope.
    expect(out.startsWith('{')).toBe(false)
  })
})
