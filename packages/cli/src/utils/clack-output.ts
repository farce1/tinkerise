/**
 * Clack prompts wrapper that injects `output: process.stderr` when the CLI
 * is in --json mode (D-13). Non-log helpers (intro/outro/spinner/etc.) are
 * re-exported as-is since they are only used on the human/interactive path
 * which is unreachable in --json mode.
 *
 * Phase 33 scope: the four target commands (list, doctor, preset list/show)
 * AND preset.ts globally migrate from the direct clack import to this wrapper
 * (per D-13). Other commands (add, scaffold, update, config) are unchanged.
 */

import type { Writable } from 'node:stream'
import * as clack from '@clack/prompts'
import { isJsonMode } from './output-mode.js'

interface StreamOpts {
  output?: Writable
}

/**
 * Returns the stderr-redirect options when in JSON mode, or `undefined`
 * otherwise. Returning `undefined` (rather than `{}`) preserves the
 * pre-D-13 human-path calling convention: `log.info(msg)` invokes
 * `clack.log.info(msg)` with no second argument in non-JSON mode, which
 * keeps existing call-site mocks (e.g., preset.test.ts) compatible with
 * the wrapper migration.
 */
function streamOpts(): StreamOpts | undefined {
  return isJsonMode() ? { output: process.stderr } : undefined
}

export const log = {
  info: (msg: string) => {
    const opts = streamOpts()
    return opts ? clack.log.info(msg, opts) : clack.log.info(msg)
  },
  success: (msg: string) => {
    const opts = streamOpts()
    return opts ? clack.log.success(msg, opts) : clack.log.success(msg)
  },
  warn: (msg: string) => {
    const opts = streamOpts()
    return opts ? clack.log.warn(msg, opts) : clack.log.warn(msg)
  },
  error: (msg: string) => {
    const opts = streamOpts()
    return opts ? clack.log.error(msg, opts) : clack.log.error(msg)
  },
  step: (msg: string) => {
    const opts = streamOpts()
    return opts ? clack.log.step(msg, opts) : clack.log.step(msg)
  },
  message: (msg: string) => {
    const opts = streamOpts()
    return opts ? clack.log.message(msg, opts) : clack.log.message(msg)
  },
}

export { cancel, intro, isCancel, note, outro, spinner } from '@clack/prompts'
