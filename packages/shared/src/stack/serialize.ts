/**
 * Stack command serializer (Tier D web builder) — inverse of parseStackTokens.
 * Pure and runtime-dependency-free (type-only import) so it is safe to bundle
 * client-side in the docs-site stack builder.
 */
import type { ScaffolderCategory } from '../index.js'
import type { TinkeriseLock } from '../lock/index.js'

export interface StackSelection {
  framework: string
  category: ScaffolderCategory
  name?: string
  /** Canonical scaffold flag names, e.g. ['typescript', 'tailwind', 'src-dir'] */
  flags?: string[]
  /** Enhancement ids, e.g. ['eslint', 'prettier'] */
  enhancements?: string[]
}

export interface StackCommand {
  /** Primary scaffold command */
  scaffold: string
  /** Follow-up enhancement command, present only when enhancements are selected */
  add?: string
}

/**
 * Turn a stack selection into the copy-paste `tinkerise …` command(s).
 * Enhancements are emitted as a separate `add` command because the scaffold
 * step delegates to the upstream tool and applies enhancements afterwards.
 */
export function buildStackCommand(selection: StackSelection, programName = 'tinkerise'): StackCommand {
  const { framework, category, name, flags = [], enhancements = [] } = selection

  const parts = [programName, category, framework]
  if (name)
    parts.push(name)
  for (const flag of flags)
    parts.push(`--${flag}`)

  const result: StackCommand = { scaffold: parts.join(' ') }
  if (enhancements.length > 0)
    result.add = `${programName} add ${enhancements.join(' ')}`

  return result
}

export interface StackLockOptions {
  /** tinkerise version recorded as createdWith */
  version: string
  packageManager: string
}

/**
 * Build a reproducible tinkerise.lock from a stack selection. schemaVersion is
 * pinned to 1 — the TinkeriseLock literal type makes any LOCK_SCHEMA_VERSION bump
 * a compile error here, so it cannot silently drift.
 */
export function buildStackLock(selection: StackSelection, opts: StackLockOptions): TinkeriseLock {
  const flags: Record<string, boolean> = {}
  for (const flag of selection.flags ?? [])
    flags[flag] = true

  return {
    schemaVersion: 1,
    framework: selection.framework,
    category: selection.category,
    flags,
    enhancements: (selection.enhancements ?? []).map(id => ({ id, version: null })),
    packageManager: opts.packageManager,
    createdWith: opts.version,
  }
}
