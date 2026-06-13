import type { ScaffolderCategory } from '@tinkerise/shared'

const FRAMEWORK_ALIASES: Record<string, string> = {
  'nextjs': 'next',
  'react-native': 'rn',
  'reactnative': 'rn',
  'golang': 'go',
  'fast-api': 'fastapi',
}

const SCAFFOLD_FLAG_ALIASES: Record<string, string> = {
  'ts': 'typescript',
  'typescript': 'typescript',
  'tailwind': 'tailwind',
  'tw': 'tailwind',
  'biome': 'biome',
  'src-dir': 'src-dir',
  'srcdir': 'src-dir',
  'app-router': 'app-router',
  'approuter': 'app-router',
  'empty': 'empty',
  'overwrite': 'overwrite',
  'api': 'api',
  'turbopack': 'turbopack',
  'react-compiler': 'react-compiler',
}

const NAME_RE = /^[a-z0-9._-]{1,64}$/

export interface FrameworkVocab {
  name: string
  category: ScaffolderCategory
}

export interface ParseRegistries {
  frameworks: FrameworkVocab[]
  enhancementIds: string[]
}

export interface ParsedStack {
  name?: string
  framework?: string
  category?: ScaffolderCategory
  flags: Record<string, boolean>
  enhancements: string[]
  unknown: string[]
}

/** Classify each token: framework -> scaffold flag -> enhancement -> name -> unknown. */
export function parseStackTokens(tokens: string[], reg: ParseRegistries): ParsedStack {
  const fwByName = new Map(reg.frameworks.map(f => [f.name, f]))
  const enhancements = new Set(reg.enhancementIds)
  const result: ParsedStack = { flags: {}, enhancements: [], unknown: [] }

  for (const raw of tokens) {
    const token = raw.toLowerCase()

    const fw = fwByName.get(FRAMEWORK_ALIASES[token] ?? token)
    if (fw) {
      if (!result.framework) {
        result.framework = fw.name
        result.category = fw.category
      }
      else if (result.framework !== fw.name) {
        result.unknown.push(raw)
      }
      continue
    }

    const flag = SCAFFOLD_FLAG_ALIASES[token]
    if (flag) {
      result.flags[flag] = true
      continue
    }

    if (enhancements.has(token)) {
      if (!result.enhancements.includes(token))
        result.enhancements.push(token)
      continue
    }

    if (!result.name && NAME_RE.test(token)) {
      result.name = token
      continue
    }

    result.unknown.push(raw)
  }

  return result
}
