import { readFileSync, writeFileSync } from 'node:fs'

const [, , inputPath, outputPath] = process.argv

if (!inputPath || !outputPath) {
  throw new Error('Usage: node .github/scripts/normalize-help.mjs <input> <output>')
}

const raw = readFileSync(inputPath, 'utf8').replace(/\r\n/g, '\n')

const withoutAnsi = raw
  // ANSI CSI sequences (colors/cursor controls)
  .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
  // ANSI OSC sequences (window title, hyperlinks)
  .replace(/\u001B\][^\u0007]*(\u0007|\u001B\\)/g, '')

const lines = withoutAnsi
  .split('\n')
  .filter(line => !line.startsWith('npm warn exec The following package was not found and will be installed:'))
  .filter(line => !line.startsWith('npm warn deprecated '))
  .map(line => line.replace(/[ \t]+$/g, ''))

while (lines.length > 0 && lines[0] === '') {
  lines.shift()
}

while (lines.length > 0 && lines.at(-1) === '') {
  lines.pop()
}

const normalized = lines.join('\n')
writeFileSync(outputPath, normalized.length > 0 ? `${normalized}\n` : '')
