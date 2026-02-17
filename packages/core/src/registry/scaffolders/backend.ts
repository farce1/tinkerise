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

/** Go prerequisite */
export const goPrerequisite = (versionRange: string) => ({
  command: 'go',
  versionFlag: 'version',
  versionRange,
  installInstructions: {
    darwin: 'brew install go',
    linux: 'sudo apt-get install golang-go  # or download from https://go.dev/dl/',
    win32: 'winget install GoLang.Go',
  },
})

/** Rust prerequisite */
export const rustPrerequisite = (versionRange: string) => ({
  command: 'rustc',
  versionFlag: '--version',
  versionRange,
  installInstructions: {
    darwin: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
    linux: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
    win32: 'winget install Rustlang.Rustup',
  },
})

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

/**
 * Go scaffolder — delegates to go-blueprint create.
 *
 * go-blueprint is the community standard for Go HTTP service scaffolding.
 * Supports 6 frameworks (Chi, Gin, Fiber, Echo, HttpRouter, Gorilla/mux),
 * database drivers, and advanced features (Docker, GitHub Actions, WebSocket).
 * Per user decision: prefer richer community tools over bare `go mod init`.
 *
 * Two-level prerequisites: Go runtime first, then go-blueprint tool
 * (Pitfall 5: go-blueprint installed via `go install`, requires Go).
 */
export const go = defineScaffolder({
  name: 'go',
  category: 'backend',
  command: 'go-blueprint',
  packageName: 'go-blueprint',
  integration: { type: 'delegate', command: 'go-blueprint create' },
  prerequisites: [
    goPrerequisite('>=1.22'),
    {
      command: 'go-blueprint',
      versionFlag: '--version',
      installInstructions: {
        darwin: 'go install github.com/melkeydev/go-blueprint@latest',
        linux: 'go install github.com/melkeydev/go-blueprint@latest',
        win32: 'go install github.com/melkeydev/go-blueprint@latest',
      },
    },
  ],
  flags: [],
  passthroughArgs: true,
})

/**
 * Rust (Axum) scaffolder — delegates to cargo generate with an Axum template.
 *
 * Uses cargo-generate for templated project generation from Git repos.
 * Per user decision: structured starter project with routes, middleware, config,
 * not a minimal hello-world. cargo-generate + template provides this structure.
 *
 * Two-level prerequisites: Rust runtime (rustc >=1.78 for Axum 0.8 MSRV),
 * then cargo-generate tool (Pitfall 3: separate install).
 */
export const rust = defineScaffolder({
  name: 'rust',
  category: 'backend',
  command: 'cargo',
  packageName: 'cargo-generate',
  integration: { type: 'delegate', command: 'cargo generate' },
  prerequisites: [
    rustPrerequisite('>=1.78'),
    {
      command: 'cargo-generate',
      versionFlag: '--version',
      installInstructions: {
        darwin: 'cargo install cargo-generate',
        linux: 'cargo install cargo-generate',
        win32: 'cargo install cargo-generate',
      },
    },
  ],
  flags: [
    { unified: 'no-git', native: '--init' },
  ],
  passthroughArgs: true,
})

/**
 * Express scaffolder — delegates to express-generator-typescript via npx.
 *
 * Uses npx like web scaffolders (Node.js ecosystem).
 * express-generator-typescript (v2.7+) is the actively maintained, TypeScript-first
 * alternative to the dated express-generator. Per user decision: modern scaffolder.
 *
 * Pitfall 6: No 'create' subcommand — project name is a direct positional arg.
 */
export const express = defineScaffolder({
  name: 'express',
  category: 'backend',
  command: 'npx',
  packageName: 'express-generator-typescript',
  integration: { type: 'delegate', command: 'express-generator-typescript' },
  prerequisites: [
    {
      command: 'node',
      versionFlag: '--version',
      versionRange: '>=18.0.0',
      installInstructions: {
        darwin: 'brew install node',
        linux: 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs',
        win32: 'winget install OpenJS.NodeJS.LTS',
      },
    },
  ],
  flags: [],
  passthroughArgs: true,
})
