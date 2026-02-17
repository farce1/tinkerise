/**
 * Backend scaffolder registry entries.
 *
 * Each entry is pure data — adding a new backend scaffolder requires only
 * adding a defineScaffolder() call here (REG-01).
 *
 * Backend scaffolders differ from web scaffolders:
 * - Python/Go/Rust scaffolders use their ecosystem CLIs directly (not npx)
 * - Express is the exception — it uses npx like web scaffolders
 * - Two-level prerequisites: runtime (python3/go/rustc) + scaffolder tool
 */

import { defineScaffolder } from '@tinkerise/shared'

/** Python prerequisite shared across Python-based scaffolders */
export const pythonPrerequisite = (versionRange: string) => ({
  command: 'python3',
  versionFlag: '--version',
  versionRange,
  installInstructions: {
    darwin: 'brew install python@3.12',
    linux: 'sudo apt-get install python3',
    win32: 'winget install Python.Python.3.12',
  },
})

/**
 * FastAPI scaffolder — delegates to fastapi-admin startproject.
 *
 * Uses fastapi-admin-cli (pip package), a Django-inspired scaffolding tool
 * for FastAPI projects with modular app structure and Alembic migrations.
 * Per user decision: community tool for ecosystems without strong official scaffolders.
 */
export const fastapi = defineScaffolder({
  name: 'fastapi',
  category: 'backend',
  command: 'fastapi-admin',
  packageName: 'fastapi-admin-cli',
  integration: { type: 'delegate', command: 'fastapi-admin startproject' },
  prerequisites: [
    pythonPrerequisite('>=3.10'),
    {
      command: 'fastapi-admin',
      versionFlag: '--version',
      installInstructions: {
        darwin: 'pip install fastapi-admin-cli',
        linux: 'pip install fastapi-admin-cli',
        win32: 'pip install fastapi-admin-cli',
      },
    },
  ],
  flags: [],
  passthroughArgs: true,
})

/**
 * Django scaffolder — delegates to django-admin startproject.
 *
 * Official Django CLI. django-admin ships with the Django pip package.
 * Supports --template for custom project templates.
 */
export const django = defineScaffolder({
  name: 'django',
  category: 'backend',
  command: 'django-admin',
  packageName: 'django',
  integration: { type: 'delegate', command: 'django-admin startproject' },
  prerequisites: [
    pythonPrerequisite('>=3.10'),
    {
      command: 'django-admin',
      versionFlag: '--version',
      installInstructions: {
        darwin: 'pip install django',
        linux: 'pip install django',
        win32: 'pip install django',
      },
    },
  ],
  flags: [],
  passthroughArgs: true,
})
