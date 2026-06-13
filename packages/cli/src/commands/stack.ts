import type { Command } from 'commander'
import type { ScaffoldOptions } from './scaffold.js'
import { enhancementRegistry, findClosestMatch, getAllScaffolders, InvalidStackTokensError, parseStackTokens } from '@tinkerise/core'
import { runDirectExecution } from './scaffold.js'

type BoolOption
  = | 'typescript' | 'tailwind' | 'biome' | 'srcDir' | 'appRouter'
    | 'empty' | 'overwrite' | 'api' | 'turbopack' | 'reactCompiler'

// Parser emits kebab-case canonical flags; ScaffoldOptions reads camelCase fields.
const FLAG_TO_OPTION: Record<string, BoolOption> = {
  'typescript': 'typescript',
  'tailwind': 'tailwind',
  'biome': 'biome',
  'src-dir': 'srcDir',
  'app-router': 'appRouter',
  'empty': 'empty',
  'overwrite': 'overwrite',
  'api': 'api',
  'turbopack': 'turbopack',
  'react-compiler': 'reactCompiler',
}

export interface StackResolution {
  framework: string
  category: string
  name?: string
  preselected: string[]
  enhancements: string[]
  unknown: string[]
}

export function tokensToScaffold(tokens: string[]): StackResolution {
  const frameworks = getAllScaffolders().map(s => ({ name: s.name, category: s.category }))
  const enhancementIds = [...enhancementRegistry.keys()]
  const parsed = parseStackTokens(tokens, { frameworks, enhancementIds })

  if (parsed.unknown.length > 0) {
    const bad = parsed.unknown[0]!
    const suggestion = findClosestMatch(bad, [...frameworks.map(f => f.name), ...enhancementIds, 'typescript', 'tailwind', 'biome'])
    throw new InvalidStackTokensError(`Unknown token '${bad}'.`, suggestion ? `Did you mean '${suggestion}'?` : undefined)
  }

  if (!parsed.framework)
    throw new InvalidStackTokensError(`Could not identify a framework in: ${tokens.join(' ')}`)

  return {
    framework: parsed.framework,
    category: parsed.category!,
    name: parsed.name,
    preselected: Object.keys(parsed.flags).filter(k => parsed.flags[k]),
    enhancements: parsed.enhancements,
    unknown: parsed.unknown,
  }
}

export async function runStackMode(tokens: string[], cmd: Command, options: ScaffoldOptions): Promise<void> {
  const r = tokensToScaffold(tokens)

  for (const flag of r.preselected) {
    const key = FLAG_TO_OPTION[flag]
    if (key)
      options[key] = true
  }

  await runDirectExecution(r.category, r.framework, r.name, cmd, options)

  if (r.enhancements.length > 0)
    process.stdout.write(`\nNext: add your enhancements\n  tinkerise add ${r.enhancements.join(' ')}\n`)
}
