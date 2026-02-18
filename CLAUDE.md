# CLAUDE.md

This file provides context for AI tools working with the tinkerise codebase.

## Project Overview

tinkerise is a unified CLI scaffolding tool that wraps official framework scaffolders.
One command to scaffold any project with any stack.

## Architecture

Bun monorepo with Turborepo orchestration. Four packages:
- `packages/cli` (@tinkerise/cli) -- Commander.js CLI, commands, prompts (@clack/prompts)
- `packages/core` (@tinkerise/core) -- Business logic: scaffolder registry, enhancement system, config, presets
- `packages/shared` (@tinkerise/shared) -- Zod schemas, types, constants
- `packages/tinkerise` -- Thin unscoped npm wrapper (re-exports @tinkerise/cli)

Dependency chain: cli -> core -> shared

## Key Patterns

- ESM only (no CommonJS) -- `"type": "module"` everywhere
- Zod 4 for all runtime validation and schema definitions
- Commander.js for CLI framework
- @clack/prompts for interactive UX
- tsup for building each package
- createRequire for importing CJS modules in ESM context
- Declarative scaffolder registry -- adding a scaffolder = data entry, no logic changes
- Enhancement modules follow defineEnhancement() pattern with detect/install functions
- Callback-based conflict resolution (onConflict, onDependencyApproval) decouples core from UI

## Development Commands

| Command | What it does |
|---------|-------------|
| `bun install` | Install all dependencies |
| `bun run build` | Build all packages via Turborepo |
| `bun run dev` | Watch mode for development |
| `bun run test` | Run vitest across all packages |
| `bun run lint` | ESLint across all packages |
| `bun run typecheck` | TypeScript type checking |
| `bun run license-check` | Verify dependency licenses (MIT/Apache-2.0/BSD/ISC only) |

## Code Conventions

- Single quotes, no semicolons (@antfu/eslint-config)
- TypeScript strict mode
- Conventional commits enforced by commitlint + husky
- File naming: kebab-case for files, PascalCase for types/interfaces
- Changesets for versioning

## Testing

- Vitest for all tests (unit + integration)
- E2E tests gated behind TINKERISE_E2E=true env var
- Tests co-located with source in __tests__ directories

## Important Constraints

- Node.js >= 20.11.0 (Node 18 EOL April 2025)
- Pure ESM output -- no CJS dual-package
- Bun as package manager (not npm/pnpm/yarn for this repo)
- Do NOT modify .planning/ directory
