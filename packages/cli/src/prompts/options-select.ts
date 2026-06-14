/**
 * Framework-specific options multiselect prompt.
 *
 * Presents toggleable options (TypeScript, Tailwind, ESLint, etc.)
 * as a multiselect checklist. Options vary per framework.
 */

import * as p from '@clack/prompts'

/** Available options per scaffolder name */
export const FRAMEWORK_OPTIONS: Record<string, Array<{ value: string, label: string, hint?: string }>> = {
  next: [
    { value: 'typescript', label: 'TypeScript', hint: 'recommended' },
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'eslint', label: 'ESLint' },
    { value: 'biome', label: 'Biome', hint: 'alternative to ESLint' },
  ],
  astro: [
    { value: 'tailwind', label: 'Tailwind CSS' },
  ],
  t3: [
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'eslint', label: 'ESLint' },
    { value: 'biome', label: 'Biome', hint: 'alternative to ESLint' },
    { value: 'app-router', label: 'App Router', hint: 'recommended' },
  ],
  tanstack: [
    { value: 'tailwind', label: 'Tailwind CSS' },
  ],
}

/**
 * Prompt user to select framework-specific options.
 *
 * @param framework - Framework name to look up options for
 * @param preselected - Options already selected via CLI flags
 * @returns Selected option values
 */
export async function selectFrameworkOptions(
  framework: string,
  preselected?: string[],
): Promise<string[]> {
  const pre = preselected ?? []
  const available = FRAMEWORK_OPTIONS[framework]
  // No interactive options for this framework — keep any preselected flags
  // (e.g. from a preset or CLI) rather than dropping them.
  if (!available || available.length === 0)
    return [...new Set(pre)]

  const result = await p.multiselect({
    message: 'Select options:',
    options: available,
    required: false,
    initialValues: pre,
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  // multiselect only returns values present in `available`, so re-add any
  // preselected flags not offered as checkboxes (e.g. app-router for next).
  const selected = result as string[]
  const offList = pre.filter(v => !available.some(o => o.value === v))
  return [...new Set([...selected, ...offList])]
}
