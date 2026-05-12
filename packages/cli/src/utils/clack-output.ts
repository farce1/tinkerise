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

import * as clack from '@clack/prompts'
import { isJsonMode } from './output-mode.js'

interface StreamOpts {
  output?: NodeJS.WritableStream
}

function streamOpts(): StreamOpts {
  return isJsonMode() ? { output: process.stderr } : {}
}

export const log = {
  info: (msg: string) => clack.log.info(msg, streamOpts()),
  success: (msg: string) => clack.log.success(msg, streamOpts()),
  warn: (msg: string) => clack.log.warn(msg, streamOpts()),
  error: (msg: string) => clack.log.error(msg, streamOpts()),
  step: (msg: string) => clack.log.step(msg, streamOpts()),
  message: (msg: string) => clack.log.message(msg, streamOpts()),
}

export { cancel, intro, isCancel, note, outro, spinner } from '@clack/prompts'
