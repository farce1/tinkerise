import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const cliEntry = resolve(repoRoot, 'packages/cli/dist/index.js')
const outputPath = resolve(repoRoot, 'apps/docs/src/content/docs/reference/commands.mdx')

const commandSections = [
  { heading: 'Root command', argv: ['--help'] },
  { heading: '`list` command', argv: ['list', '--help'] },
  { heading: '`monorepo` command', argv: ['monorepo', '--help'] },
  { heading: '`add` command', argv: ['add', '--help'] },
  { heading: '`doctor` command', argv: ['doctor', '--help'] },
  { heading: '`config` command', argv: ['config', '--help'] },
  { heading: '`preset` command', argv: ['preset', '--help'] },
  { heading: '`mcp` command', argv: ['mcp', '--help'] },
  { heading: '`cli` command', argv: ['cli', '--help'] },
  { heading: '`lib` command', argv: ['lib', '--help'] },
  { heading: '`update` command', argv: ['update', '--help'] },
]

function run(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

function normalize(output) {
  return output
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trimEnd()
}

function captureHelp(argv) {
  return normalize(run('node', [cliEntry, ...argv]))
}

function toCommandSignature(argv) {
  return argv.length === 1
    ? 'tinkerise --help'
    : `tinkerise ${argv[0]} --help`
}

function buildDocument() {
  const blocks = commandSections.map((section) => {
    const signature = toCommandSignature(section.argv)
    const helpText = captureHelp(section.argv)
    return [
      `## ${section.heading}`,
      '',
      `Command: \`${signature}\``,
      '',
      '```text',
      helpText,
      '```',
    ].join('\n')
  })

  return [
    '---',
    'title: Commands',
    'description: Generated reference for the complete tinkerise command surface.',
    '---',
    '',
    'This page is generated from live CLI help output to prevent command drift.',
    'Regenerate it any time with `bun --filter @tinkerise/docs run docs:reference`.',
    '',
    ...blocks,
    '',
  ].join('\n')
}

run('bun', ['run', '--filter', '@tinkerise/cli', 'build'])
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, buildDocument(), 'utf8')
