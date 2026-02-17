# Phase 3: Interactive UX & Package Manager Detection - Research

**Researched:** 2026-02-17
**Domain:** Interactive CLI prompts, Commander.js subcommand routing, package manager detection from lockfiles
**Confidence:** HIGH

## Summary

Phase 3 wires the existing scaffolder registry and execution engine (Phase 2) to an interactive prompt flow using @clack/prompts v1.0.1, and adds package manager detection from lockfiles/packageManager field. The CLI must handle three entry modes: (1) fully interactive with no arguments, (2) partial-flag hybrid mode where provided flags skip their corresponding prompts, and (3) fully non-interactive when all required flags are provided. CI environments are auto-detected via ci-info and default to non-interactive mode.

The architecture centers on Commander.js subcommands for category routing (`tinkerise web`, `tinkerise backend`, etc.), with a default action handler on the root program that launches the interactive flow when no arguments are given. @clack/prompts provides the visual prompt layer -- `select` with disabled options as category headers for the flat grouped framework list, `multiselect` for framework-specific option toggles, and `text` for project naming. Package manager detection follows the antfu/ni precedence pattern: explicit `--package-manager` flag > lockfile in cwd > `packageManager` field in package.json > prompt user to choose.

**Primary recommendation:** Use @clack/prompts v1.0.1 (ESM-only, Node 20+) for all interactive prompts with `p.group()` for flow orchestration and centralized cancellation. Use ci-info v4.4.0 (CJS, but importable via createRequire) for CI detection. Build package manager detection as a standalone module in `@tinkerise/core` using direct fs lookups -- no third-party detection library needed for the simple lockfile-to-PM mapping required.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Prompt flow experience:** Running `tinkerise` with no arguments shows all frameworks in a single grouped-by-category list (Web, Backend, Mobile) -- no category selection step. Running `tinkerise web` jumps into the interactive flow starting at framework selection within that category. After framework selection, framework-specific options (TypeScript, Tailwind, etc.) presented as a multi-select checklist -- user toggles multiple at once. No confirmation step before scaffolding -- start immediately after the last prompt answer. Ctrl+C exits silently with no message.
- **Prompt library & visual style:** Use @clack/prompts for the interactive experience (modern, minimal aesthetic with box-drawn frames). Intro banner at start showing tinkerise branding, then clean prompts with minimal branding during the flow. Use terminal colors AND emoji icons for visual hierarchy (green for success, red for errors, plus checkmarks/arrows/sparkles). Success output is a minimal one-liner (e.g., "Created my-app. cd my-app && npm run dev") -- no box or formatted next-steps section.
- **Non-interactive mode:** tinkerise is NOT for CI/CD -- it's a developer terminal tool. Full flag mode supported: all interactive options have flag equivalents, if all required args provided, skip prompts entirely. Partial flags: skip questions already answered by flags, prompt only for what's missing (hybrid mode).
- **Package manager detection:** Detection precedence: --package-manager flag > lockfile > packageManager field in package.json. Supported PMs: npm, pnpm, yarn, bun. When no lockfile or packageManager field found, prompt the user to choose their PM. Verify detected PM binary exists before using -- if not found, warn and fall back to prompting.

### Claude's Discretion
- Exact clack prompt configuration and theming
- Banner design/art
- Emoji choices for different states
- Error message wording
- Lockfile-to-PM mapping implementation details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLI-01 | User can run `tinkerise <category> [framework] [project-name]` to scaffold a project | Commander.js subcommands with optional `[framework]` and `[project-name]` arguments; action handler routes to interactive flow or direct execution based on what's provided |
| UX-01 | User sees a guided interactive flow when running `tinkerise` without arguments | Root program `.action()` handler launches `p.group()` flow with `p.select()` for grouped framework list, `p.multiselect()` for options, `p.text()` for project name |
| UX-02 | User sees a framework selection flow when running `tinkerise <category>` without a framework | Category subcommand action handler detects missing framework arg and launches filtered `p.select()` showing only that category's scaffolders |
| UX-03 | User can cancel at any prompt step without side effects | `p.group()` onCancel handler calls `process.exit(0)` silently (user decision: Ctrl+C exits silently). `p.isCancel()` check after each standalone prompt. |
| UX-04 | User can run any command fully non-interactively via CLI flags | Commander.js `.option()` definitions for `--typescript`, `--tailwind`, `--eslint`, `--no-git`, `--no-install`, `--package-manager`, `--name`. Check if all required params present; if so, skip prompts entirely. |
| UX-05 | CI environments are auto-detected via ci-info and default to non-interactive mode with sensible defaults | `ci-info` v4.4.0 `isCI` check; when true, require all flags or exit with clear error message (not silent failure). User decision: tinkerise is NOT for CI/CD, but still detect and handle gracefully. |
| PM-01 | tinkerise detects the user's preferred package manager from lockfiles in the current directory | Direct fs.access() checks for package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb/bun.lock in cwd |
| PM-02 | tinkerise detects the `packageManager` field in package.json | Read and parse package.json in cwd; extract `packageManager` field; parse PM name from format `pm@version` |
| PM-03 | User can override detection with `--package-manager` flag | Commander.js `--package-manager <pm>` option takes precedence over all detection; validated against allowed values |
| PM-04 | tinkerise falls back to npm when no package manager is detected | Per user decision: when no lockfile or packageManager field found, prompt user to choose (interactive mode) or fall back to npm (non-interactive mode) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @clack/prompts | ^1.0.1 | Interactive CLI prompts | ESM-only since v1.0.0; modern box-drawn UI; used by create-t3-app, create-astro; `group()` for flow orchestration; `select`, `multiselect`, `text`, `spinner`; built-in cancel detection |
| ci-info | ^4.4.0 | CI environment detection | 50+ CI services detected; `isCI` boolean + `name` string; 4.4.0 released Jan 2026; MIT license; CJS but importable in ESM via createRequire or default import |
| commander | ^13.0 | CLI argument parsing | Already in @tinkerise/cli; subcommands, optional args, `.option()`, `.getOptionValueSource()` for detecting user-provided vs defaults |
| picocolors | ^1.1 | Terminal colors | Already in @tinkerise/cli; used for intro banner, emoji + color visual hierarchy |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| which | ^6.0.1 | Verify PM binary exists | Already in @tinkerise/core; validate detected PM binary is actually installed before using |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ci-info | is-in-ci v2.0.0 | is-in-ci is ESM-only and simpler (just checks CI/CONTINUOUS_INTEGRATION env vars). ci-info detects 50+ specific services and provides `name`. Since tinkerise just needs a boolean check, either works. ci-info is more established (referenced in REQUIREMENTS.md). |
| ci-info | @npmcli/ci-detect | More detection but overkill; ci-info is simpler and widely used |
| Hand-rolled PM detection | detect-package-manager or nypm | Third-party libraries add detection for edge cases we don't need. Our mapping is 4 lockfiles + 1 packageManager field -- simple enough to own. |
| @clack/prompts | inquirer.js | Inquirer has larger API surface but clack has better visual output, smaller size, and is the user's locked decision |

**Installation:**
```bash
# @clack/prompts goes in cli package (prompt layer lives in CLI)
bun add @clack/prompts --filter @tinkerise/cli

# ci-info goes in core package (detection logic is business logic)
bun add ci-info --filter @tinkerise/core
```

Note: `commander`, `picocolors`, and `which` are already installed.

## Architecture Patterns

### Recommended Project Structure
```
packages/cli/src/
├── commands/
│   ├── scaffold.ts          # Default action: full interactive flow
│   ├── web.ts               # `tinkerise web [framework] [name]` subcommand
│   ├── backend.ts           # `tinkerise backend [framework] [name]` subcommand
│   └── mobile.ts            # `tinkerise mobile [framework] [name]` subcommand
├── prompts/
│   ├── flow.ts              # p.group() orchestration: framework -> options -> name -> execute
│   ├── framework-select.ts  # Grouped framework select (all categories or filtered)
│   ├── options-select.ts    # Framework-specific multiselect for options (TS, Tailwind, etc.)
│   ├── project-name.ts      # Project name text input with validation
│   └── pm-select.ts         # Package manager selection prompt (fallback when no detection)
├── utils/
│   ├── brand.ts             # (existing) Branding utilities
│   ├── interactive.ts       # Detect interactive vs non-interactive mode; merge flags + prompts
│   └── banner.ts            # Intro banner with tinkerise branding + emoji
└── index.ts                 # (existing) Commander program definition

packages/core/src/
├── pm/
│   ├── detect.ts            # detectPackageManager(): lockfile -> PM mapping
│   ├── verify.ts            # verifyPmBinary(): check if PM binary exists via `which`
│   └── index.ts             # Public API re-exports
├── registry/                # (existing)
├── flags/                   # (existing)
├── executor/                # (existing)
└── index.ts                 # (existing) + new PM detection exports
```

### Pattern 1: Commander.js Subcommand Routing with Default Interactive Flow
**What:** Root program action handler launches interactive flow when no args; category subcommands handle `tinkerise web [framework] [name]`
**When to use:** CLI entry point wiring
**Example:**
```typescript
// Source: Commander.js docs — .action() on program for default, .command() for subcommands
import { Command } from 'commander'
import { runInteractiveFlow } from './commands/scaffold.js'
import { runCategoryFlow } from './commands/web.js'

const program = new Command()
program
  .name('tinkerise')
  .description('Scaffold any project with any stack')
  .version(version, '-v, --version')

// Global options available to all commands
program
  .option('--typescript, --ts', 'Use TypeScript')
  .option('--tailwind', 'Add Tailwind CSS')
  .option('--eslint', 'Add ESLint')
  .option('--no-git', 'Skip git initialization')
  .option('--no-install', 'Skip dependency installation')
  .option('--package-manager <pm>', 'Package manager (npm, pnpm, yarn, bun)')

// Default action: no command -> launch interactive flow
program
  .argument('[category]', 'Project category (web, backend, mobile)')
  .argument('[framework]', 'Framework name')
  .argument('[name]', 'Project name')
  .action(async (category, framework, name, options) => {
    if (!category) {
      // No args at all: full interactive flow
      await runInteractiveFlow(options)
    } else if (!framework) {
      // Category only: show framework selection for that category
      await runCategoryFlow(category, options)
    } else {
      // All positional args: non-interactive or hybrid
      await runDirectExecution(category, framework, name, options)
    }
  })

program.parse()
```

### Pattern 2: Grouped Framework Select with @clack/prompts
**What:** Single flat list with category headers using disabled options in `p.select()`
**When to use:** UX-01 -- showing all frameworks grouped by category without a separate category step
**Example:**
```typescript
// Source: @clack/prompts docs — select with disabled option for headers
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { getAllScaffolders } from '@tinkerise/core'

async function selectFramework(filterCategory?: string): Promise<string> {
  const scaffolders = filterCategory
    ? getScaffoldersByCategory(filterCategory)
    : getAllScaffolders()

  // Build options with category headers as disabled items
  const options: Array<{ value: string; label: string; hint?: string; disabled?: boolean }> = []

  const categories = ['web', 'backend', 'mobile'] as const
  for (const cat of categories) {
    const items = scaffolders.filter(s => s.category === cat)
    if (items.length === 0) continue

    // Category header (disabled, not selectable)
    options.push({
      value: `__header_${cat}`,
      label: pc.bold(`${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`),
      disabled: true,
    })

    // Framework items
    for (const s of items) {
      options.push({
        value: s.name,
        label: `  ${s.name}`,
        hint: s.packageName,
      })
    }
  }

  const result = await p.select({
    message: 'What would you like to create?',
    options,
  })

  if (p.isCancel(result)) {
    process.exit(0)  // Silent exit per user decision
  }

  return result as string
}
```

### Pattern 3: p.group() for Flow Orchestration with Centralized Cancel
**What:** Chain prompts with shared context and single cancel handler
**When to use:** Full interactive flow (UX-01)
**Example:**
```typescript
// Source: @clack/prompts docs — group() with onCancel
import * as p from '@clack/prompts'

async function runInteractiveFlow(cliOptions: Record<string, unknown>): Promise<void> {
  p.intro(buildBanner())

  const answers = await p.group(
    {
      framework: () =>
        // Skip if framework already provided via positional arg
        cliOptions.framework
          ? Promise.resolve(cliOptions.framework)
          : selectFramework(),

      options: ({ results }) =>
        // Skip if all options provided via flags
        allOptionsProvided(cliOptions)
          ? Promise.resolve(extractOptions(cliOptions))
          : selectFrameworkOptions(results.framework as string, cliOptions),

      name: ({ results }) =>
        // Skip if name provided via positional arg or --name flag
        cliOptions.name
          ? Promise.resolve(cliOptions.name)
          : p.text({
              message: 'Project name:',
              placeholder: `my-${results.framework}-app`,
              validate: validateProjectName,
            }),
    },
    {
      onCancel: () => {
        process.exit(0)  // Silent exit, no message (user decision)
      },
    },
  )

  // No confirmation step (user decision) -- execute immediately
  await executeScaffolder({
    scaffolderName: answers.framework as string,
    projectName: answers.name as string,
    userFlags: mergeFlags(cliOptions, answers.options),
  })
}
```

### Pattern 4: Package Manager Detection Pipeline
**What:** Detect PM from lockfile/packageManager field with binary verification
**When to use:** Before scaffolding, to pass `--package-manager` to upstream tools
**Example:**
```typescript
// Source: antfu/package-manager-detector pattern + user decisions
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import which from 'which'

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

const LOCKFILE_MAP: Record<string, PackageManager> = {
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'bun.lockb': 'bun',
  'bun.lock': 'bun',
}

interface DetectResult {
  pm: PackageManager
  source: 'flag' | 'lockfile' | 'packageManager-field' | 'prompt' | 'default'
}

async function detectFromLockfile(cwd: string): Promise<PackageManager | null> {
  for (const [file, pm] of Object.entries(LOCKFILE_MAP)) {
    try {
      await access(join(cwd, file))
      return pm
    } catch {
      // File doesn't exist, try next
    }
  }
  return null
}

async function detectFromPackageJson(cwd: string): Promise<PackageManager | null> {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw)
    if (pkg.packageManager) {
      // Format: "pnpm@8.15.0" or "npm@10.2.0"
      const name = pkg.packageManager.split('@')[0]
      if (['npm', 'pnpm', 'yarn', 'bun'].includes(name)) {
        return name as PackageManager
      }
    }
  } catch {
    // No package.json or invalid JSON
  }
  return null
}

async function verifyPmBinary(pm: PackageManager): Promise<boolean> {
  const resolved = await which(pm, { nothrow: true })
  return resolved !== null
}

export async function detectPackageManager(
  cwd: string,
  flagValue?: string,
): Promise<DetectResult> {
  // 1. Explicit flag takes precedence
  if (flagValue && ['npm', 'pnpm', 'yarn', 'bun'].includes(flagValue)) {
    return { pm: flagValue as PackageManager, source: 'flag' }
  }

  // 2. Lockfile detection
  const fromLockfile = await detectFromLockfile(cwd)
  if (fromLockfile) {
    const exists = await verifyPmBinary(fromLockfile)
    if (exists) return { pm: fromLockfile, source: 'lockfile' }
    // Binary not found -- fall through to prompt
  }

  // 3. packageManager field in package.json
  const fromPkgJson = await detectFromPackageJson(cwd)
  if (fromPkgJson) {
    const exists = await verifyPmBinary(fromPkgJson)
    if (exists) return { pm: fromPkgJson, source: 'packageManager-field' }
    // Binary not found -- fall through to prompt
  }

  // 4. No detection: will need prompt or default
  return { pm: 'npm', source: 'default' }
}
```

### Pattern 5: Hybrid Mode (Partial Flags Skip Corresponding Prompts)
**What:** Check which flags were explicitly provided; skip their prompts, ask for the rest
**When to use:** UX-04 partial flag support
**Example:**
```typescript
// Source: Commander.js docs — .getOptionValueSource()
function isOptionProvided(cmd: Command, optionName: string): boolean {
  return cmd.getOptionValueSource(optionName) === 'cli'
}

// In the prompt flow:
const answers = await p.group({
  framework: () =>
    providedFramework ? Promise.resolve(providedFramework) : selectFramework(),

  options: ({ results }) => {
    // Build multiselect but pre-select options already provided via flags
    const preselected: string[] = []
    if (isOptionProvided(cmd, 'typescript')) preselected.push('typescript')
    if (isOptionProvided(cmd, 'tailwind')) preselected.push('tailwind')

    // If ALL options are covered by flags, skip the multiselect entirely
    if (allOptionsResolved(preselected, results.framework)) {
      return Promise.resolve(preselected)
    }

    return selectFrameworkOptions(results.framework as string, preselected)
  },

  name: () =>
    providedName ? Promise.resolve(providedName) : p.text({ message: 'Project name:' }),
}, { onCancel: () => process.exit(0) })
```

### Anti-Patterns to Avoid
- **Category selection step before frameworks:** User decided on a single grouped-by-category list. Never add a separate "pick a category" prompt.
- **Confirmation prompt before scaffolding:** User explicitly decided no confirmation step. Execute immediately after the last prompt.
- **Capturing prompts in CI:** tinkerise is a developer tool, not for CI/CD. In CI, either all flags are provided (non-interactive) or exit with error -- never hang waiting for input.
- **Building custom prompt rendering:** Use @clack/prompts as-is. Do not build custom terminal rendering or cursor manipulation.
- **Re-implementing PM detection:** The lockfile-to-PM mapping is 5 entries. Do not pull in a dependency for this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive CLI prompts | Custom readline/stdin handling | @clack/prompts | Terminal raw mode, cursor control, Unicode rendering, Windows compat |
| CI environment detection | Checking `process.env.CI` manually | ci-info | 50+ CI services have different env vars; some set `CI`, others don't |
| Select with keyboard navigation | Arrow key handling + ANSI rendering | @clack/prompts `select()` | Cross-platform terminal input, accessibility, scrolling for long lists |
| PM binary existence check | Manual PATH search | `which` | Already in project; handles Windows PATHEXT, .cmd wrappers |

**Key insight:** Interactive terminal prompts are deceptively complex. Raw mode handling, cursor positioning, ANSI escape sequences, Unicode width calculation, and Windows terminal compatibility all need to work correctly. @clack/prompts handles all of this. The PM detection lockfile mapping, conversely, is simple enough that a third-party library adds unnecessary weight.

## Common Pitfalls

### Pitfall 1: Hanging in CI When Prompts Launch
**What goes wrong:** Running tinkerise in a CI pipeline with no flags causes it to hang waiting for interactive input that will never come.
**Why it happens:** CI environments don't have a TTY attached; @clack/prompts waits for terminal input indefinitely.
**How to avoid:** Check `ci-info.isCI` early. If true and required flags are missing, print clear error message listing required flags and exit with code 1. Never silently hang.
**Warning signs:** CI job timeouts. The `stdin.isTTY` check is unreliable in some CI environments; use ci-info instead.

### Pitfall 2: @clack/prompts isCancel Not Checked After Individual Prompts
**What goes wrong:** User presses Ctrl+C during a prompt, but the flow continues to the next prompt or crashes with an unhandled symbol error.
**Why it happens:** @clack/prompts returns a `Symbol` when cancelled. If you don't check `isCancel()`, passing a Symbol to subsequent logic causes TypeScript runtime errors.
**How to avoid:** Use `p.group()` with `onCancel` for flow orchestration -- it handles cancel detection centrally. If using individual prompts outside `group()`, always check `isCancel()` after each prompt call.
**Warning signs:** Uncaught TypeError about Symbol in logs.

### Pitfall 3: Commander.js Option Parsing Conflicts with @clack/prompts
**What goes wrong:** Commander.js parses `--no-git` and converts it to `{ git: false }` in options. This implicit negation behavior can conflict with explicit flag names.
**Why it happens:** Commander.js has built-in boolean negation: `--no-X` creates option `X` with value `false`.
**How to avoid:** Define the positive option first, then Commander.js properly handles `--no-X` as negation. For example: `.option('--git', 'Initialize git repo', true)` enables `--no-git` negation. Use `.getOptionValueSource()` to distinguish "user explicitly passed --no-git" from "default value".
**Warning signs:** Flags silently having wrong boolean values.

### Pitfall 4: Lockfile Race Condition with Multiple Lockfiles
**What goes wrong:** A directory has both `package-lock.json` and `yarn.lock` (common when switching PMs). The detected PM depends on iteration order, not user intent.
**Why it happens:** Developers switch PMs without cleaning up old lockfiles.
**How to avoid:** Define explicit precedence order for lockfile checks. Recommended: pnpm-lock.yaml > bun.lockb/bun.lock > yarn.lock > package-lock.json (less common PMs first, since their lockfile presence is more intentional). If multiple lockfiles detected, log a warning about the ambiguity.
**Warning signs:** Inconsistent PM detection between runs on same project.

### Pitfall 5: ci-info is CJS in an ESM Project
**What goes wrong:** `import ci from 'ci-info'` may fail or behave unexpectedly because ci-info v4.4.0 is a CommonJS package with `"type": "commonjs"`.
**Why it happens:** ci-info hasn't migrated to ESM. Node.js 20+ can import CJS modules from ESM, but the interop has edge cases.
**How to avoid:** Node.js 20.11.0+ (our baseline) supports `require(esm)` backport and CJS-from-ESM import. The default import `import ci from 'ci-info'` works because Node resolves CJS default export. Alternatively, use `createRequire` if issues arise. Test the import in the project's build output.
**Warning signs:** Build failures or `ERR_REQUIRE_ESM` errors during testing.

### Pitfall 6: select() Disabled Options Still Return Values
**What goes wrong:** Using disabled options as category headers means they still have a `value` property. If cursor navigation skips them correctly in the UI but the value leaks into results somehow, downstream logic breaks.
**Why it happens:** The disabled option is still part of the options array.
**How to avoid:** Use distinctive sentinel values for disabled header options (e.g., `__header_web`) and validate the returned value is not a header sentinel. @clack/prompts v0.8.0+ correctly prevents selection of disabled options, but defensive validation is free insurance.
**Warning signs:** Header text appearing as selected framework name.

## Code Examples

### Complete Interactive Flow with Banner
```typescript
// Source: @clack/prompts docs + user decisions
import * as p from '@clack/prompts'
import pc from 'picocolors'

export async function runInteractiveFlow(options: CliOptions): Promise<void> {
  // Intro banner with tinkerise branding
  p.intro(`${pc.bgCyan(pc.black(' tinkerise '))} ${pc.dim('scaffold anything')}`)

  const answers = await p.group(
    {
      framework: () => selectFramework(),
      options: ({ results }) =>
        selectFrameworkOptions(results.framework!),
      name: ({ results }) =>
        p.text({
          message: 'Project name:',
          placeholder: `my-${results.framework}-app`,
          validate: (value) => {
            if (!value) return 'Project name is required'
            if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers, and hyphens only'
          },
        }),
    },
    {
      onCancel: () => {
        // Silent exit per user decision: "Ctrl+C exits silently with no message"
        process.exit(0)
      },
    },
  )

  // Detect package manager
  const pmResult = await detectPackageManager(process.cwd(), options.packageManager)

  // Execute immediately (no confirmation step per user decision)
  const s = p.spinner()
  s.start('Setting up project...')

  await executeScaffolder({
    scaffolderName: answers.framework as string,
    projectName: answers.name as string,
    userFlags: buildUserFlags(answers.options, pmResult.pm),
  })

  s.stop('Done!')

  // Success one-liner per user decision
  p.log.success(
    `${pc.green('Created')} ${pc.bold(answers.name as string)}. ` +
    `${pc.dim(`cd ${answers.name} && ${pmResult.pm} run dev`)}`
  )
}
```

### Framework-Specific Options Multiselect
```typescript
// Source: @clack/prompts docs — multiselect with per-framework options
import * as p from '@clack/prompts'

// Registry of options per scaffolder (which toggles are available)
const FRAMEWORK_OPTIONS: Record<string, Array<{ value: string; label: string; hint?: string }>> = {
  next: [
    { value: 'typescript', label: 'TypeScript', hint: 'recommended' },
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'eslint', label: 'ESLint' },
  ],
  vite: [
    { value: 'typescript', label: 'TypeScript', hint: 'recommended' },
  ],
  // ... per framework
}

async function selectFrameworkOptions(
  framework: string,
  preselected: string[] = [],
): Promise<string[]> {
  const available = FRAMEWORK_OPTIONS[framework]
  if (!available || available.length === 0) return []

  const result = await p.multiselect({
    message: 'Select options:',
    options: available,
    required: false,  // Allow selecting none
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  return result as string[]
}
```

### Package Manager Selection Prompt (Fallback)
```typescript
// Source: @clack/prompts docs — select for PM choice
import * as p from '@clack/prompts'

async function promptPackageManager(): Promise<PackageManager> {
  const result = await p.select({
    message: 'Which package manager would you like to use?',
    options: [
      { value: 'npm', label: 'npm' },
      { value: 'pnpm', label: 'pnpm', hint: 'fast, disk-efficient' },
      { value: 'yarn', label: 'yarn' },
      { value: 'bun', label: 'bun', hint: 'fast all-in-one runtime' },
    ],
  })

  if (p.isCancel(result)) {
    process.exit(0)
  }

  return result as PackageManager
}
```

### CI Detection Guard
```typescript
// Source: ci-info docs
import ci from 'ci-info'

function ensureInteractiveCapable(requiredFlags: string[], providedFlags: Record<string, unknown>): void {
  if (!ci.isCI) return // Not in CI, interactive prompts are fine

  const missing = requiredFlags.filter(f => providedFlags[f] === undefined)
  if (missing.length > 0) {
    console.error(
      `Error: Running in CI environment (${ci.name || 'unknown'}).` +
      ` Missing required flags: ${missing.map(f => `--${f}`).join(', ')}` +
      `\nProvide all required flags for non-interactive execution.`
    )
    process.exit(1)
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| inquirer.js for CLI prompts | @clack/prompts v1.0 | 2024-2025 | 80% smaller, modern UI, ESM-native, better DX |
| is-ci (wrapper around ci-info) | ci-info directly | 2024+ | ci-info provides more detail (name, isPR); is-ci just re-exports isCI |
| Custom lockfile detection per tool | Standardized lockfile-to-PM map | 2023+ (antfu/ni pattern) | Consistent detection across ecosystem; packageManager field becoming standard |
| Separate category > framework steps | Single grouped list with headers | 2024+ (modern CLIs) | Fewer steps = faster flow; category headers provide grouping without navigation |

**Deprecated/outdated:**
- inquirer.js: Still maintained but @clack/prompts is the modern standard for beautiful CLI prompts
- @clack/prompts pre-1.0 (0.x): v1.0.0 introduced breaking ESM-only change; use ^1.0.1
- is-ci: Still works but adds an unnecessary wrapper layer over ci-info

## Open Questions

1. **Commander.js argument structure for hybrid mode**
   - What we know: Commander.js supports `.argument('[optional]')` and `.option('--flag')`. The root program can have both arguments and options.
   - What's unclear: Whether to use root program arguments (`tinkerise [category] [framework] [name]`) or category subcommands (`tinkerise web [framework] [name]`). Subcommands are cleaner but make the "no args = interactive" flow require a separate default action.
   - Recommendation: Use the root program `.action()` for the default interactive flow. Do NOT create separate subcommands for each category -- instead, parse the first positional argument as category. This avoids duplication and enables `tinkerise web next my-app` as well as `tinkerise` with no args.

2. **Spinner during scaffolding vs inherited stdio**
   - What we know: Phase 2 uses `stdio: 'inherit'` which gives the upstream tool full terminal access. A @clack/prompts spinner also writes to the terminal.
   - What's unclear: Whether to show a spinner before/after upstream execution or just during prerequisite checks.
   - Recommendation: Show spinner only during prerequisite checks and PM detection. Once the upstream scaffolder launches with `stdio: 'inherit'`, stop any spinner -- the upstream tool owns the terminal. Resume framing output after the subprocess exits.

3. **Multiselect initial values for hybrid mode**
   - What we know: @clack/prompts `multiselect` has an `initialValues` option per the v1.0 API.
   - What's unclear: Exact API for pre-selecting items in multiselect when some flags are already provided.
   - Recommendation: Use `initialValues` array to pre-check options that were passed via flags. If all options for a framework are covered by flags, skip the multiselect entirely.

## Sources

### Primary (HIGH confidence)
- Context7 `/bombshell-dev/clack` -- `group()`, `select()`, `multiselect()`, `text()`, `intro()`, `outro()`, `isCancel()`, `spinner()` APIs verified
- Context7 `/tj/commander.js` -- subcommand definition, `.argument()`, `.option()`, `.action()`, `.getOptionValueSource()` verified
- GitHub bombshell-dev/clack CHANGELOG.md -- v1.0.0 ESM-only migration confirmed; v0.8.0 disabled options confirmed; v1.0.1 latest
- GitHub watson/ci-info -- v4.4.0 latest; `isCI`, `isPR`, `name` exports; CJS with `"type": "commonjs"`

### Secondary (MEDIUM confidence)
- GitHub antfu-collective/package-manager-detector -- detection strategy precedence (lockfile > packageManager field > devEngines > install-metadata)
- bomb.sh/docs/clack/packages/prompts -- Full API reference including `groupMultiselect`, `autocomplete`, `progress`, `taskLog`, `stream`, `updateSettings`
- sindresorhus/is-in-ci GitHub -- ESM-only alternative to ci-info; v2.0.0

### Tertiary (LOW confidence)
- WebSearch results on Commander.js + @clack/prompts integration patterns -- general approach validated but no authoritative single source
- WebSearch results on lockfile-to-PM mapping specifics (bun.lockb vs bun.lock) -- bun uses both formats depending on version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- @clack/prompts v1.0.1, ci-info v4.4.0, Commander.js all verified via Context7/official docs
- Architecture: HIGH -- prompt flow pattern follows @clack/prompts group() API; PM detection follows antfu/ni established pattern
- Pitfalls: HIGH -- CJS/ESM interop, CI hang risk, cancel handling all documented from official sources
- Commander.js routing: MEDIUM -- hybrid argument/option parsing approach needs validation during implementation; `.getOptionValueSource()` behavior with nested commands unclear

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable domain, 30-day validity)
