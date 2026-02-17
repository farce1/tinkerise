/**
 * Framework-specific options multiselect prompt.
 *
 * Presents toggleable options (TypeScript, Tailwind, ESLint, etc.)
 * as a multiselect checklist. Options vary per framework.
 */

import * as p from '@clack/prompts'

/** Available options per scaffolder name */
export const FRAMEWORK_OPTIONS: Record<string, Array<{ value: string; label: string; hint?: string }>> = {
  next: [
    { value: 'typescript', label: 'TypeScript', hint: 'recommended' },
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'eslint', label: 'ESLint' },
  ],
  astro: [
    { value: 'tailwind', label: 'Tailwind CSS' },
  ],
  t3: [
    { value: 'tailwind', label: 'Tailwind CSS' },
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
  const available = FRAMEWORK_OPTIONS[framework]
  if (!available || available.length === 0) return []

  const result = await p.multiselect({
    message: 'Select options:',
    options: available,
    required: false,
    initialValues: preselected ?? [],
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  return result as string[]
}
