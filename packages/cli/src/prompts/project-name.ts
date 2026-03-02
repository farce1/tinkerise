/**
 * Project name text input prompt with validation.
 */

import * as p from '@clack/prompts'
import { ProjectNameSchema, SAFE_NAME_RULES } from '@tinkerise/shared'

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
  if (!ProjectNameSchema.safeParse(value).success) {
    return SAFE_NAME_RULES
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
