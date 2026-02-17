/**
 * Project name text input prompt with validation.
 */

import * as p from '@clack/prompts'

/**
 * Validate a project name.
 *
 * Rules:
 * - Must not be empty
 * - Must start with a lowercase letter or number
 * - May contain lowercase letters, numbers, hyphens, dots, underscores
 */
export function validateProjectName(value: string | undefined): string | undefined {
  if (!value || value.trim().length === 0) {
    return 'Project name is required'
  }
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(value)) {
    return 'Use lowercase letters, numbers, hyphens, dots, and underscores (must start with letter or number)'
  }
  return undefined
}

/**
 * Prompt user for a project name.
 *
 * @param framework - Framework name used for placeholder
 * @returns Project name string
 */
export async function promptProjectName(framework: string): Promise<string> {
  const result = await p.text({
    message: 'Project name:',
    placeholder: `my-${framework}-app`,
    validate: validateProjectName,
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  return result as string
}
