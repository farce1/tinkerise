/* eslint-disable no-template-curly-in-string -- this file builds shell-script
   strings (bash/zsh/fish) inline; many literal `${VAR}` parameter expansions
   appear in single-quoted strings that ESLint conflates with JS template
   literal placeholders. The strings below are literal shell source, not JS
   templates. */
/**
 * Phase 34 Plan 04 — shell-spawning conformance harness (D-15 Layer 2).
 *
 * Spawns the requested shell with profile/rc loading disabled, sources the
 * emitted completion script, drives a TAB sequence after `partialCommand`,
 * and returns the captured candidate list.
 *
 * Task 2a ships the bash branch + the function shell (mockBin accepted but
 * no-op). Task 2b fills in zsh / fish branches and implements the mockBin
 * temp-dir + PATH override flow per D-18.
 */

import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * @typedef {object} MockBin
 * @property {Record<string, string[] | 'FAIL'>} [__complete] Per-`kind` canned
 *   responses for the fake `tinkerise __complete <kind>` call. `'FAIL'`
 *   makes the shim exit non-zero so the completion script's graceful-fallback
 *   path is exercised (D-19).
 *
 * @typedef {object} RunOptions
 * @property {'bash' | 'zsh' | 'fish'} shell Which shell to drive.
 * @property {string} completionScript The script as emitted by
 *   `tinkerise completion <shell>`.
 * @property {string} partialCommand The argv string the user has typed
 *   so far. The harness simulates pressing TAB at the end. A trailing
 *   space in `partialCommand` matters: it means the cursor is positioned
 *   on the next, empty token.
 * @property {MockBin} [mockBin] If set, a fake `tinkerise` binary is
 *   written to a temp dir and prepended to PATH so dynamic lookups
 *   (`tinkerise __complete <kind>`) return canned responses.
 *
 * @typedef {object} RunResult
 * @property {string[]} candidates Newline-split, empty-filtered.
 * @property {number} exitCode Final shell exit code.
 * @property {string} stderr Anything the shell wrote to stderr.
 */

/**
 * Drive the requested shell through a TAB sequence and capture candidates.
 *
 * @param {RunOptions} options Per-scenario harness inputs.
 * @returns {Promise<RunResult>} Captured candidate list + exit code + stderr.
 */
export async function runShellCompletion(options) {
  const { shell, completionScript, partialCommand, mockBin } = options

  const tempRoot = await mkdtemp(join(tmpdir(), `tinkerise-completion-${shell}-`))
  try {
    let pathPrefix = ''
    if (mockBin) {
      const mockBinDir = await writeMockTinkerise(tempRoot, mockBin)
      pathPrefix = `${mockBinDir}:`
    }

    const env = {
      ...process.env,
      PATH: pathPrefix + (process.env.PATH ?? ''),
      // Force a deterministic locale + disable color so candidate output
      // is stable across CI runners.
      LANG: 'C',
      LC_ALL: 'C',
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    }

    switch (shell) {
      case 'bash':
        return await runBash(tempRoot, completionScript, partialCommand, env)
      case 'zsh':
        return await runZsh(tempRoot, completionScript, partialCommand, env)
      case 'fish':
        return await runFish(tempRoot, completionScript, partialCommand, env)
      default:
        throw new Error(`unknown shell: ${shell}`)
    }
  }
  finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
}

/**
 * @param {string} tempRoot Per-scenario scratch dir.
 * @param {string} completionScript Emitted bash completion script body.
 * @param {string} partialCommand Argv string the user typed before TAB.
 * @param {NodeJS.ProcessEnv} env Environment for the spawned shell.
 * @returns {Promise<RunResult>} Captured candidates from `_tinkerise`.
 */
async function runBash(tempRoot, completionScript, partialCommand, env) {
  const scriptPath = join(tempRoot, 'completion.bash')
  await writeFile(scriptPath, completionScript, 'utf8')

  // Tokenize the partialCommand the same way bash's Readline does for
  // programmable completion: split on whitespace, then push an empty
  // trailing token if the input ends with a space (the user is starting
  // a new word at TAB time).
  const words = tokenize(partialCommand)
  const cwordIndex = words.length - 1
  const arrayLiteral = words.map(w => quoteBashSingle(w)).join(' ')

  // The completion function `_tinkerise` is sourced from the emitted
  // script. We then set COMP_WORDS / COMP_CWORD ourselves and invoke
  // the function — exactly how bash Readline does at TAB time — and
  // print the resulting COMPREPLY one per line.
  const cmd = [
    `source ${quoteBashSingle(scriptPath)}`,
    `COMP_WORDS=(${arrayLiteral})`,
    `COMP_CWORD=${cwordIndex}`,
    `COMP_LINE=${quoteBashSingle(partialCommand)}`,
    `COMP_POINT=${partialCommand.length}`,
    '_tinkerise',
    'printf \'%s\\n\' "${COMPREPLY[@]}"',
  ].join('; ')

  // Equivalent of: `bash --noprofile --norc -c '<cmd>'` (separate argv entries
  // for the spawn call) — keeps the shell free of user dotfiles per D-15.
  return await spawnAndCollect('bash', ['--noprofile', '--norc', '-c', cmd], env)
}

/**
 * @param {string} _tempRoot Per-scenario scratch dir.
 * @param {string} _completionScript Emitted zsh completion script body.
 * @param {string} _partialCommand Argv string the user typed before TAB.
 * @param {NodeJS.ProcessEnv} _env Environment for the spawned shell.
 * @returns {Promise<RunResult>} Task 2b: captured candidates.
 */
async function runZsh(_tempRoot, _completionScript, _partialCommand, _env) {
  throw new Error('not yet implemented - Task 2b')
}

/**
 * @param {string} _tempRoot Per-scenario scratch dir.
 * @param {string} _completionScript Emitted fish completion script body.
 * @param {string} _partialCommand Argv string the user typed before TAB.
 * @param {NodeJS.ProcessEnv} _env Environment for the spawned shell.
 * @returns {Promise<RunResult>} Task 2b: captured candidates.
 */
async function runFish(_tempRoot, _completionScript, _partialCommand, _env) {
  throw new Error('not yet implemented - Task 2b')
}

/**
 * Tokenize a partial command the way bash's COMP_WORDS works.
 * Trailing whitespace produces an extra empty token to represent the
 * cursor sitting on a new, empty word.
 *
 * @param {string} partialCommand Argv prefix typed by the user.
 * @returns {string[]} Tokens equivalent to bash's COMP_WORDS array.
 */
function tokenize(partialCommand) {
  const trimmed = partialCommand.replace(/\s+$/, '')
  const tokens = trimmed.length === 0 ? [] : trimmed.split(/\s+/)
  if (partialCommand !== trimmed)
    tokens.push('')
  if (tokens.length === 0)
    tokens.push('')
  return tokens
}

/**
 * @param {string} value String to embed inside a bash single-quoted token.
 * @returns {string} The value wrapped in `'...'` with embedded single quotes escaped.
 */
function quoteBashSingle(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/**
 * Write a fake `tinkerise` binary that responds only to the
 * `__complete <kind>` contract. Used by D-18 dynamic-completion scenarios.
 *
 * @param {string} tempRoot Per-scenario scratch dir.
 * @param {MockBin} mockBin Per-`kind` canned responses (or `'FAIL'`).
 * @returns {Promise<string>} Path to the directory containing the fake binary.
 */
async function writeMockTinkerise(tempRoot, mockBin) {
  const binDir = join(tempRoot, 'mockbin')
  await mkdir(binDir, { recursive: true })

  const responses = JSON.stringify(mockBin.__complete ?? {})
  const script = `#!/usr/bin/env node
const [, , subcommand, kind] = process.argv;
if (subcommand !== '__complete') {
  process.stderr.write('mock tinkerise: only __complete is supported\\n');
  process.exit(2);
}
const responses = ${responses};
if (!(kind in responses)) {
  process.stderr.write('mock tinkerise: unknown kind ' + kind + '\\n');
  process.exit(1);
}
const value = responses[kind];
if (value === 'FAIL') { process.exit(1); }
if (Array.isArray(value) && value.length > 0) {
  process.stdout.write(value.join('\\n') + '\\n');
}
process.exit(0);
`
  const binPath = join(binDir, 'tinkerise')
  await writeFile(binPath, script, 'utf8')
  await chmod(binPath, 0o755)
  return binDir
}

/**
 * @param {string} command Executable to spawn (e.g. `bash`).
 * @param {string[]} args Argv passed to the spawned process.
 * @param {NodeJS.ProcessEnv} env Environment for the spawned process.
 * @returns {Promise<RunResult>} Captured stdout (split into candidates), exit code, and stderr.
 */
function spawnAndCollect(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] })
    const stdoutChunks = []
    const stderrChunks = []
    child.stdout.on('data', d => stdoutChunks.push(d))
    child.stderr.on('data', d => stderrChunks.push(d))
    child.on('error', reject)
    child.on('close', (exitCode) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf8')
      const stderr = Buffer.concat(stderrChunks).toString('utf8')
      const candidates = stdout.split('\n').map(s => s.trim()).filter(Boolean)
      resolve({ candidates, exitCode: exitCode ?? 1, stderr })
    })
  })
}
