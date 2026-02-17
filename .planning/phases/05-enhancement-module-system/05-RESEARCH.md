# Phase 5: Enhancement Module System - Research

**Researched:** 2026-02-17
**Domain:** Module system architecture, dependency graph resolution, config detection, idempotent file operations
**Confidence:** HIGH

## Summary

Phase 5 builds the enhancement module architecture that Phase 6 and Phase 9 will populate with actual modules (ESLint, Prettier, etc.). The architecture follows create-t3-app's proven installer pattern: each module is a plain object with a standard interface (`detect` + `install`), modules declare inter-module dependencies, and a centralized version map governs package versions. The system detects project context (framework, PM, installed deps) by reading actual files -- no metadata tracking -- and resolves module execution order via topological sort of the dependency DAG.

This phase is predominantly custom architecture code with minimal external dependencies. The only new library needed is `diff` (jsdiff v8) for showing file change previews before skip/merge/replace decisions. Topological sort is a ~30-line Kahn's algorithm implementation -- no library needed. Deep merging for the "merge" conflict strategy uses `deepmerge-ts` for type-safe, performant object merging with customizable array handling. Everything else builds on the existing `@tinkerise/core` patterns (picocolors for output, Zod for schemas, existing PM detection as a template).

**Primary recommendation:** Build the module interface in `@tinkerise/core` as pure TypeScript types + Zod schemas, with project context detection reusing the existing PM detection pattern. Keep the dependency graph and execution engine in core. The CLI layer handles user prompts (skip/merge/replace) and the summary card -- same separation of concerns as the scaffolder pipeline.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Conflict resolution
- Show a diff of what would change before asking skip/merge/replace
- Merge uses intelligent deep merge: parse both configs, combine arrays (plugins, extends), merge objects deeply, flag true conflicts
- Conflicts handled one file at a time as encountered (not batched)
- In non-interactive mode (CI): fail on any conflict -- exit with error, force explicit handling via flags

#### Execution feedback
- Step-by-step log: each module announces start/done with brief status (e.g., checkmark ESLint installed)
- Always show a styled summary card after all modules complete (installed, skipped, warnings)
- Upstream tool output (npm install logs, etc.) suppressed by default -- `--verbose` flag to show everything
- Stop on first failure: halt entire chain, show what succeeded and what didn't run

#### Framework detection
- Auto-detect silently from package.json and config files -- no confirmation prompt
- On ambiguity (multiple frameworks detected): prompt user to choose the primary framework
- Works on ANY project, not just tinkerise-scaffolded ones -- detect and adapt regardless of origin
- When tinkerise just scaffolded the project (same session): carry known framework/PM context forward, skip re-detection

#### Dependency handling
- When a module depends on another not yet installed: prompt before installing deps ("husky requires lint-staged. Install both?")
- When multiple enhancements requested: auto-sort by dependency graph (topological sort) -- user doesn't need to know the right order
- No rollback on failure: keep what succeeded, report what failed -- user can fix and re-run (idempotent by design)
- No explicit tracking: detect() functions read actual config files each time to determine installed state

### Claude's Discretion
- Module interface design (detect/install function signatures, return types)
- Project context data structure
- Topological sort algorithm
- Diff display format and styling
- How same-session context is passed between scaffold and enhance

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENH-01 | Enhancement modules follow a standard interface with detect and install functions | Module interface pattern modeled on create-t3-app installers; `detect()` returns detection status, `install()` receives ProjectContext and performs setup |
| ENH-02 | Enhancement modules receive project context (root path, package manager, framework, installed deps) | ProjectContext type built from package.json parsing + config file detection + PM detection (reuses existing `detectPackageManager`) |
| ENH-03 | Enhancement modules declare dependencies on other modules for execution ordering | Module definition includes `dependsOn: string[]` array referencing other module IDs |
| ENH-04 | Enhancement module dependency graph is topologically sorted before execution | Kahn's algorithm (~30 lines) with cycle detection; no external library needed |
| ENH-05 | Enhancement modules are idempotent -- running twice produces the same result | detect() reads actual state each run; install() checks before writing; merge is deterministic |
| ENH-06 | When an enhancement is already configured, user is offered skip/merge/replace options | jsdiff v8 for diff display; `@clack/prompts` select for user choice; picocolors for coloring |
| ENH-07 | Enhancement modules adapt their output based on detected framework | ProjectContext.framework drives conditional logic in install(); framework-specific plugin maps per module |
| ENH-08 | Centralized dependency version map ensures consistent package versions | Single `dependencyVersionMap.ts` file (create-t3-app pattern) as the source of truth for all package versions |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| diff (jsdiff) | ^8.0.3 | Show file diffs before skip/merge/replace | Standard npm diff library; ships with TypeScript types since v8; ESM + CJS support; 7800+ dependents |
| deepmerge-ts | ^7.1.5 | Intelligent deep merge for config objects | TypeScript-first; 9x faster than `deepmerge`; customizable array merging; ESM native |
| picocolors | ^1.1.1 | Colored diff output and status messages | Already in project; fastest terminal color lib |
| zod | ^4.3.6 | Schema validation for module definitions | Already in project; used for scaffolder registry schemas |
| @clack/prompts | ^1.0.1 | Skip/merge/replace prompt, dependency approval prompt | Already in project; used for interactive flows |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| execa | ^9.6.1 | Run `npm install` / `pnpm add` for dependencies | Already in project; for package installation subprocess |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| diff (jsdiff) | Custom string diff | jsdiff handles edge cases (line endings, encoding, empty files); ~30kb is negligible |
| deepmerge-ts | deepmerge (original) | Original is 9x slower and lacks TypeScript type inference; deepmerge-ts is strictly better |
| deepmerge-ts | Hand-rolled recursive merge | Config merging has deceptive edge cases (arrays, nested objects, symbols, prototypes); library is safer |
| Kahn's algorithm (hand-rolled) | graphology-dag or toposort npm package | The algorithm is ~30 lines; adding a dependency for this is overkill; cycle detection is trivial with Kahn's |

**Installation:**
```bash
bun add diff deepmerge-ts --filter @tinkerise/core
```

## Architecture Patterns

### Recommended Project Structure

```
packages/core/src/
  enhancements/
    index.ts                    # Public API (re-exports)
    types.ts                    # EnhancementModule, ProjectContext, DetectionResult types
    schemas.ts                  # Zod schemas for module definitions
    define.ts                   # defineEnhancement() helper (mirrors defineScaffolder)
    context.ts                  # buildProjectContext() -- reads package.json, detects framework/PM
    graph.ts                    # topologicalSort(), validateGraph(), cycle detection
    executor.ts                 # runEnhancements() -- the orchestration pipeline
    conflict.ts                 # detectConflict(), showDiff(), mergeConfigs()
    version-map.ts              # Centralized dependency version map
    framework-detect.ts         # detectFramework() from package.json + config files
  enhancements/modules/         # Empty in Phase 5 -- Phase 6 adds actual modules here
    index.ts                    # Module registry (empty, ready for imports)

packages/cli/src/
  commands/
    add.ts                      # Stub for Phase 6 -- NOT built in Phase 5
  prompts/
    conflict-select.ts          # skip/merge/replace prompt with diff preview
    dependency-approve.ts       # "Install dependencies?" prompt
```

### Pattern 1: Enhancement Module Interface

**What:** Standard interface all enhancement modules implement
**When to use:** Every enhancement module (ESLint, Prettier, husky, etc.)

```typescript
// packages/core/src/enhancements/types.ts

/** Result of detecting whether an enhancement is already present */
export interface DetectionResult {
  /** Whether the enhancement is already configured */
  installed: boolean
  /** Config files found (for conflict resolution) */
  configFiles: string[]
  /** Partial installation detected (some files but not all) */
  partial: boolean
  /** Human-readable description of what was found */
  description?: string
}

/** Project context passed to every enhancement module */
export interface ProjectContext {
  /** Absolute path to project root */
  rootDir: string
  /** Detected or specified package manager */
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun'
  /** Detected framework (null if none detected) */
  framework: FrameworkId | null
  /** Contents of package.json (parsed) */
  packageJson: Record<string, unknown>
  /** All installed dependencies (merged deps + devDeps) */
  installedDeps: Record<string, string>
  /** Whether tinkerise just scaffolded this project (same session) */
  freshScaffold: boolean
  /** Verbose mode flag */
  verbose: boolean
}

/** Framework identifiers for adaptation */
export type FrameworkId =
  | 'next' | 'react' | 'vue' | 'svelte' | 'angular'
  | 'astro' | 'remix' | 'nuxt' | 'solid'

/** Standard enhancement module definition */
export interface EnhancementModule {
  /** Unique identifier, e.g., 'eslint', 'prettier', 'husky' */
  id: string
  /** Human-readable name for display */
  name: string
  /** One-line description */
  description: string
  /** Module IDs this depends on (for topological sort) */
  dependsOn: string[]
  /** Detect whether this enhancement is already configured */
  detect: (ctx: ProjectContext) => Promise<DetectionResult>
  /** Install the enhancement into the project */
  install: (ctx: ProjectContext) => Promise<InstallResult>
}

/** Result of an install operation */
export interface InstallResult {
  /** Whether installation succeeded */
  success: boolean
  /** Files created or modified */
  filesModified: string[]
  /** Packages added to package.json */
  packagesAdded: string[]
  /** Warning messages */
  warnings: string[]
}
```

### Pattern 2: Project Context Builder

**What:** Builds the ProjectContext by reading actual project files
**When to use:** Before running any enhancement module

```typescript
// packages/core/src/enhancements/context.ts

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { detectPackageManager } from '../pm/detect.js'
import { detectFramework } from './framework-detect.js'
import type { ProjectContext } from './types.js'

export interface BuildContextOptions {
  rootDir: string
  /** Override PM detection (from CLI flag or same-session context) */
  packageManager?: string
  /** Override framework detection (from same-session context) */
  framework?: string
  /** Whether tinkerise just scaffolded this project */
  freshScaffold?: boolean
  verbose?: boolean
}

export async function buildProjectContext(
  opts: BuildContextOptions,
): Promise<ProjectContext> {
  const { rootDir } = opts

  // Read package.json
  const pkgPath = join(rootDir, 'package.json')
  const pkgRaw = await readFile(pkgPath, 'utf-8')
  const packageJson = JSON.parse(pkgRaw) as Record<string, unknown>

  // Merge all dependency fields
  const deps = packageJson.dependencies as Record<string, string> ?? {}
  const devDeps = packageJson.devDependencies as Record<string, string> ?? {}
  const installedDeps = { ...deps, ...devDeps }

  // Detect PM (reuse existing pipeline, skip if provided)
  const pmResult = await detectPackageManager(rootDir, opts.packageManager)

  // Detect framework (skip if provided via same-session)
  const framework = opts.framework
    ? opts.framework
    : await detectFramework(rootDir, installedDeps, packageJson)

  return {
    rootDir,
    packageManager: pmResult.pm,
    framework,
    packageJson,
    installedDeps,
    freshScaffold: opts.freshScaffold ?? false,
    verbose: opts.verbose ?? false,
  }
}
```

### Pattern 3: Topological Sort with Kahn's Algorithm

**What:** Orders enhancement modules by dependency graph
**When to use:** Before executing multiple enhancements

```typescript
// packages/core/src/enhancements/graph.ts

import type { EnhancementModule } from './types.js'

export class CyclicDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Cyclic dependency detected: ${cycle.join(' -> ')}`)
    this.name = 'CyclicDependencyError'
  }
}

/**
 * Topological sort using Kahn's algorithm.
 * Returns modules in dependency-first execution order.
 * Throws CyclicDependencyError if a cycle is detected.
 */
export function topologicalSort(modules: EnhancementModule[]): EnhancementModule[] {
  const moduleMap = new Map(modules.map(m => [m.id, m]))
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  // Initialize
  for (const mod of modules) {
    inDegree.set(mod.id, 0)
    adjacency.set(mod.id, [])
  }

  // Build edges: if A dependsOn B, edge B -> A (B must run first)
  for (const mod of modules) {
    for (const dep of mod.dependsOn) {
      if (!moduleMap.has(dep)) continue // Skip external deps not in current batch
      adjacency.get(dep)!.push(mod.id)
      inDegree.set(mod.id, (inDegree.get(mod.id) ?? 0) + 1)
    }
  }

  // Seed queue with zero in-degree nodes
  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const sorted: EnhancementModule[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    sorted.push(moduleMap.get(id)!)
    for (const neighbor of adjacency.get(id) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  if (sorted.length !== modules.length) {
    // Find the cycle for a useful error message
    const remaining = modules.filter(m => !sorted.includes(m)).map(m => m.id)
    throw new CyclicDependencyError(remaining)
  }

  return sorted
}
```

### Pattern 4: Conflict Detection and Diff Display

**What:** Detect existing config, show diff, prompt for skip/merge/replace
**When to use:** When `detect()` finds existing configuration

```typescript
// packages/core/src/enhancements/conflict.ts

import { readFile } from 'node:fs/promises'
import { createPatch } from 'diff'
import pc from 'picocolors'

/**
 * Format a unified diff with terminal colors.
 * Green for additions, red for removals, dim for context.
 */
export function formatColoredDiff(patch: string): string {
  return patch
    .split('\n')
    .map(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) return pc.green(line)
      if (line.startsWith('-') && !line.startsWith('---')) return pc.red(line)
      if (line.startsWith('@@')) return pc.cyan(line)
      return pc.dim(line)
    })
    .join('\n')
}

/**
 * Generate and format a diff between existing and proposed file content.
 */
export async function showFileDiff(
  filePath: string,
  existingContent: string,
  proposedContent: string,
): Promise<string> {
  const patch = createPatch(filePath, existingContent, proposedContent)
  return formatColoredDiff(patch)
}
```

### Pattern 5: Dependency Version Map (create-t3-app pattern)

**What:** Centralized source of truth for all package versions used by enhancements
**When to use:** Any enhancement that installs npm packages

```typescript
// packages/core/src/enhancements/version-map.ts

/**
 * Centralized dependency version map.
 *
 * ALL package versions used by enhancement modules MUST come from here.
 * This ensures consistent versions across enhancements and simplifies
 * updates (one file to change, all enhancements pick it up).
 *
 * Follows create-t3-app's dependencyVersionMap pattern.
 */
export const dependencyVersionMap = {
  // Linting
  eslint: '^9.23.0',
  '@eslint/js': '^9.23.0',
  'typescript-eslint': '^8.30.0',
  'eslint-plugin-react': '^7.37.0',
  'eslint-plugin-vue': '^10.0.0',
  'eslint-plugin-svelte': '^3.5.0',
  'eslint-plugin-astro': '^1.4.0',

  // Formatting
  prettier: '^3.5.3',
  'prettier-plugin-tailwindcss': '^0.6.11',

  // Git hooks
  husky: '^9.1.0',
  'lint-staged': '^15.3.0',

  // Commit conventions
  commitlint: '^19.6.0',
  '@commitlint/config-conventional': '^19.6.0',
  '@commitlint/cli': '^19.6.0',

  // Testing
  vitest: '^3.1.0',
} as const satisfies Record<string, string>

export type DependencyName = keyof typeof dependencyVersionMap
```

### Pattern 6: Enhancement Execution Pipeline

**What:** Orchestrates detect -> conflict resolution -> install flow
**When to use:** When `tinkerise add` runs one or more enhancements

```typescript
// packages/core/src/enhancements/executor.ts  (simplified)

import type { EnhancementModule, ProjectContext, InstallResult } from './types.js'
import { topologicalSort } from './graph.js'
import { tinkeriseLog } from '../executor/framing.js'

export type ConflictAction = 'skip' | 'merge' | 'replace'

export interface EnhancementExecutorOptions {
  modules: EnhancementModule[]
  context: ProjectContext
  /** Called when a conflict is detected -- CLI layer provides this */
  onConflict: (moduleId: string, filePath: string, diff: string) => Promise<ConflictAction>
  /** Called when a dependency needs approval */
  onDependencyApproval: (moduleId: string, deps: string[]) => Promise<boolean>
}

export interface ExecutionSummary {
  installed: string[]
  skipped: string[]
  failed: Array<{ id: string; error: string }>
  notRun: string[]
}

export async function runEnhancements(
  opts: EnhancementExecutorOptions,
): Promise<ExecutionSummary> {
  const { modules, context, onConflict, onDependencyApproval } = opts
  const sorted = topologicalSort(modules)

  const summary: ExecutionSummary = {
    installed: [],
    skipped: [],
    failed: [],
    notRun: [],
  }

  for (const mod of sorted) {
    tinkeriseLog(`Running ${mod.name}...`)

    try {
      // 1. Detect existing
      const detection = await mod.detect(context)

      if (detection.installed) {
        // 2. Conflict resolution (per-file, as encountered)
        // CLI layer handles the actual prompting via onConflict callback
        // ... conflict handling logic
      }

      // 3. Check dependencies
      const missingDeps = mod.dependsOn.filter(
        dep => !summary.installed.includes(dep),
      )
      if (missingDeps.length > 0) {
        const approved = await onDependencyApproval(mod.id, missingDeps)
        if (!approved) {
          summary.skipped.push(mod.id)
          continue
        }
      }

      // 4. Install
      const result = await mod.install(context)
      if (result.success) {
        summary.installed.push(mod.id)
        tinkeriseLog(`Done: ${mod.name}`)
      }
    } catch (error) {
      // Stop on first failure (locked decision)
      summary.failed.push({
        id: mod.id,
        error: error instanceof Error ? error.message : String(error),
      })
      // Mark remaining as not run
      const currentIdx = sorted.indexOf(mod)
      summary.notRun = sorted.slice(currentIdx + 1).map(m => m.id)
      break
    }
  }

  return summary
}
```

### Pattern 7: Same-Session Context Passing

**What:** Carry framework/PM context from scaffold to enhance within same CLI invocation
**When to use:** When user scaffolds then immediately adds enhancements

```typescript
// Recommendation: Use a simple in-memory singleton in the CLI process

// packages/cli/src/context/session.ts
export interface SessionContext {
  framework?: string
  packageManager?: string
  projectDir?: string
}

let sessionCtx: SessionContext = {}

export function setSessionContext(ctx: Partial<SessionContext>): void {
  sessionCtx = { ...sessionCtx, ...ctx }
}

export function getSessionContext(): SessionContext {
  return { ...sessionCtx }
}

// In scaffold.ts after executeScaffolder():
// setSessionContext({ framework: 'next', packageManager: pm, projectDir: name })

// In add.ts when building ProjectContext:
// const session = getSessionContext()
// buildProjectContext({ rootDir, framework: session.framework, ... })
```

### Anti-Patterns to Avoid

- **Metadata file tracking:** Do NOT create `.tinkerise.json` or similar to track installed enhancements. The decision is "detect from actual config files each time." This keeps tinkerise non-invasive.
- **Batched conflict resolution:** Do NOT collect all conflicts and show them at once. The decision is "one file at a time as encountered."
- **Automatic dependency installation:** Do NOT silently install dependencies. The decision is "prompt before installing deps."
- **Rolling back on failure:** Do NOT attempt to undo completed installations. The decision is "keep what succeeded, report what failed."
- **Spawning enhancement tools:** Enhancement modules directly write config files and modify package.json. They do NOT shell out to `eslint --init` or similar -- those tools have their own interactive UX that conflicts with tinkerise's.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text diffing | Custom line-by-line diff | `diff` (jsdiff v8) | Myers diff algorithm handles edge cases (encoding, line endings, large files); battle-tested with 7800+ dependents |
| Deep object merging | Recursive `Object.assign` | `deepmerge-ts` | Array concatenation, symbol handling, prototype safety, circular reference detection; 9x faster than alternatives |
| Terminal colors | Raw ANSI codes | `picocolors` (already in project) | Cross-platform, handles NO_COLOR, tiny footprint |
| Schema validation | Manual type guards | `zod` (already in project) | Runtime validation with inferred types; consistent with scaffolder registry pattern |
| Subprocess execution | `child_process.spawn` | `execa` (already in project) | Signal forwarding, promise API, stdio handling |

**Key insight:** The enhancement system's complexity is in orchestration logic (dependency graph, conflict resolution flow, idempotency), not in individual operations. Use libraries for the mechanical parts (diff, merge, color) and focus implementation effort on the orchestration pipeline.

## Common Pitfalls

### Pitfall 1: Config File Format Diversity
**What goes wrong:** ESLint config can be `.eslintrc.json`, `.eslintrc.js`, `.eslintrc.yml`, `eslint.config.js`, `eslint.config.mjs`, `eslint.config.ts`, or a field in `package.json`. Prettier has similar proliferation. Detection that only checks one format misses existing configs.
**Why it happens:** JavaScript tooling evolved through multiple config formats; ESLint v9+ moved to flat config but old formats still exist.
**How to avoid:** Each enhancement's `detect()` must check ALL known config file locations. Use a lookup table of possible file names per tool. For ESLint specifically, the flat config files (`eslint.config.*`) should be checked first since they're the modern standard (ESLint v10 removed eslintrc entirely).
**Warning signs:** Users report "tinkerise added a duplicate ESLint config" -- means detection missed an existing one.

### Pitfall 2: Deep Merge Array Handling
**What goes wrong:** Naive deep merge concatenates arrays, creating duplicates. Two merges of `{ plugins: ['react'] }` produce `{ plugins: ['react', 'react'] }`.
**Why it happens:** deepmerge-ts (and most merge libs) concatenate arrays by default.
**How to avoid:** Use `deepmergeCustom` with a custom array handler that deduplicates. For config arrays like `plugins` and `extends`, use Set-based deduplication. For ordered arrays, preserve order while removing duplicates.
**Warning signs:** Linting configs with duplicate plugins causing "rule already defined" errors.

### Pitfall 3: Package.json Concurrent Modification
**What goes wrong:** Two enhancement modules both modify `package.json` (adding scripts, dependencies). If they read-modify-write independently, second write overwrites first's changes.
**Why it happens:** Enhancement modules run sequentially but both target the same file.
**How to avoid:** Use a shared `addDependency()` / `addScript()` utility that reads the current state before each modification. Since modules run sequentially (topological sort), each module sees the previous module's changes if it reads fresh.
**Warning signs:** Missing npm scripts or dependencies after running multiple enhancements.

### Pitfall 4: Framework Detection False Positives
**What goes wrong:** A monorepo has both React and Vue packages in dependencies. Or `react` appears in devDependencies for testing but the project is actually Vue.
**Why it happens:** package.json dependencies don't indicate the "primary" framework.
**How to avoid:** Use a priority heuristic: meta-frameworks first (Next.js > React, Nuxt > Vue), then check for framework-specific config files (`next.config.*`, `nuxt.config.*`, `svelte.config.*`, `astro.config.*`). When multiple frameworks detected, prompt user to choose (locked decision).
**Warning signs:** Wrong ESLint plugins installed (React rules on a Vue project).

### Pitfall 5: Idempotency Assumptions
**What goes wrong:** `install()` appends to a file each time instead of writing a complete state. Running twice doubles the content.
**Why it happens:** Using `appendFile` instead of `writeFile`, or not checking existing content before adding.
**How to avoid:** Every `install()` must follow detect-then-act: check if the file exists, read current content, compute desired state, write the complete desired state. The `detect()` function should catch "already fully installed" and short-circuit.
**Warning signs:** Config files grow on each run; duplicate entries in arrays.

### Pitfall 6: npm install Output Noise
**What goes wrong:** `npm install` produces verbose output (added X packages, audit summary, funding messages) that clutters the step-by-step enhancement log.
**Why it happens:** npm defaults to verbose output.
**How to avoid:** Use execa with `stdio: 'pipe'` (not `'inherit'`) for npm/pnpm/yarn/bun install commands within enhancements. Buffer output and only show it when `--verbose` is active. This is DIFFERENT from scaffolder execution (which uses `stdio: 'inherit'` for upstream tool output).
**Warning signs:** Enhancement output is 90% npm install noise instead of clean step-by-step progress.

### Pitfall 7: Topological Sort with Missing Dependencies
**What goes wrong:** User requests `husky` which depends on `lint-staged`, but `lint-staged` isn't in the requested modules. Sort crashes or silently ignores the dependency.
**Why it happens:** Dependency graph only includes explicitly requested modules.
**How to avoid:** When a module's `dependsOn` references a module not in the current batch, check if it's already installed via `detect()`. If not installed, trigger the dependency approval prompt (locked decision: "husky requires lint-staged. Install both?"). If approved, add the dependency module to the batch and re-sort.
**Warning signs:** Missing dependency prompts; modules fail because prerequisites aren't installed.

## Code Examples

### Framework Detection from package.json + Config Files

```typescript
// packages/core/src/enhancements/framework-detect.ts

import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { FrameworkId } from './types.js'

/** Framework detection rules, ordered by specificity (meta-frameworks first) */
const FRAMEWORK_RULES: Array<{
  id: FrameworkId
  /** package.json dependency names (any match = detected) */
  packages: string[]
  /** Config files that confirm this framework */
  configFiles: string[]
}> = [
  // Meta-frameworks first (more specific)
  { id: 'next', packages: ['next'], configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'] },
  { id: 'nuxt', packages: ['nuxt'], configFiles: ['nuxt.config.ts', 'nuxt.config.js'] },
  { id: 'remix', packages: ['@remix-run/react', 'react-router'], configFiles: [] },
  { id: 'astro', packages: ['astro'], configFiles: ['astro.config.mjs', 'astro.config.ts'] },
  // Base frameworks
  { id: 'svelte', packages: ['svelte'], configFiles: ['svelte.config.js'] },
  { id: 'vue', packages: ['vue'], configFiles: ['vue.config.js', 'vite.config.ts'] },
  { id: 'react', packages: ['react', 'react-dom'], configFiles: [] },
  { id: 'angular', packages: ['@angular/core'], configFiles: ['angular.json'] },
  { id: 'solid', packages: ['solid-js'], configFiles: [] },
]

export async function detectFramework(
  rootDir: string,
  installedDeps: Record<string, string>,
  _packageJson: Record<string, unknown>,
): Promise<FrameworkId | null> {
  const detected: FrameworkId[] = []

  for (const rule of FRAMEWORK_RULES) {
    const hasDep = rule.packages.some(pkg => pkg in installedDeps)
    if (!hasDep) continue

    // Confirm with config files if available
    if (rule.configFiles.length > 0) {
      for (const cf of rule.configFiles) {
        try {
          await access(join(rootDir, cf))
          detected.push(rule.id)
          break
        } catch { /* not found */ }
      }
    } else {
      // No config files to check -- dependency presence is sufficient
      detected.push(rule.id)
    }
  }

  if (detected.length === 0) return null
  if (detected.length === 1) return detected[0]

  // Multiple frameworks detected -- caller should prompt user
  // Return null to signal ambiguity; caller handles the prompt
  return null // The detected array would be passed separately for the prompt
}
```

### Enhancement Module Definition Helper

```typescript
// packages/core/src/enhancements/define.ts

import { EnhancementModuleSchema } from './schemas.js'
import type { EnhancementModule } from './types.js'

/**
 * Define an enhancement module with validation.
 * Mirrors defineScaffolder() pattern from the registry.
 */
export function defineEnhancement(module: EnhancementModule): EnhancementModule {
  return EnhancementModuleSchema.parse(module) as EnhancementModule
}
```

### Config File Merge with Deduplication

```typescript
// packages/core/src/enhancements/conflict.ts (merge logic)

import { deepmergeCustom } from 'deepmerge-ts'

/**
 * Custom deep merge for config files.
 * Arrays are merged with deduplication (plugins, extends, etc.).
 * Objects are merged recursively.
 */
export const mergeConfigs = deepmergeCustom({
  mergeArrays: (values) => {
    // Flatten and deduplicate array values
    const merged = values.flat()
    // For primitive arrays (strings), deduplicate
    if (merged.every(v => typeof v === 'string' || typeof v === 'number')) {
      return [...new Set(merged)]
    }
    // For object arrays, concatenate (user will review via diff)
    return merged
  },
})
```

### Enhancement Summary Card

```typescript
// packages/core/src/enhancements/summary.ts

import pc from 'picocolors'
import { tinkeriseLog, tinkeriseBlankLine } from '../executor/framing.js'
import type { ExecutionSummary } from './executor.js'

/**
 * Show enhancement execution summary card.
 * Mirrors the scaffold summary card style (locked decision).
 */
export function showEnhancementSummary(summary: ExecutionSummary): void {
  tinkeriseBlankLine()
  tinkeriseLog(pc.bold('Enhancement Summary'))
  tinkeriseLog('')

  if (summary.installed.length > 0) {
    for (const id of summary.installed) {
      tinkeriseLog(`  ${pc.green('\u2713')} ${id}`)  // checkmark
    }
  }

  if (summary.skipped.length > 0) {
    for (const id of summary.skipped) {
      tinkeriseLog(`  ${pc.yellow('-')} ${id} ${pc.dim('(skipped)')}`)
    }
  }

  if (summary.failed.length > 0) {
    for (const { id, error } of summary.failed) {
      tinkeriseLog(`  ${pc.red('\u2717')} ${id}: ${error}`)  // x mark
    }
  }

  if (summary.notRun.length > 0) {
    tinkeriseLog('')
    tinkeriseLog(pc.dim(`  Not run: ${summary.notRun.join(', ')}`))
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eslintrc.json` / `.eslintrc.js` | `eslint.config.js` (flat config) | ESLint v9 (2024), mandatory in v10 (Feb 2026) | Enhancement modules MUST generate flat config format; detection must check both old and new |
| `prettier` field in package.json | Standalone `.prettierrc` or `prettier.config.js` | Ongoing | Both are valid; detect both |
| `husky install` in postinstall script | `husky` command in `prepare` script | Husky v9 (2024) | Enhancement must use `prepare` script, not `postinstall` |
| CJS config files (`.eslintrc.js`) | ESM config files (`eslint.config.mjs`) | Ecosystem trend 2024-2026 | Generate `.mjs` or `.js` depending on project's `"type": "module"` in package.json |

**Deprecated/outdated:**
- eslintrc format: Completely removed in ESLint v10.0.0 (Feb 2026). Only flat config is supported.
- `husky install`: Replaced by `husky` command in v9. The old approach in `postinstall` is deprecated.

## Open Questions

1. **Framework detection with monorepos**
   - What we know: Detection works by reading root `package.json`. Monorepos have per-package configs.
   - What's unclear: Should tinkerise detect framework per-workspace or only at root?
   - Recommendation: For Phase 5, detect at the provided `rootDir` only. Monorepo-aware enhancement is out of scope (v2 feature ADV-01).

2. **Deep merge edge case: conflicting scalar values**
   - What we know: deepmerge-ts merges objects deeply and concatenates arrays. Scalars take the later value.
   - What's unclear: When two configs set the same rule to different values (e.g., `semi: true` vs `semi: false`), that's a "true conflict."
   - Recommendation: The locked decision says "flag true conflicts." For scalar conflicts, include them in the diff preview and let the user choose skip/merge/replace at the file level. Do not try to resolve individual rule conflicts.

3. **Where to put modules: core or separate package?**
   - What we know: Scaffolder entries live in `@tinkerise/core`. The module interface will be defined in core.
   - What's unclear: Whether actual enhancement module implementations (Phase 6) should live in core or a new `@tinkerise/enhancements` package.
   - Recommendation: Keep in `@tinkerise/core` for now. The modules are small (each ~50-100 lines) and don't add significant dependencies beyond what's already in core. If they grow, extract later.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `packages/core/src/` and `packages/shared/src/` -- full architecture review of existing patterns
- Codebase analysis: `packages/cli/src/commands/scaffold.ts` -- execution pipeline and summary card patterns
- [create-t3-app architecture](https://deepwiki.com/t3-oss/create-t3-app/1-overview) -- installer pattern, dependencyVersionMap, modular enhancement model
- [ESLint v10 release](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/) -- eslintrc removal, flat config only
- [ESLint flat config extends](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/) -- defineConfig, extends in flat config

### Secondary (MEDIUM confidence)
- [jsdiff GitHub](https://github.com/kpdecker/jsdiff) -- v8 API, ESM support, TypeScript types built-in
- [deepmerge-ts GitHub](https://github.com/RebeccaStevens/deepmerge-ts) -- API surface, customizable array merging
- [deepmerge-ts API docs](https://github.com/RebeccaStevens/deepmerge-ts/blob/main/docs/API.md) -- deepmerge, deepmergeCustom, mergeArrays option
- [picocolors GitHub](https://github.com/alexeyraspopov/picocolors) -- strikethrough, formatting functions confirmed
- [Kahn's algorithm](https://en.wikipedia.org/wiki/Topological_sorting) -- O(V+E) topological sort with cycle detection
- [cosmiconfig GitHub](https://github.com/cosmiconfig/cosmiconfig) -- ESM config file loading (reference for config detection patterns)

### Tertiary (LOW confidence)
- npm weekly download comparisons for deepmerge-ts vs deepmerge (174K vs 20K ops/sec benchmark from search results -- not independently verified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- minimal new dependencies (diff, deepmerge-ts); rest already in project
- Architecture: HIGH -- follows established patterns in the codebase (defineScaffolder, registry, executor pipeline); create-t3-app installer pattern is well-documented
- Pitfalls: HIGH -- based on direct analysis of config file format diversity and deep merge behavior; framework detection heuristics derived from known package.json patterns

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days -- stable domain, no fast-moving dependencies)
