/**
 * Web scaffolder registry entries.
 *
 * Each entry is pure data — adding a new web scaffolder requires only
 * adding a defineScaffolder() call here (REG-01).
 */

import { defineScaffolder } from '@tinkerise/shared'

/** Node.js prerequisite shared across all web scaffolders */
function nodePrerequisite(versionRange: string) {
  return {
    command: 'node',
    versionFlag: '--version',
    versionRange,
    installInstructions: {
      darwin: 'brew install node',
      linux: 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs',
      win32: 'winget install OpenJS.NodeJS.LTS',
    },
  }
}

/** Shared package-manager valueMap for tools using --use-{pm} prefix style */
const pmValueMap = { npm: 'npm', pnpm: 'pnpm', yarn: 'yarn', bun: 'bun' }

/**
 * Next.js scaffolder — delegates to create-next-app.
 *
 * Version-aware flags:
 * - v14 (base): --typescript, --skip-git
 * - v15+: --ts, --disable-git, --empty
 * - v16+: --biome
 */
export const nextjs = defineScaffolder({
  name: 'next',
  category: 'web',
  command: 'npx',
  packageName: 'create-next-app',
  integration: { type: 'delegate', command: 'create-next-app' },
  prerequisites: [nodePrerequisite('>=18.17.0')],
  flags: [
    { unified: 'typescript', native: '--typescript' },
    { unified: 'tailwind', native: '--tailwind' },
    { unified: 'eslint', native: '--eslint' },
    { unified: 'no-git', native: '--skip-git' },
    { unified: 'no-install', native: '--skip-install' },
    { unified: 'package-manager', native: '--use-', valueMap: pmValueMap },
    { unified: 'src-dir', native: '--src-dir' },
    { unified: 'import-alias', native: '--import-alias' },
    { unified: 'app-router', native: '--app' },
  ],
  versionedFlags: [
    {
      // v16+: adds --biome, --react-compiler, --turbopack, --api, keeps all v15 flags
      versionRange: '>=16.0.0',
      flags: [
        { unified: 'typescript', native: '--ts' },
        { unified: 'tailwind', native: '--tailwind' },
        { unified: 'eslint', native: '--eslint' },
        { unified: 'biome', native: '--biome' },
        { unified: 'no-git', native: '--disable-git' },
        { unified: 'no-install', native: '--skip-install' },
        { unified: 'package-manager', native: '--use-', valueMap: pmValueMap },
        { unified: 'src-dir', native: '--src-dir' },
        { unified: 'import-alias', native: '--import-alias' },
        { unified: 'app-router', native: '--app' },
        { unified: 'empty', native: '--empty' },
        { unified: 'react-compiler', native: '--react-compiler' },
        { unified: 'turbopack', native: '--turbopack' },
        { unified: 'api', native: '--api' },
      ],
    },
    {
      // v15+: --ts replaces --typescript, --disable-git replaces --skip-git, adds --empty
      versionRange: '>=15.0.0',
      flags: [
        { unified: 'typescript', native: '--ts' },
        { unified: 'tailwind', native: '--tailwind' },
        { unified: 'eslint', native: '--eslint' },
        { unified: 'no-git', native: '--disable-git' },
        { unified: 'no-install', native: '--skip-install' },
        { unified: 'package-manager', native: '--use-', valueMap: pmValueMap },
        { unified: 'src-dir', native: '--src-dir' },
        { unified: 'import-alias', native: '--import-alias' },
        { unified: 'app-router', native: '--app' },
        { unified: 'empty', native: '--empty' },
      ],
    },
  ],
  passthroughArgs: true,
})

/**
 * Vite scaffolder — delegates to create-vite.
 *
 * Vite has no unified flags that map 1:1 to native flags.
 * TypeScript is handled via template suffix (e.g., react -> react-ts)
 * in the CLI layer (Plan 04-02). The empty native string sentinel
 * tells the resolver to accept but produce no args.
 */
export const vite = defineScaffolder({
  name: 'vite',
  category: 'web',
  command: 'npx',
  packageName: 'create-vite',
  integration: { type: 'delegate', command: 'create-vite' },
  prerequisites: [nodePrerequisite('>=18.0.0')],
  flags: [
    { unified: 'typescript', native: '' },
    { unified: 'overwrite', native: '--overwrite' },
  ],
  passthroughArgs: true,
})

/**
 * Astro scaffolder — delegates to create-astro.
 *
 * Astro 5 always uses strict TypeScript (no flag needed).
 * Tailwind is added via `--add tailwindcss` (multi-word native flag,
 * split by the resolver).
 */
export const astro = defineScaffolder({
  name: 'astro',
  category: 'web',
  command: 'npx',
  packageName: 'create-astro',
  integration: { type: 'delegate', command: 'create-astro' },
  prerequisites: [nodePrerequisite('>=18.17.1')],
  flags: [
    { unified: 'typescript', native: '' },
    { unified: 'tailwind', native: '--add tailwindcss' },
    { unified: 'no-git', native: '--no-git' },
    { unified: 'no-install', native: '--no-install' },
    { unified: 'template', native: '--template' },
  ],
  passthroughArgs: true,
})

/**
 * T3 scaffolder — delegates to create-t3-app.
 *
 * T3 is TypeScript-only. Supports ESLint or Biome for linting.
 * Note camelCase native flags: --noGit, --noInstall, --appRouter (Pitfall 3).
 */
export const t3 = defineScaffolder({
  name: 't3',
  category: 'web',
  command: 'npx',
  packageName: 'create-t3-app',
  integration: { type: 'delegate', command: 'create-t3-app' },
  prerequisites: [nodePrerequisite('>=18.17.0')],
  flags: [
    { unified: 'typescript', native: '' },
    { unified: 'tailwind', native: '--tailwind' },
    { unified: 'eslint', native: '--eslint' },
    { unified: 'biome', native: '--biome' },
    { unified: 'no-git', native: '--noGit' },
    { unified: 'no-install', native: '--noInstall' },
    { unified: 'import-alias', native: '--import-alias' },
    { unified: 'app-router', native: '--appRouter' },
  ],
  passthroughArgs: true,
})

/**
 * Remix / React Router v7 scaffolder — delegates to create-react-router.
 *
 * IMPORTANT: Remix merged into React Router v7 (Dec 2024).
 * Use create-react-router, NOT create-remix (Pitfall 1).
 * RR v7 is TypeScript by default.
 */
export const remix = defineScaffolder({
  name: 'remix',
  category: 'web',
  command: 'npx',
  packageName: 'create-react-router',
  integration: { type: 'delegate', command: 'create-react-router' },
  prerequisites: [nodePrerequisite('>=18.0.0')],
  flags: [
    { unified: 'typescript', native: '' },
    { unified: 'no-git', native: '--no-git-init' },
    { unified: 'no-install', native: '--no-install' },
    { unified: 'package-manager', native: '--package-manager' },
    { unified: 'template', native: '--template' },
    { unified: 'overwrite', native: '--overwrite' },
  ],
  passthroughArgs: true,
})

/**
 * TanStack Start scaffolder — delegates to @tanstack/cli create.
 *
 * The integration command is '@tanstack/cli create' (multi-word).
 * buildCommandArgs splits on spaces to produce
 * ['@tanstack/cli', 'create', projectName, ...flags].
 * TypeScript is always enabled (no flag needed).
 */
export const tanstack = defineScaffolder({
  name: 'tanstack',
  category: 'web',
  command: 'npx',
  packageName: '@tanstack/cli',
  integration: { type: 'delegate', command: '@tanstack/cli create' },
  prerequisites: [nodePrerequisite('>=18.0.0')],
  flags: [
    { unified: 'typescript', native: '' },
    { unified: 'tailwind', native: '--tailwind' },
    { unified: 'package-manager', native: '--package-manager' },
    { unified: 'no-git', native: '--no-git' },
    { unified: 'no-install', native: '--no-install' },
    { unified: 'empty', native: '--no-examples' },
    { unified: 'overwrite', native: '--force' },
  ],
  passthroughArgs: true,
})

/**
 * Turborepo scaffolder — delegates to create-turbo.
 *
 * Category is 'web' in registry for data purposes; CLI routes it
 * via `tinkerise monorepo` (handled in Plan 04-03).
 */
export const turbo = defineScaffolder({
  name: 'turbo',
  category: 'web',
  command: 'npx',
  packageName: 'create-turbo',
  integration: { type: 'delegate', command: 'create-turbo' },
  prerequisites: [nodePrerequisite('>=18.0.0')],
  flags: [
    { unified: 'no-install', native: '--skip-install' },
    { unified: 'package-manager', native: '-m' },
    { unified: 'no-git', native: '--no-git' },
  ],
  passthroughArgs: true,
})
