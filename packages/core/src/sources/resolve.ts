/**
 * External source resolver (Tier C) — parse a user-supplied source specifier
 * into a canonical, case-normalized id. Canonicalization is security-relevant:
 * the trust store keys on `id`, so `github:Acme/Repo` and `github:acme/repo`
 * must resolve to the same id (no trust bypass via format variation).
 */

import { TinkeriseError } from '../errors/index.js'

export type SourceKind = 'npm' | 'github'

export interface ResolvedSource {
  kind: SourceKind
  /** Canonical trust-store id, e.g. `npm:foo` or `github:owner/repo`. */
  id: string
}

const NPM_RE = /^npm:(@[a-z0-9][\w.-]*\/[a-z0-9][\w.-]*|[a-z0-9][\w.-]*)$/i
const GITHUB_RE = /^github:([a-z0-9][\w.-]*)\/([a-z0-9][\w.-]*)$/i

/**
 * Parse `npm:<package>` or `github:<owner>/<repo>` into a canonical source.
 * Throws on anything unrecognized.
 */
export function parseSource(spec: string): ResolvedSource {
  const trimmed = spec.trim()

  const npm = NPM_RE.exec(trimmed)
  if (npm)
    return { kind: 'npm', id: `npm:${npm[1]!.toLowerCase()}` }

  const github = GITHUB_RE.exec(trimmed)
  if (github)
    return { kind: 'github', id: `github:${github[1]!.toLowerCase()}/${github[2]!.toLowerCase()}` }

  throw new TinkeriseError({
    message: `Unrecognized source '${spec}'.`,
    code: 'INVALID_SOURCE',
    suggestion: 'Use npm:<package> or github:<owner>/<repo>.',
  })
}
