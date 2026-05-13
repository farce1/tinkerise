/**
 * `tinkerise completion <shell>` — emit a sourceable completion script for
 * bash, zsh, or fish to stdout (D-03).
 *
 * Trust boundary: the `<shell>` positional is untrusted user input. It is
 * matched against the closed `SUPPORTED_SHELLS` allow-list before any
 * generator is invoked. Unknown values throw `UnknownShellError`
 * (code COMPLETION_UNKNOWN_SHELL, D-04) so the central handleError()
 * boundary owns the rendering — both the 3-line human format and the
 * Phase 33 JSON error envelope flow through the same code path because
 * UnknownShellError extends TinkeriseError.
 *
 * Per D-06, `--json` is a silent no-op on the SUCCESS path: the shell
 * script is emitted unchanged. The failure path routes through
 * handleError()'s isJsonMode-first branch (packages/cli/src/utils/error-
 * handler.ts §lines 130-152) which emits the standard envelope
 * `{ schemaVersion: 1, command: 'completion', error: { code, message } }`.
 * No special-casing is required here.
 *
 * `process.stdout.write` (NOT `console.log`) is used to avoid mangling
 * backticks, `$`, and newlines that legitimately appear in the emitted
 * shell scripts.
 */

import type { Command } from 'commander'
import { findClosestMatch, UnknownShellError } from '@tinkerise/core'
import { generate as generateBash } from '../completion/bash.js'
import { generate as generateFish } from '../completion/fish.js'
import { generate as generateZsh } from '../completion/zsh.js'

const SUPPORTED_SHELLS = ['bash', 'zsh', 'fish'] as const
type SupportedShell = typeof SUPPORTED_SHELLS[number]

function isSupportedShell(value: string): value is SupportedShell {
  return (SUPPORTED_SHELLS as readonly string[]).includes(value)
}

function renderScript(shell: SupportedShell, program: Command): string {
  switch (shell) {
    case 'bash':
      return generateBash(program)
    case 'zsh':
      return generateZsh(program)
    case 'fish':
      return generateFish(program)
  }
}

export function registerCompletionCommand(program: Command): void {
  const programName = program.name()

  program
    .command('completion <shell>')
    .summary('Emit a shell completion script (bash, zsh, fish)')
    .description('Print a sourceable completion script for the given shell. Sources both `tinkerise` and `tk` aliases in one directive.')
    .action(async (shell: string) => {
      if (!isSupportedShell(shell)) {
        const closest = findClosestMatch(shell, [...SUPPORTED_SHELLS])
        throw new UnknownShellError(shell, closest)
      }

      const script = renderScript(shell, program)
      // D-03: write via process.stdout.write — script may contain backticks
      // or $-substitutions that console.log would interpret. Trailing newline
      // is already baked into each generator's output, so do not add another.
      process.stdout.write(script)
    })
    .addHelpText('after', `
Examples:
  $ ${programName} completion bash                   Print bash completion script
  $ ${programName} completion zsh                    Print zsh completion script
  $ ${programName} completion fish                   Print fish completion script

Install (D-21):
  bash:  echo 'eval "$(${programName} completion bash)"' >> ~/.bashrc
  zsh:   ${programName} completion zsh > "\${fpath[1]}/_tinkerise" && compinit
  fish:  ${programName} completion fish > ~/.config/fish/completions/${programName}.fish`)
}
