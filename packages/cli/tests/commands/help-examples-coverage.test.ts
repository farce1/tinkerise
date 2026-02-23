import { resolve } from 'node:path'
import { execaNode } from 'execa'
import { describe, expect, it } from 'vitest'

const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js')

type HelpTarget = {
  name: string
  args: string[]
}

const HELP_TARGETS: HelpTarget[] = [
  { name: 'root', args: ['--help'] },
  { name: 'list', args: ['list', '--help'] },
  { name: 'monorepo', args: ['monorepo', '--help'] },
  { name: 'add', args: ['add', '--help'] },
  { name: 'doctor', args: ['doctor', '--help'] },
  { name: 'config', args: ['config', '--help'] },
  { name: 'config list', args: ['config', 'list', '--help'] },
  { name: 'config get', args: ['config', 'get', '--help'] },
  { name: 'config set', args: ['config', 'set', '--help'] },
  { name: 'config init', args: ['config', 'init', '--help'] },
  { name: 'preset', args: ['preset', '--help'] },
  { name: 'preset save', args: ['preset', 'save', '--help'] },
  { name: 'preset use', args: ['preset', 'use', '--help'] },
  { name: 'preset list', args: ['preset', 'list', '--help'] },
  { name: 'preset delete', args: ['preset', 'delete', '--help'] },
  { name: 'update', args: ['update', '--help'] },
  { name: 'mcp', args: ['mcp', '--help'] },
  { name: 'cli', args: ['cli', '--help'] },
  { name: 'lib', args: ['lib', '--help'] },
]

function extractExampleLines(helpOutput: string): string[] {
  const lines = helpOutput.split('\n')
  const examplesStart = lines.findIndex(line => line.trim() === 'Examples:')

  if (examplesStart === -1) {
    return []
  }

  return lines
    .slice(examplesStart + 1)
    .map(line => line.trim())
    .filter(line => line.startsWith('$ '))
}

describe('help examples coverage', () => {
  it('covers the full public command inventory', () => {
    expect(HELP_TARGETS.map(target => target.name)).toEqual([
      'root',
      'list',
      'monorepo',
      'add',
      'doctor',
      'config',
      'config list',
      'config get',
      'config set',
      'config init',
      'preset',
      'preset save',
      'preset use',
      'preset list',
      'preset delete',
      'update',
      'mcp',
      'cli',
      'lib',
    ])
  })

  for (const target of HELP_TARGETS) {
    it(`${target.name} help includes at least two runnable examples`, async () => {
      const { stdout, exitCode } = await execaNode(CLI_PATH, target.args)

      expect(exitCode).toBe(0)
      expect(stdout, `Missing Examples section for command: ${target.name}`).toContain('Examples:')

      const exampleLines = extractExampleLines(stdout)
      expect(
        exampleLines.length,
        `Command "${target.name}" has ${exampleLines.length} example(s). Expected at least 2.\nArgs: ${target.args.join(' ')}\nOutput:\n${stdout}`,
      ).toBeGreaterThanOrEqual(2)
    })
  }
})
