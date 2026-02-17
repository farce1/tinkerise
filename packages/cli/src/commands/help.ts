/**
 * Per-scaffolder help text — shows only unified flags, not native upstream flags.
 *
 * Per locked decision: `tinkerise web next --help` shows only tinkerise's
 * unified flags. Native flags work but are not advertised in help output.
 */

import { getScaffolder } from '@tinkerise/core'
import { getScaffolderMetadata } from '@tinkerise/core'

/**
 * Build custom help text for a scaffolder showing only unified flags.
 * Returns empty string if scaffolder not found.
 */
export function buildScaffolderHelpText(scaffolderName: string): string {
  const entry = getScaffolder(scaffolderName)
  if (!entry) return ''

  const metadata = getScaffolderMetadata(scaffolderName)
  const displayName = metadata?.displayName ?? scaffolderName

  const lines: string[] = []
  lines.push(`Usage: tinkerise web ${scaffolderName} <name> [options]`)
  lines.push('')
  lines.push(`Scaffold a new ${displayName} project`)
  if (metadata?.description) lines.push(metadata.description)
  lines.push('')
  lines.push('Supported flags:')

  for (const flag of entry.flags) {
    const flagStr = `  --${flag.unified}`
    if (flag.native === '') {
      lines.push(`${flagStr}${' '.repeat(Math.max(1, 24 - flagStr.length))}(always enabled)`)
    } else {
      lines.push(flagStr)
    }
  }

  if (entry.flags.length === 0) {
    lines.push('  (no scaffolder-specific flags)')
  }

  lines.push('')
  lines.push('Passthrough:')
  lines.push(`  -- <args>               Pass additional args directly to ${displayName}`)
  lines.push('')
  lines.push(`Native ${displayName} flags also accepted via passthrough.`)

  return lines.join('\n')
}
