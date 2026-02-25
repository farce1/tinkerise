import { resolve } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { execaNode } from 'execa'
import { describe, expect, it } from 'vitest'

const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js')

function stripAnsi(input: string): string {
  return stripVTControlCharacters(input)
}

describe('cli typo suggestion behavior', () => {
  it('shows ranked Did you mean guidance for high-confidence typos', async () => {
    const result = await execaNode(CLI_PATH, ['config', 'lset'], { reject: false })
    const stderr = stripAnsi(result.stderr)

    expect(result.exitCode).toBe(1)
    expect(result.stdout.trim()).toBe('')
    expect(stderr).toContain('Error [COMMANDER_UNKNOWNCOMMAND] Command input is invalid.')
    expect(stderr).toContain('Cause: unknown command \'lset\'')
    expect(stderr).toContain('Did you mean')
    expect(stderr).toContain('\'list\', \'preset\', or \'lib\'')
    expect(stderr).toContain('Try \'tinkerise list\'.')
  })

  it('shows fallback guidance for low-confidence typos', async () => {
    const result = await execaNode(CLI_PATH, ['config', 'zzzz'], { reject: false })
    const stderr = stripAnsi(result.stderr)

    expect(result.exitCode).toBe(1)
    expect(result.stdout.trim()).toBe('')
    expect(stderr).toContain('Error [COMMANDER_UNKNOWNCOMMAND] Command input is invalid.')
    expect(stderr).toContain('Cause: unknown command \'zzzz\'')
    expect(stderr).not.toContain('Did you mean')
    expect(stderr).toContain('Run \'tinkerise --help\' or \'tinkerise list\' to see available commands.')
  })
})
