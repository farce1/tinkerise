/**
 * `tinkerise add` command — apply enhancements to existing projects.
 *
 * Entry modes:
 * - `tinkerise add` — interactive multi-select picker
 * - `tinkerise add eslint prettier` — direct (no prompts)
 *
 * Orchestrates: context build -> module selection -> execution -> summary
 */

import type { ConflictAction, EnhancementModule } from '@tinkerise/core'
import * as p from '@clack/prompts'
import {
  allEnhancementModules,
  buildProjectContext,
  ENHANCEMENT_NEXT_STEPS,
  enhancementRegistry,
  ensureSourceTrusted,
  isCI,
  isSourceTrusted,
  loadNpmEnhancement,
  parseSource,
  runEnhancements,
  showEnhancementSummary,
  showPerEnhancementSummary,
  TinkeriseError,
  UnknownEnhancementError,
} from '@tinkerise/core'
import { readLockFile, recordEnhancements } from '../context/lock.js'
import { getSessionContext } from '../context/session.js'
import { showEnhancementPicker } from '../prompts/enhancement-select.js'

export interface AddOptions {
  verbose?: boolean
  /** Re-apply the enhancements recorded in tinkerise.lock */
  fromLock?: boolean
}

/** Source specs (npm:/github:) are external; bare names are built-in enhancement ids. */
const EXTERNAL_SOURCE_RE = /^(?:npm|github):/

/** Interactive per-source consent: explicit warning, defaults to No. */
async function promptSourceConsent({ id }: { id: string }): Promise<boolean> {
  if (isCI)
    return false // defense-in-depth: never auto-consent non-interactively
  p.log.warn(`'${id}' is an external source. Trusting it runs third-party code on your machine.`)
  const result = await p.confirm({ message: `Trust and run ${id}?`, initialValue: false })
  if (p.isCancel(result)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  return result === true
}

/**
 * Resolve an external source spec to an EnhancementModule, gated by per-source
 * consent. Returns null when consent is declined interactively. In CI an
 * untrusted source errors (pre-trust required) — third-party code never runs
 * non-interactively without a prior explicit trust decision.
 */
async function resolveExternalEnhancement(spec: string): Promise<EnhancementModule | null> {
  const { kind, id } = parseSource(spec)
  if (kind !== 'npm') {
    throw new TinkeriseError({
      message: `${kind} sources are not supported yet.`,
      code: 'SOURCE_KIND_UNSUPPORTED',
      suggestion: 'Use an npm enhancement: tinkerise add npm:tinkerise-enhancement-<name>',
    })
  }
  if (isCI && !(await isSourceTrusted(id))) {
    throw new TinkeriseError({
      message: `External source '${id}' is not trusted.`,
      code: 'SOURCE_NOT_TRUSTED',
      suggestion: `Run: tinkerise trust add ${id}`,
    })
  }
  if (!(await ensureSourceTrusted(id, promptSourceConsent))) {
    p.log.info(`Skipped ${id} (not trusted).`)
    return null
  }
  const packageName = id.slice('npm:'.length)
  const mod = await loadNpmEnhancement(packageName)
  if (!mod) {
    throw new TinkeriseError({
      message: `Could not load an enhancement from '${id}'.`,
      code: 'SOURCE_LOAD_FAILED',
      suggestion: `Ensure ${packageName} is installed and exports a tinkerise enhancement.`,
    })
  }
  return mod
}

/**
 * Run the `tinkerise add` command.
 *
 * @param enhancementNames - Enhancement IDs from CLI args (empty = interactive picker)
 * @param options - Command options
 */
export async function runAddCommand(
  enhancementNames: string[],
  options: AddOptions,
): Promise<void> {
  const session = await getSessionContext()
  const rootDir = session.projectDir ?? process.cwd()

  // 0. --from-lock: source enhancement ids from tinkerise.lock (re-apply).
  let names = enhancementNames
  if (options.fromLock) {
    const lock = await readLockFile(rootDir)
    if (!lock) {
      throw new TinkeriseError({
        message: 'No tinkerise.lock found in this directory.',
        code: 'LOCK_NOT_FOUND',
        suggestion: 'Run tinkerise add <enhancements> to set up tooling first.',
      })
    }
    names = [...new Set([...lock.enhancements.map(e => e.id), ...enhancementNames])]
    if (names.length === 0) {
      p.log.info('No enhancements recorded in tinkerise.lock — nothing to re-apply.')
      return
    }
  }

  // 1. Build project context
  const ctx = await buildProjectContext({
    rootDir,
    packageManager: session.packageManager,
    framework: session.framework,
    freshScaffold: !!session.projectDir,
    verbose: options.verbose ?? false,
    onAmbiguousFramework: isCI
      ? undefined
      : async (detected) => {
        const result = await p.select({
          message: 'Multiple frameworks detected. Which is the primary one?',
          options: detected.map(fw => ({ value: fw, label: fw })),
        })
        if (p.isCancel(result)) {
          p.cancel('Cancelled.')
          process.exit(0)
        }
        return result as typeof detected[number]
      },
  })

  // 2. Determine which enhancements to run
  let modules: EnhancementModule[]

  if (names.length === 0) {
    // Interactive: show multi-select picker
    if (isCI) {
      throw new TinkeriseError({
        message: 'No enhancements specified. In CI, pass enhancement names as arguments.',
        code: 'CI_MISSING_ARGS',
        suggestion: 'Example: tinkerise add eslint prettier',
      })
    }
    modules = await showEnhancementPicker(ctx)
    if (modules.length === 0)
      return
  }
  else {
    // Direct: resolve names to modules (built-in ids + external npm sources)
    modules = []
    for (const name of names) {
      if (EXTERNAL_SOURCE_RE.test(name)) {
        const mod = await resolveExternalEnhancement(name)
        if (mod)
          modules.push(mod)
      }
      else {
        const mod = enhancementRegistry.get(name)
        if (!mod) {
          throw new UnknownEnhancementError(name, allEnhancementModules.map(m => m.id))
        }
        modules.push(mod)
      }
    }
  }

  // 3. Run enhancement pipeline
  const summary = await runEnhancements({
    modules,
    context: ctx,
    interactive: !isCI,
    onConflict: async (moduleId, _filePath, diff): Promise<ConflictAction> => {
      if (isCI)
        return 'skip'
      console.log(diff)
      const action = await p.select({
        message: `${moduleId}: Config file already exists. What would you like to do?`,
        options: [
          { value: 'skip', label: 'Skip', hint: 'Keep existing config' },
          { value: 'replace', label: 'Replace', hint: 'Overwrite with new config' },
          { value: 'merge', label: 'Merge', hint: 'Deep merge configs' },
        ],
      })
      if (p.isCancel(action)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }
      return action as ConflictAction
    },
    onDependencyApproval: async (moduleId, deps): Promise<boolean> => {
      if (isCI)
        return true
      const result = await p.confirm({
        message: `${moduleId} requires: ${deps.join(', ')}. These were not installed in this run. Continue anyway?`,
      })
      if (p.isCancel(result)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }
      return result as boolean
    },
  })

  // 4. Show per-enhancement summary cards
  for (const installedId of summary.installed) {
    const mod = enhancementRegistry.get(installedId)
    if (!mod)
      continue
    const result = summary.results.get(installedId) ?? {
      success: true,
      filesModified: [],
      packagesAdded: [],
      warnings: [],
    }
    const nextSteps = ENHANCEMENT_NEXT_STEPS[installedId] ?? []
    showPerEnhancementSummary({
      moduleId: installedId,
      moduleName: mod.name,
      result,
      nextSteps,
    })
  }

  // 5. Show overall summary
  showEnhancementSummary(summary)

  // 6. Keep the lock's enhancement list in sync (best-effort, provenance only).
  try {
    await recordEnhancements(rootDir, summary.installed)
  }
  catch {
    // A stale lock must not fail an otherwise-successful add.
    p.log.warn('Could not update tinkerise.lock with the new enhancements')
  }
}
