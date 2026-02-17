# Phase 6: Core Enhancements & Add Command - Research

**Researched:** 2026-02-17
**Domain:** ESLint flat config, Prettier, husky + lint-staged, GitHub Actions CI, CLI command architecture
**Confidence:** HIGH

## Summary

Phase 6 transforms the Phase 5 enhancement module architecture into real, user-facing tooling enhancements. The phase implements four concrete enhancement modules (ESLint, Prettier, husky + lint-staged, GitHub Actions CI), the `tinkerise add` CLI command that orchestrates them, and the `tk` short alias. Each module follows the `defineEnhancement()` pattern from Phase 5, uses `dependencyVersionMap` for version consistency, and integrates with the existing `buildProjectContext()` + `runEnhancements()` pipeline.

The critical technical finding is that ESLint v10.0.0 was released on February 6, 2026 and completely removes eslintrc support. However, **eslint-plugin-react does NOT yet support ESLint v10** (compatibility PR #3979 is in progress but no release). This means the enhancement module must target **ESLint v9.x** (the latest v9.39.x) to ensure all framework plugins work. The version map already has `^9.23.0` which is correct. ESLint's `defineConfig` and `@eslint/js` recommended config work identically in v9 and v10 flat config format, so when plugins catch up, users can simply bump ESLint without changing config structure.

The `add` command uses `@clack/prompts` multiselect (already in the project) for the interactive picker, with `disabled: true` for already-installed enhancements. The `tk` alias is already wired in `package.json` bin entries; what remains is making Commander.js dynamically use the invocation name so help text and error messages say `tk` when invoked as `tk`.

**Primary recommendation:** Build four enhancement modules in `packages/core/src/enhancements/modules/`, the `add` command in `packages/cli/src/commands/add.ts`, and wire the `tk` alias name detection in `packages/cli/src/index.ts`. Target ESLint v9.x for plugin compatibility safety.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### `add` command UX
- Running `tinkerise add` with no arguments launches an interactive multi-select picker showing all available enhancements
- Already-installed enhancements appear in the picker as disabled/checked -- user sees the full picture but can't re-select them
- Multiple CLI args supported without prompts: `tinkerise add eslint prettier` runs both in dependency order, no confirmation needed
- Each enhancement gets its own summary card after running: files created/modified, packages installed, next steps

#### ESLint config
- Recommended baseline: eslint/recommended + framework plugin recommended rules
- Fully automatic framework detection -- detect framework from Phase 5 project context and add the right plugins (React for Next.js, Vue plugin for Nuxt, etc.) with zero user input
- ESLint flat config format (not legacy .eslintrc)

#### Prettier config
- Pure defaults -- no .prettierrc file needed unless user customizes later
- Tailwind plugin auto-detected if Tailwind is present in the project (per Phase 5 project context)
- Framework detection is fully automatic, same as ESLint

#### Husky + lint-staged
- Pre-commit hook runs lint + format on staged files only (fast, targeted)
- No typecheck in pre-commit -- that's for CI
- Only adds commands for enhancements that are present (if no Prettier, no format step)

#### GitHub Actions CI
- Steps: lint + typecheck + test + build -- skip any step if the tool isn't detected in the project
- Node.js version matrix: LTS + current (e.g., 20 + 22)
- Package manager matches the project's detected PM (with corepack enable if pnpm/yarn)
- CI trigger strategy: Claude's discretion

#### `tk` alias
- Pure 1:1 alias -- identical to `tinkerise` in every way, same commands, same flags, same output
- Help text and error messages match invocation: if user ran `tk add`, output says `tk add`
- Available immediately on install -- both `tinkerise` and `tk` bin entries ship in the npm package
- Documented as a convenience alias, not the primary name -- docs use `tinkerise` as canonical

### Claude's Discretion
- CI workflow trigger strategy (PR only vs PR + push to main)
- Loading skeleton and progress indicators during enhancement installation
- Exact summary card layout and formatting
- ESLint rule set beyond recommended baseline

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADD-01 | User can add ESLint flat config with framework-appropriate plugins via `tinkerise add eslint` | ESLint v9 flat config with `defineConfig` + `@eslint/js` recommended + framework plugin map (react, vue, svelte, astro); typescript-eslint for TS projects |
| ADD-02 | User can add Prettier config with Tailwind plugin auto-detection via `tinkerise add prettier` | Prettier v3.8.x pure defaults (no config file unless Tailwind detected); `prettier-plugin-tailwindcss` auto-added when Tailwind in `installedDeps` |
| ADD-03 | User can add git hooks via husky + lint-staged for pre-commit linting via `tinkerise add husky` | Husky v9 `init` pattern + lint-staged v15.x config in package.json; adaptive commands based on installed enhancements |
| ADD-04 | User can add GitHub Actions CI workflow (lint, type-check, test, build) via `tinkerise add ci` | YAML template generation with conditional steps; PM-aware install commands; corepack enable for pnpm/yarn; Node.js matrix [20, 22] |
| CLI-02 | User can run `tk` as a short alias for `tinkerise` | `bin.tk` already in package.json; need `process.argv` inspection to detect invocation name and pass to `program.name()` |
</phase_requirements>

## Standard Stack

### Core (no new dependencies -- all in existing dependencyVersionMap)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint | ^9.23.0 | JavaScript/TypeScript linting | ESLint v9.x for plugin compatibility; flat config format |
| @eslint/js | ^9.23.0 | `js.configs.recommended` baseline rules | Official ESLint recommended ruleset package |
| typescript-eslint | ^8.30.0 | TypeScript parser + rules for ESLint | Official TS support; flat config via `tseslint.config()`; v8.56+ supports ESLint v10 |
| eslint-plugin-react | ^7.37.0 | React-specific linting rules | Official React plugin; `configs.flat.recommended` for flat config |
| eslint-plugin-vue | ^10.0.0 | Vue-specific linting rules | Official Vue plugin; `configs['flat/recommended']` for flat config |
| eslint-plugin-svelte | ^3.5.0 | Svelte-specific linting rules | Official Svelte plugin; `configs.recommended` spreads into flat config |
| eslint-plugin-astro | ^1.4.0 | Astro-specific linting rules | Official Astro plugin; `configs.recommended` spreads into flat config |
| prettier | ^3.5.3 | Code formatting | Opinionated formatter; pure defaults need no config file |
| prettier-plugin-tailwindcss | ^0.6.11 | Tailwind class sorting | Official Tailwind prettier plugin; must be last in plugins array |
| husky | ^9.1.0 | Git hooks management | v9 uses `prepare` script + `husky init` pattern |
| lint-staged | ^15.3.0 | Run linters on staged files | Proven staged-file runner; v15 is stable (v16 has breaking --shell removal) |

### Supporting (already in project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| globals | (new dep) | Browser/Node global variables for ESLint flat config | Required by ESLint flat config `languageOptions.globals` |
| @clack/prompts | ^1.0.1 | Interactive multiselect for `add` picker | Already in CLI; `multiselect` with `disabled` option for installed enhancements |
| execa | ^9.6.1 | Run `npm install` / `pnpm add` etc. | Already in core; piped stdio (not inherit) for suppressed output |
| picocolors | ^1.1.1 | Colored summary card output | Already in project |

### New Dependencies Required

| Library | Version | Purpose | Package |
|---------|---------|---------|---------|
| globals | ^17.3.0 | ESLint flat config global variable definitions | Add to version-map; installed by ESLint module into user projects |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ESLint v9.x | ESLint v10.x | v10 removes eslintrc entirely BUT eslint-plugin-react does not yet support v10 (PR #3979 in progress). Target v9 for safety; configs are forward-compatible |
| lint-staged v15 | lint-staged v16 | v16 removes --shell flag; v15 is stable and widely used; no benefit to v16 for our use case |
| Separate .prettierrc | No config file | Locked decision: pure defaults, no file unless Tailwind plugin needed |
| `eslint --init` | Direct config file generation | Enhancement modules write files directly; shelling out to `eslint --init` would create an interactive UX conflict |

**Installation:** No new packages need to be installed in the tinkerise monorepo itself. The enhancement modules install packages into the *user's* project via `execa`.

## Architecture Patterns

### Recommended Project Structure

```
packages/core/src/enhancements/
  modules/
    index.ts                    # Enhancement registry -- exports all modules
    eslint.ts                   # ESLint enhancement module (ADD-01)
    prettier.ts                 # Prettier enhancement module (ADD-02)
    husky.ts                    # Husky + lint-staged enhancement module (ADD-03)
    ci.ts                       # GitHub Actions CI enhancement module (ADD-04)
    _utils.ts                   # Shared helpers: installPackages(), writeConfigFile(), addScript()

packages/cli/src/
  commands/
    add.ts                      # `tinkerise add` command implementation
  prompts/
    enhancement-select.ts       # Interactive multi-select picker for enhancements
```

### Pattern 1: Enhancement Module Template

**What:** Standard pattern all four enhancement modules follow
**When to use:** Every enhancement module in this phase

```typescript
// packages/core/src/enhancements/modules/eslint.ts
import { defineEnhancement } from '../define.js'
import { dependencyVersionMap } from '../version-map.js'
import type { ProjectContext, DetectionResult, InstallResult } from '../types.js'
import { installPackages, writeConfigFile } from './_utils.js'

export const eslintModule = defineEnhancement({
  id: 'eslint',
  name: 'ESLint',
  description: 'Configure ESLint with framework-specific rules',
  dependsOn: [],

  async detect(ctx: ProjectContext): Promise<DetectionResult> {
    // Check ALL known ESLint config file locations
    const configFiles: string[] = []
    const CHECK_FILES = [
      'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts',
      '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml',
    ]
    // Check each file, also check package.json "eslintConfig" field
    // Return { installed: true/false, configFiles, partial }
    // ...
    return { installed: false, configFiles: [], partial: false }
  },

  async install(ctx: ProjectContext): Promise<InstallResult> {
    // 1. Determine packages based on framework
    // 2. Install packages via installPackages()
    // 3. Generate eslint.config.js content based on framework
    // 4. Write config file
    // 5. Return result with files modified, packages added
    return { success: true, filesModified: [], packagesAdded: [], warnings: [] }
  },
})
```

### Pattern 2: Package Installation Helper

**What:** Shared utility for running package install commands across all PMs
**When to use:** Every enhancement module that installs npm packages

```typescript
// packages/core/src/enhancements/modules/_utils.ts
import { execa } from 'execa'
import type { PackageManager } from '../../pm/detect.js'

/**
 * Install packages as devDependencies using the project's package manager.
 * Uses piped stdio (not inherit) to suppress output by default.
 * Returns the list of installed package names.
 */
export async function installPackages(
  packages: string[],
  opts: {
    cwd: string
    packageManager: PackageManager
    verbose?: boolean
  },
): Promise<string[]> {
  if (packages.length === 0) return []

  const { cwd, packageManager, verbose = false } = opts

  const commandMap: Record<PackageManager, { cmd: string; args: string[] }> = {
    npm: { cmd: 'npm', args: ['install', '--save-dev', ...packages] },
    pnpm: { cmd: 'pnpm', args: ['add', '--save-dev', ...packages] },
    yarn: { cmd: 'yarn', args: ['add', '--dev', ...packages] },
    bun: { cmd: 'bun', args: ['add', '--dev', ...packages] },
  }

  const { cmd, args } = commandMap[packageManager]

  await execa(cmd, args, {
    cwd,
    stdio: verbose ? 'inherit' : 'pipe',
  })

  return packages
}

/**
 * Write a config file to the project root.
 * Returns the absolute path of the written file.
 */
export async function writeConfigFile(
  rootDir: string,
  filename: string,
  content: string,
): Promise<string> {
  const filePath = join(rootDir, filename)
  await writeFile(filePath, content, 'utf-8')
  return filePath
}

/**
 * Add a script to package.json if not already present.
 * Reads fresh package.json each time (sequential module execution).
 */
export async function addScript(
  rootDir: string,
  name: string,
  command: string,
): Promise<boolean> {
  const pkgPath = join(rootDir, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
  if (!pkg.scripts) pkg.scripts = {}
  if (pkg.scripts[name]) return false // Already exists
  pkg.scripts[name] = command
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  return true
}
```

### Pattern 3: ESLint Config Generation by Framework

**What:** Generate the correct ESLint flat config content based on detected framework
**When to use:** The ESLint enhancement module's `install()` function

```typescript
// Framework-to-plugin mapping
const FRAMEWORK_ESLINT_MAP: Record<string, {
  packages: string[]
  configImports: string[]
  configSpread: string[]
}> = {
  // React-based frameworks (Next.js, Remix, plain React)
  next: {
    packages: ['eslint-plugin-react'],
    configImports: [`import react from 'eslint-plugin-react'`],
    configSpread: [`react.configs.flat.recommended`, `react.configs.flat['jsx-runtime']`],
  },
  react: {
    packages: ['eslint-plugin-react'],
    configImports: [`import react from 'eslint-plugin-react'`],
    configSpread: [`react.configs.flat.recommended`, `react.configs.flat['jsx-runtime']`],
  },
  remix: {
    packages: ['eslint-plugin-react'],
    configImports: [`import react from 'eslint-plugin-react'`],
    configSpread: [`react.configs.flat.recommended`, `react.configs.flat['jsx-runtime']`],
  },
  // Vue-based frameworks
  vue: {
    packages: ['eslint-plugin-vue'],
    configImports: [`import pluginVue from 'eslint-plugin-vue'`],
    configSpread: [`...pluginVue.configs['flat/recommended']`],
  },
  nuxt: {
    packages: ['eslint-plugin-vue'],
    configImports: [`import pluginVue from 'eslint-plugin-vue'`],
    configSpread: [`...pluginVue.configs['flat/recommended']`],
  },
  // Svelte
  svelte: {
    packages: ['eslint-plugin-svelte'],
    configImports: [`import svelte from 'eslint-plugin-svelte'`],
    configSpread: [`...svelte.configs.recommended`],
  },
  // Astro
  astro: {
    packages: ['eslint-plugin-astro'],
    configImports: [`import astro from 'eslint-plugin-astro'`],
    configSpread: [`...astro.configs.recommended`],
  },
}
```

### Pattern 4: `add` Command with Multi-Select Picker

**What:** CLI command that launches interactive picker or runs directly from args
**When to use:** The `tinkerise add` entry point

```typescript
// packages/cli/src/commands/add.ts
import * as p from '@clack/prompts'
import {
  buildProjectContext,
  runEnhancements,
  showEnhancementSummary,
} from '@tinkerise/core'
import { getSessionContext } from '../context/session.js'

// All available enhancement modules
import { enhancementRegistry } from '@tinkerise/core/enhancements/modules'

export async function runAddCommand(
  enhancementNames: string[],
  options: AddOptions,
): Promise<void> {
  const session = getSessionContext()

  // 1. Build project context (uses session overrides if available)
  const ctx = await buildProjectContext({
    rootDir: process.cwd(),
    packageManager: session.packageManager,
    framework: session.framework,
    freshScaffold: !!session.projectDir,
    verbose: options.verbose ?? false,
    onAmbiguousFramework: async (detected) => {
      // Interactive prompt: ask user to pick primary framework
    },
  })

  // 2. Determine which enhancements to run
  let modules
  if (enhancementNames.length === 0) {
    // Interactive: show multi-select picker
    modules = await showEnhancementPicker(ctx)
  } else {
    // Direct: resolve names to modules
    modules = enhancementNames.map(name => {
      const mod = enhancementRegistry[name]
      if (!mod) throw new Error(`Unknown enhancement: '${name}'`)
      return mod
    })
  }

  // 3. Run enhancement pipeline
  const summary = await runEnhancements({
    modules,
    context: ctx,
    interactive: !isCI,
    onConflict: async (moduleId, filePath, diff) => { /* prompt */ },
    onDependencyApproval: async (moduleId, deps) => { /* prompt */ },
  })

  // 4. Show per-enhancement summary cards
  showEnhancementSummary(summary)
}
```

### Pattern 5: `tk` Alias Name Detection

**What:** Detect whether the user invoked `tk` or `tinkerise` and adjust Commander.js program name
**When to use:** CLI entry point (`packages/cli/src/index.ts`)

```typescript
// packages/cli/src/index.ts
import { basename } from 'node:path'

// Detect invocation name from process.argv[1]
// When installed via npm, argv[1] is the resolved bin path (e.g., /usr/local/bin/tk)
const invokedAs = basename(process.argv[1] ?? 'tinkerise')
const programName = invokedAs === 'tk' ? 'tk' : 'tinkerise'

const program = new Command()
program.name(programName)
```

### Pattern 6: GitHub Actions CI Workflow Template

**What:** Generate `.github/workflows/ci.yml` with conditional steps
**When to use:** The CI enhancement module's `install()` function

```yaml
# Template structure (generated dynamically)
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4

      # PM-specific setup (conditional)
      - uses: pnpm/action-setup@v4  # only if pnpm
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'  # or 'pnpm' or 'yarn'

      # Corepack enable (if pnpm/yarn)
      - run: corepack enable

      - run: npm ci  # or pnpm install --frozen-lockfile

      # Conditional steps (only if tool detected)
      - run: npm run lint        # if ESLint detected
      - run: npm run typecheck   # if TypeScript detected
      - run: npm run test        # if test script exists
      - run: npm run build       # if build script exists
```

### Anti-Patterns to Avoid

- **Shelling out to `eslint --init` or `prettier --init`:** Enhancement modules write config files directly. Shelling out creates interactive UX conflicts and platform-dependent behavior.
- **Targeting ESLint v10 today:** eslint-plugin-react doesn't support v10 yet. Target v9 flat config which is forward-compatible.
- **Creating .prettierrc by default:** Locked decision says pure defaults, no file unless Tailwind plugin is needed.
- **Adding typecheck to pre-commit hook:** Locked decision says pre-commit is lint + format only; typecheck is for CI.
- **Hardcoding `npm` commands:** Must use `PackageManager` from context to generate correct install/run commands.
- **Writing lint-staged config as separate file:** Use `package.json` inline `"lint-staged"` field for simplicity.
- **Using `stdio: 'inherit'` for package installations:** Enhancement install output should be piped (suppressed), not inherited. Use `verbose` flag to show.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ESLint config file format | Custom JSON/YAML builder | String template with dynamic imports | Flat config is a JS module; string template gives full control over imports and spreads |
| Package installation | Custom `child_process` wrapper | `execa` with PM-aware command map | Handles signal forwarding, promise API, stdio options; already in project |
| YAML generation | Custom YAML serializer | String template | CI workflow YAML is static structure with variable substitutions; a template is simpler and more readable than a YAML builder |
| Config file detection | Single-file check | Exhaustive lookup table per tool | Tools have 5-10 possible config file locations each; must check all to avoid duplicates |
| Interactive picker | Custom keyboard handler | `@clack/prompts` multiselect | Already in project; supports `disabled` option for installed enhancements |

**Key insight:** Enhancement modules are primarily file generators with conditional logic. The complexity is in getting the conditional logic right (framework detection, PM awareness, Tailwind detection) not in the file writing itself. Use string templates for config generation -- they're more maintainable than AST manipulation for this use case.

## Common Pitfalls

### Pitfall 1: ESLint Plugin Compatibility with ESLint Versions
**What goes wrong:** Installing ESLint v10 with eslint-plugin-react causes `contextOrFilename.getFilename()` errors because the plugin hasn't updated its RuleContext API usage.
**Why it happens:** ESLint v10 was released Feb 6, 2026 and removed deprecated API. Plugin ecosystem hasn't fully caught up.
**How to avoid:** Pin ESLint to `^9.23.0` in the version map. The flat config format (`eslint.config.js` with `defineConfig`) works identically in v9 and v10, so configs are forward-compatible. When plugins catch up, users just bump ESLint.
**Warning signs:** Lint errors about undefined `.getFilename()` or `.getScope()`.

### Pitfall 2: ESLint Config File Extension (.js vs .mjs vs .ts)
**What goes wrong:** Writing `eslint.config.js` with ESM `import` syntax in a project that doesn't have `"type": "module"` in package.json causes syntax errors.
**Why it happens:** Node.js treats `.js` files as CommonJS by default unless `"type": "module"` is set.
**How to avoid:** Check `packageJson.type`. If `"type": "module"`, write `eslint.config.js` with `import` syntax. If not (or missing), write `eslint.config.mjs` with `import` syntax. The `.mjs` extension forces ESM regardless of package.json type.
**Warning signs:** `SyntaxError: Cannot use import statement in a module` when running ESLint.

### Pitfall 3: Prettier Plugin Load Order
**What goes wrong:** `prettier-plugin-tailwindcss` must be the LAST plugin in the plugins array. If other Prettier plugins are present and Tailwind plugin isn't last, class sorting breaks.
**Why it happens:** Prettier plugins use a shared API for parsing; Tailwind plugin needs final processing position.
**How to avoid:** When generating `.prettierrc` for Tailwind projects, always append `prettier-plugin-tailwindcss` as the last plugin entry. Document this in the summary card's "next steps."
**Warning signs:** Tailwind classes not being sorted after running Prettier.

### Pitfall 4: Husky Init in Non-Git Repositories
**What goes wrong:** `npx husky init` fails if the project directory isn't a git repository (no `.git` folder).
**Why it happens:** Husky installs Git hooks; no `.git` means no hooks directory to write to.
**How to avoid:** In the husky module's `detect()` or early in `install()`, check for `.git` directory existence. If missing, warn and skip (or run `git init` first). Since tinkerise scaffolders typically initialize git, this is rare but possible with `--no-git`.
**Warning signs:** `fatal: not a git repository` from husky commands.

### Pitfall 5: lint-staged Config Adapting to Installed Tools
**What goes wrong:** lint-staged config references `eslint --fix` but ESLint isn't installed, or references `prettier --write` but Prettier isn't installed. Pre-commit hook fails with "command not found."
**Why it happens:** husky module generates lint-staged config without checking what other enhancements are actually present.
**How to avoid:** The husky module must check `installedDeps` (from ProjectContext) AND the current enhancement execution summary to determine which commands to include. If ESLint is being installed in the same batch (earlier in topological order), include its command. If not in batch and not in deps, omit it.
**Warning signs:** Pre-commit hook fails on first commit after setup.

### Pitfall 6: package.json Race Condition Between Modules
**What goes wrong:** Multiple enhancement modules read/modify package.json. If module A reads, then module B reads, then A writes, then B writes -- B's write overwrites A's changes.
**Why it happens:** Modules execute sequentially (topological sort), but if a helper caches the package.json read, stale data gets written.
**How to avoid:** The `addScript()` and similar helpers MUST read package.json fresh every time, not use a cached copy. Since modules execute sequentially in the topological sort, each read sees the previous module's writes.
**Warning signs:** Missing scripts or dependencies after running multiple enhancements.

### Pitfall 7: CI Workflow Overwriting Existing Workflows
**What goes wrong:** User already has `.github/workflows/ci.yml` from a template or manual setup. The CI enhancement module blindly overwrites it.
**Why it happens:** The module doesn't detect existing CI configuration.
**How to avoid:** The `detect()` function must check for existing `.github/workflows/ci.yml` (and common alternatives like `ci.yaml`, `test.yml`). If found, trigger the conflict resolution flow (skip/merge/replace). For CI workflows, "merge" is complex (YAML deep merge is fragile), so recommend skip or replace.
**Warning signs:** User's custom CI configuration lost after running `tinkerise add ci`.

### Pitfall 8: Summary Card Per-Enhancement vs Combined
**What goes wrong:** Showing one combined summary card that lists all enhancements together, losing the per-enhancement detail.
**Why it happens:** The Phase 5 `showEnhancementSummary()` shows installed/skipped/failed status per module but not the files/packages details per module.
**How to avoid:** Per locked decision, each enhancement gets its own summary card with files created/modified, packages installed, next steps. This means the InstallResult from each module must be collected and displayed individually, not just the high-level ExecutionSummary. Either extend `showEnhancementSummary()` or build per-module summary display in the `add` command.
**Warning signs:** Users can't tell which enhancement created which files.

## Code Examples

### ESLint Flat Config for React/Next.js (TypeScript)

Verified pattern from Context7 and ESLint official docs.

```typescript
// Generated eslint.config.mjs content for a Next.js project with TypeScript

const content = `
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import globals from 'globals'

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
])
`
// Source: Context7 /eslint/eslint/v9.37.0, /typescript-eslint/typescript-eslint,
//         /jsx-eslint/eslint-plugin-react
```

### ESLint Flat Config for Vue/Nuxt (TypeScript)

```typescript
// Generated eslint.config.mjs content for a Vue/Nuxt project with TypeScript

const content = `
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
])
`
// Source: Context7 /vuejs/eslint-plugin-vue
```

### ESLint Flat Config for Svelte

```typescript
// Generated eslint.config.mjs content for Svelte

const content = `
import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
]
`
// Source: sveltejs/eslint-plugin-svelte user guide
```

### Prettier Config with Tailwind Plugin

```typescript
// Only generate .prettierrc when Tailwind is detected
// Per locked decision: pure defaults, no file otherwise

function generatePrettierConfig(hasTailwind: boolean): string | null {
  if (!hasTailwind) return null // No config file needed

  return JSON.stringify(
    { plugins: ['prettier-plugin-tailwindcss'] },
    null,
    2,
  ) + '\n'
}
// Source: Context7 /tailwindlabs/prettier-plugin-tailwindcss
```

### Husky + lint-staged Setup

```typescript
// Husky init pattern (v9)
// 1. Install husky as devDep
// 2. Add "prepare": "husky" to scripts
// 3. Create .husky/pre-commit with lint-staged command
// 4. Add lint-staged config to package.json

async function setupHusky(ctx: ProjectContext, hasEslint: boolean, hasPrettier: boolean) {
  // Install packages
  await installPackages(['husky', 'lint-staged'], { cwd: ctx.rootDir, packageManager: ctx.packageManager })

  // Add prepare script
  await addScript(ctx.rootDir, 'prepare', 'husky')

  // Create .husky directory
  await mkdir(join(ctx.rootDir, '.husky'), { recursive: true })

  // Write pre-commit hook
  await writeFile(
    join(ctx.rootDir, '.husky', 'pre-commit'),
    'npx lint-staged\n',
  )

  // Build lint-staged config based on installed tools
  const lintStagedConfig: Record<string, string[]> = {}

  if (hasEslint) {
    lintStagedConfig['*.{js,jsx,ts,tsx,vue,svelte,astro}'] = ['eslint --fix']
  }
  if (hasPrettier) {
    const key = '*.{js,jsx,ts,tsx,vue,svelte,astro,json,md,css}'
    lintStagedConfig[key] = [...(lintStagedConfig[key] ?? []), 'prettier --write']
  }

  // Merge lint-staged into package.json
  // ...
}
// Source: Context7 /typicode/husky, WebSearch lint-staged patterns
```

### GitHub Actions CI Workflow

```yaml
# Generated .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4

      # pnpm setup (only if PM is pnpm)
      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm run test -- --run
      - run: pnpm run build
```

### @clack/prompts Multiselect with Disabled Options

```typescript
// Interactive enhancement picker
import * as p from '@clack/prompts'

async function showEnhancementPicker(ctx: ProjectContext) {
  // Run detect() on all available modules to check installed state
  const options = await Promise.all(
    allModules.map(async (mod) => {
      const detection = await mod.detect(ctx)
      return {
        value: mod.id,
        label: mod.name,
        hint: detection.installed ? 'already installed' : mod.description,
        disabled: detection.installed,
      }
    }),
  )

  const selected = await p.multiselect({
    message: 'Select enhancements to add:',
    options,
    required: false,
  })

  if (p.isCancel(selected)) process.exit(0)
  return (selected as string[]).map(id => moduleMap.get(id)!)
}
// Source: Context7 /bombshell-dev/clack -- multiselect with disabled option
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eslintrc.json` / `.eslintrc.js` (eslintrc) | `eslint.config.js` (flat config) | ESLint v9 default (2024), v10 mandatory (Feb 2026) | MUST generate flat config; detection must check both old and new formats |
| `eslint-config-*` shared configs in extends | `defineConfig` with `extends` array in flat config | ESLint v9.17+ (2025) | Use `defineConfig([...])` over raw array export for better DX |
| `husky install` in postinstall script | `husky` command in `prepare` script | Husky v9 (2024) | Must use `prepare` script; `husky init` creates the right structure |
| lint-staged v15 with --shell support | lint-staged v16 removes --shell | v16 (late 2025) | Stick with v15 for stability; our config doesn't need --shell |
| `npm install` with verbose output | Piped stdio for suppressed output | Existing pattern decision | Enhancement installs use `stdio: 'pipe'`; `--verbose` to show |
| Combined summary card | Per-enhancement summary cards | Locked Phase 6 decision | Each module reports its own files/packages/next-steps |

**Deprecated/outdated:**
- **eslintrc format:** Completely removed in ESLint v10.0.0 (Feb 6, 2026). Only flat config supported. Our generated configs use flat format which works in both v9 and v10.
- **`husky install`:** Replaced by `husky` command in v9. The old `postinstall` approach is deprecated.
- **lint-staged --shell flag:** Removed in v16.0.0. We don't use it, but worth noting in case users have existing configs.

## Open Questions

1. **ESLint v9 vs v10 timing**
   - What we know: ESLint v10 released Feb 6, 2026. eslint-plugin-react does NOT support v10 yet (PR #3979 open). typescript-eslint v8.56+ supports v10. eslint-plugin-vue, svelte, astro status unclear for v10.
   - What's unclear: When eslint-plugin-react will release v10 support. Could be days or weeks.
   - Recommendation: **Target ESLint v9.x** (`^9.23.0` already in version map). Flat config format is identical between v9 and v10. When all plugins support v10, a single version bump in `dependencyVersionMap` upgrades all users. No config format changes needed.

2. **Per-enhancement summary card implementation**
   - What we know: Phase 5's `showEnhancementSummary()` shows installed/skipped/failed per module ID. Locked decision says "Each enhancement gets its own summary card after running: files created/modified, packages installed, next steps."
   - What's unclear: Whether to extend `showEnhancementSummary()` or build a new display function.
   - Recommendation: Build a new `showPerEnhancementSummary(moduleId, installResult, nextSteps)` function that shows detailed per-module output. Keep `showEnhancementSummary()` for the overall status. Display per-module summaries inline as each module completes, then overall summary at the end.

3. **`globals` package as new dependency**
   - What we know: ESLint flat config requires the `globals` npm package for `globals.browser` and `globals.node`. It's not installed by ESLint itself.
   - What's unclear: Whether to add `globals` to the tinkerise monorepo or only install it into user projects.
   - Recommendation: Only install `globals` into user projects (via the ESLint enhancement). Add `globals` to `dependencyVersionMap` with version `^17.3.0`. The tinkerise monorepo doesn't need it since we generate config file content as strings, not execute it.

4. **CI trigger strategy (Claude's discretion)**
   - What we know: User left this to Claude's discretion. Common patterns: PR-only, push-to-main-only, or both.
   - Recommendation: **Both PR and push to main.** This is the most common pattern in the ecosystem. PRs get checked before merge; pushes to main catch anything that slipped through (merge queue, direct pushes). The generated workflow should use `on: { pull_request: { branches: [main] }, push: { branches: [main] } }`.

5. **Vue SFC parser configuration in ESLint**
   - What we know: Vue single-file components need `parserOptions: { parser: tseslint.parser }` for TypeScript in `<script>` blocks. Without this, TypeScript rules don't apply inside `.vue` files.
   - What's unclear: Whether to always add this or only when TypeScript is detected.
   - Recommendation: Always add the TypeScript parser config for Vue/Nuxt projects since most modern Vue projects use TypeScript. If `typescript` is not in `installedDeps`, skip `tseslint` entirely and use a simpler Vue config.

## Sources

### Primary (HIGH confidence)
- Context7 `/eslint/eslint/v9.37.0` -- flat config `defineConfig`, `@eslint/js` recommended, plugin configuration pattern
- Context7 `/typescript-eslint/typescript-eslint` -- `tseslint.config()`, `tseslint.configs.recommended`, flat config setup
- Context7 `/vuejs/eslint-plugin-vue` -- `configs['flat/recommended']`, TypeScript parser options for Vue SFC
- Context7 `/jsx-eslint/eslint-plugin-react` -- `configs.flat.recommended`, `configs.flat['jsx-runtime']`, settings.react.version detect
- Context7 `/tailwindlabs/prettier-plugin-tailwindcss` -- plugin load order (must be last), `.prettierrc` configuration
- Context7 `/typicode/husky` -- v9 `init` pattern, `prepare` script, `.husky/pre-commit` hook creation
- Context7 `/bombshell-dev/clack` -- `multiselect` with `disabled` option, `groupMultiselect`
- Codebase: `packages/core/src/enhancements/` -- Phase 5 types, executor, context, conflict, summary, version-map
- Codebase: `packages/cli/src/index.ts` -- Commander.js setup, command registration pattern
- Codebase: `packages/cli/src/commands/scaffold.ts` -- execution pipeline pattern, PM resolution
- Codebase: `packages/cli/src/context/session.ts` -- SessionContext for same-session scaffold -> enhance flow

### Secondary (MEDIUM confidence)
- [ESLint v10.0.0 release blog](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/) -- eslintrc removal, Node.js requirements, breaking changes
- [eslint-plugin-react #3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977) -- ESLint v10 compatibility issue, PR #3979 in progress
- [eslint-plugin-svelte user guide](https://sveltejs.github.io/eslint-plugin-svelte/user-guide/) -- flat config setup pattern
- [eslint-plugin-astro user guide](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/) -- flat config setup pattern
- [GitHub Actions Node.js docs](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs) -- workflow structure, pnpm/yarn caching
- [pnpm CI docs](https://pnpm.io/continuous-integration) -- `pnpm/action-setup@v4`, `--frozen-lockfile`
- [lint-staged v16 release](https://github.com/lint-staged/lint-staged/releases/tag/v16.0.0) -- breaking changes (--shell removed)
- [Commander.js #1569](https://github.com/tj/commander.js/issues/1569) -- implicit program name detection from argv

### Tertiary (LOW confidence)
- eslint-plugin-svelte ESLint v10 compatibility: no explicit confirmation found, but flat config support suggests likely compatibility
- eslint-plugin-astro ESLint v10 compatibility: no explicit confirmation found; same assessment as svelte

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already in `dependencyVersionMap`; versions verified against npm; ESLint v9 targeting decision based on verified plugin incompatibility with v10
- Architecture: HIGH -- follows established Phase 5 patterns (defineEnhancement, runEnhancements, ProjectContext); CLI patterns match existing scaffold command; Context7 verified all plugin flat config APIs
- Pitfalls: HIGH -- ESLint v10 incompatibility verified via GitHub issue; config file extension logic based on Node.js ESM resolution rules; lint-staged adaptation logic derived from locked decisions

**Research date:** 2026-02-17
**Valid until:** 2026-03-03 (14 days -- fast-moving due to ESLint v10 ecosystem catch-up; re-verify plugin compatibility before implementation)
