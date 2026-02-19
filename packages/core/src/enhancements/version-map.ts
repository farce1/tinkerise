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
  'eslint': '^9.23.0',
  '@eslint/js': '^9.23.0',
  'typescript-eslint': '^8.30.0',
  'eslint-plugin-react': '^7.37.0',
  'eslint-plugin-vue': '^10.0.0',
  'eslint-plugin-svelte': '^3.5.0',
  'eslint-plugin-astro': '^1.4.0',

  // ESLint globals
  'globals': '^17.3.0',

  // Formatting
  'prettier': '^3.5.3',
  'prettier-plugin-tailwindcss': '^0.6.11',

  // Git hooks
  'husky': '^9.1.0',
  'lint-staged': '^15.3.0',

  // Commit conventions
  'commitlint': '^19.6.0',
  '@commitlint/config-conventional': '^19.6.0',
  '@commitlint/cli': '^19.6.0',
  'conventional-changelog-cli': '^6.0.0',

  // Testing
  'vitest': '^3.1.0',

  // Env validation
  '@t3-oss/env-core': '^0.13.10',
  'zod': '^3.24.0',
} as const satisfies Record<string, string>

export type DependencyName = keyof typeof dependencyVersionMap
