/**
 * Prompt flow orchestration using p.group().
 *
 * Chains: framework selection -> options multiselect -> project name.
 * Supports pre-filled values to skip prompts (hybrid mode).
 * Centralized cancel handling via onCancel.
 */

import * as p from '@clack/prompts'
import type { ScaffolderCategory } from '@tinkerise/shared'
import { selectFramework } from './framework-select.js'
import { selectFrameworkOptions } from './options-select.js'
import { promptProjectName } from './project-name.js'

export interface PromptFlowOptions {
  /** Pre-provided framework (skips framework prompt) */
  framework?: string
  /** Pre-provided project name (skips name prompt) */
  name?: string
  /** Pre-selected options from flags (skips or pre-fills options prompt) */
  preselectedOptions?: string[]
  /** Filter to a specific category */
  filterCategory?: ScaffolderCategory
}

export interface PromptFlowResult {
  framework: string
  options: string[]
  name: string
}

/**
 * Run the interactive prompt flow.
 *
 * Uses p.group() for centralized cancel handling.
 * No confirmation step -- executes immediately after last prompt.
 *
 * @param opts - Pre-filled values and filters
 * @returns Framework, options, and project name
 */
export async function runPromptFlow(opts: PromptFlowOptions): Promise<PromptFlowResult> {
  const answers = await p.group(
    {
      framework: () =>
        opts.framework
          ? Promise.resolve(opts.framework)
          : selectFramework(opts.filterCategory),
      options: ({ results }) =>
        selectFrameworkOptions(results.framework!, opts.preselectedOptions),
      name: ({ results }) =>
        opts.name
          ? Promise.resolve(opts.name)
          : promptProjectName(results.framework!),
    },
    {
      onCancel: () => {
        process.exit(0) // Silent exit per user decision
      },
    },
  )

  return {
    framework: answers.framework as string,
    options: answers.options as string[],
    name: answers.name as string,
  }
}
