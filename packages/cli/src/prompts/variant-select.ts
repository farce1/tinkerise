/**
 * Variant selection prompts for Vite templates and T3 components.
 *
 * Wraps variant selection in @clack/prompts UI for consistent look.
 * Supports flag-if-provided, prompt-if-omitted pattern from Phase 3.
 */

import * as p from '@clack/prompts'

/** All Vite templates with popular ones at top per locked decision */
export const VITE_TEMPLATES = [
  { value: 'react', label: 'React', hint: 'recommended' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'preact', label: 'Preact' },
  { value: 'lit', label: 'Lit' },
  { value: 'qwik', label: 'Qwik' },
  { value: 'vanilla', label: 'Vanilla' },
] as const

/** T3 component options for multiselect */
export const T3_COMPONENTS = [
  { value: 'trpc', label: 'tRPC', hint: 'recommended' },
  { value: 'prisma', label: 'Prisma' },
  { value: 'drizzle', label: 'Drizzle' },
  { value: 'nextAuth', label: 'NextAuth.js' },
  { value: 'appRouter', label: 'App Router', hint: 'recommended' },
] as const

/**
 * Select a Vite template via interactive prompt.
 * If preselected is provided, returns it immediately (flag bypass).
 */
export async function selectViteTemplate(preselected?: string): Promise<string> {
  if (preselected) {
    return preselected
  }

  const result = await p.select({
    message: 'Select a Vite template:',
    options: VITE_TEMPLATES.map(t => ({ value: t.value, label: t.label, hint: 'hint' in t ? t.hint : undefined })),
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  return result as string
}

/**
 * Resolve the final Vite template name with TypeScript suffix.
 *
 * Handles edge cases:
 * - No TypeScript: return base unchanged
 * - Already has -ts suffix: return base (prevent double-suffix)
 * - react-swc special case: return react-swc-ts
 * - Default: append -ts
 *
 * Pure function, no prompts.
 */
export function resolveViteTemplate(base: string, typescript: boolean): string {
  if (!typescript) {
    return base
  }

  if (base.endsWith('-ts')) {
    return base
  }

  if (base === 'react-swc') {
    return 'react-swc-ts'
  }

  return `${base}-ts`
}

/**
 * Select T3 components via interactive multiselect.
 * If preselected is provided and non-empty, returns it immediately (flag bypass).
 */
export async function selectT3Components(preselected?: string[]): Promise<string[]> {
  if (preselected && preselected.length > 0) {
    return preselected
  }

  const result = await p.multiselect({
    message: 'Select T3 components:',
    options: T3_COMPONENTS.map(c => ({ value: c.value, label: c.label, hint: 'hint' in c ? c.hint : undefined })),
    required: false,
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  return result as string[]
}
