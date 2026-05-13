/**
 * Static enum values per CLI flag / positional argument, baked into
 * emitted shell completion scripts at generation time (D-07, D-08).
 *
 * Hand-maintained because Commander.js does not expose enum metadata
 * on `.option()` calls. Update this file whenever a new package manager,
 * category, or shell is added to the supported set — the addition is
 * already a guarded decision elsewhere in the codebase.
 *
 * Security: values are hard-coded TypeScript string literals at
 * generation time; consumed via shells' native candidate-set primitives
 * (compgen -W, _describe, complete -a) which present candidates as data,
 * not commands (D-11b).
 */

/**
 * The closed set of `kind` values the hidden `tinkerise __complete <kind>`
 * subcommand accepts. Plan 02 owns this list; Plan 03's generators
 * reference it via the `__complete <kind>` snippets they emit (D-09).
 *
 * Includes 'scaffolders:web' | 'scaffolders:backend' | 'scaffolders:mobile'
 * because those category-suffixed kinds are emitted by the generators for
 * the top-level `tinkerise <category>` positional position (e.g.,
 * `tinkerise web <TAB>` looks up `scaffolders:web`).
 */
export type CompleteKind =
  | 'scaffolders'
  | 'enhancements'
  | 'presets'
  | 'categories'
  | 'scaffolders:web'
  | 'scaffolders:backend'
  | 'scaffolders:mobile'

/**
 * Stable enum values for option flags whose values are a known, small set.
 * Keys are the long-form flag exactly as registered with Commander.
 */
export const FLAG_ENUMS: Record<string, readonly string[]> = {
  '--package-manager': ['npm', 'pnpm', 'yarn', 'bun'],
}

/**
 * Stable enum values for the first positional argument of a given command.
 * Keys are the command path joined by spaces ('' for the root command).
 */
export const POSITIONAL_ENUMS: Record<string, readonly string[]> = {
  '': ['web', 'backend', 'mobile'],
  'list': ['web', 'backend', 'mobile'],
  'completion': ['bash', 'zsh', 'fish'],
}

/**
 * Dynamic-completion mapping for option flags whose value is fetched at
 * tab time via `tinkerise __complete <kind>`. Keys are long-form flags
 * exactly as registered with Commander; values are the `__complete` kind
 * the generator should embed into the per-shell dynamic-lookup snippet.
 *
 * Per D-09 — the generators MUST consume this map (NOT inline the
 * mapping themselves), so all three (bash/zsh/fish) agree on which
 * flag routes to which kind. A single source of truth here prevents
 * the "drift across generators" failure mode flagged in plan-checker
 * review.
 */
export const DYNAMIC_FLAGS: Record<string, CompleteKind> = {
  '--preset': 'presets',
}

/**
 * Dynamic-completion mapping for the first positional argument of a
 * given command path (D-07). Keys are the command path joined by
 * spaces ('' for the root command); values are the `__complete` kind
 * the generator should embed into the per-shell dynamic-lookup snippet.
 *
 * Examples:
 * - `tinkerise add <TAB>`        -> kind: 'enhancements'
 * - `tinkerise web <TAB>`        -> kind: 'scaffolders:web'
 * - `tinkerise backend <TAB>`    -> kind: 'scaffolders:backend'
 * - `tinkerise mobile <TAB>`     -> kind: 'scaffolders:mobile'
 * - `tinkerise preset use <TAB>` -> kind: 'presets'
 * - `tinkerise preset delete <TAB>` -> kind: 'presets'
 * - `tinkerise preset show <TAB>`   -> kind: 'presets'
 *
 * Same single-source-of-truth contract as DYNAMIC_FLAGS — generators
 * MUST consume this map.
 */
export const DYNAMIC_POSITIONALS: Record<string, CompleteKind> = {
  'add': 'enhancements',
  'web': 'scaffolders:web',
  'backend': 'scaffolders:backend',
  'mobile': 'scaffolders:mobile',
  'preset use': 'presets',
  'preset delete': 'presets',
  'preset show': 'presets',
}

/**
 * The closed set of `kind` values the hidden `tinkerise __complete <kind>`
 * subcommand accepts at runtime. Excludes the dynamic 'scaffolders:<category>'
 * suffix forms because the runtime parser in __complete.ts splits on ':' once
 * and validates the suffix against a separate allow-list. Generators use the
 * `CompleteKind` type above (which includes the suffix forms) for type safety
 * at script-emission time.
 */
export const COMPLETE_KINDS = ['scaffolders', 'enhancements', 'presets', 'categories'] as const
