/**
 * Web scaffolder registry entries.
 *
 * Each entry is pure data — adding a new web scaffolder requires only
 * adding a defineScaffolder() call here (REG-01).
 */

import { defineScaffolder } from '@tinkerise/shared'

/**
 * Next.js scaffolder — delegates to create-next-app.
 */
export const nextjs = defineScaffolder({
  name: 'next',
  category: 'web',
  command: 'npx',
  packageName: 'create-next-app',
  integration: { type: 'delegate', command: 'create-next-app' },
  prerequisites: [
    {
      command: 'node',
      versionFlag: '--version',
      versionRange: '>=18.17.0',
      installInstructions: {
        darwin: 'brew install node',
        linux: 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs',
        win32: 'winget install OpenJS.NodeJS.LTS',
      },
    },
  ],
  flags: [
    { unified: 'typescript', native: '--typescript' },
    { unified: 'tailwind', native: '--tailwind' },
    { unified: 'eslint', native: '--eslint' },
    { unified: 'no-git', native: '--skip-git' },
    { unified: 'no-install', native: '--skip-install' },
  ],
  versionedFlags: [
    {
      versionRange: '>=15.0.0',
      flags: [
        { unified: 'typescript', native: '--ts' },
        { unified: 'tailwind', native: '--tailwind' },
        { unified: 'eslint', native: '--eslint' },
        { unified: 'no-git', native: '--skip-git' },
        { unified: 'no-install', native: '--skip-install' },
      ],
    },
  ],
  passthroughArgs: true,
})
