# tinkerise

Scaffold any project with any stack -- one CLI, every framework's official tool.

[![CI](https://github.com/farce1/tinkerise/actions/workflows/ci.yml/badge.svg)](https://github.com/farce1/tinkerise/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/tinkerise)](https://www.npmjs.com/package/tinkerise) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Node](https://img.shields.io/badge/node-%3E%3D20.11.0-brightgreen)](https://nodejs.org)

## What is tinkerise?

tinkerise is a unified CLI that wraps official framework scaffolders (create-next-app, create-vite, create-astro, and more) rather than replacing them. You get a single interface with unified flags, an enhancement module system for post-scaffold setup, and multi-ecosystem support spanning web, backend, and mobile -- all while delegating the actual scaffolding to the tools developers already trust.

## Features

- **7 web frameworks** -- Next.js, Vite, Astro, T3, Remix, TanStack Start, Turbo
- **5 backend frameworks** -- FastAPI, Django, Go, Rust/Axum, Express
- **2 mobile frameworks** -- Flutter, React Native (Expo)
- **Enhancement modules** -- ESLint, Prettier, Husky, GitHub Actions CI, Docker, env, commitlint, testing, Renovate, EditorConfig
- **Utility templates** -- MCP server, CLI tool, npm library
- **Configuration & presets** -- Global config, per-project config, shareable presets
- **`tinkerise doctor`** -- System health checks for all required toolchains

## Quick Start

```bash
# Use without installing
npx tinkerise

# Install globally
npm install -g tinkerise

# Or with Homebrew
brew install farce1/tap/tinkerise
```

## Usage Examples

```bash
# Scaffold a Next.js app with TypeScript and Tailwind
tinkerise web next my-app --ts --tailwind

# Scaffold a FastAPI backend
tinkerise backend fastapi my-api

# Add ESLint + Prettier to any project
tinkerise add eslint prettier

# Check system dependencies
tinkerise doctor

# List all available scaffolders
tinkerise list
```

## Architecture

Bun monorepo with Turborepo orchestration:

```
packages/
  cli/      @tinkerise/cli     -- CLI commands and user-facing output
  core/     @tinkerise/core    -- Business logic, registry, enhancements
  shared/   @tinkerise/shared  -- Types, constants, shared utilities
  tinkerise/                   -- Thin npm wrapper package
```

Dependency chain: `cli -> core -> shared`

## Supported Frameworks

| Category | Framework | Scaffolder Used |
|----------|-----------|----------------|
| Web | Next.js | `create-next-app` |
| Web | Vite | `create-vite` |
| Web | Astro | `create-astro` |
| Web | T3 | `create-t3-app` |
| Web | Remix | `create-remix` |
| Web | TanStack Start | `@tanstack/cli` |
| Web | Turbo | `create-turbo` |
| Backend | FastAPI | `fastapi` |
| Backend | Django | `django-admin` |
| Backend | Go | `go mod init` |
| Backend | Rust/Axum | `cargo-generate` |
| Backend | Express | `npx express-generator` |
| Mobile | Flutter | `flutter create` |
| Mobile | React Native | `create-expo-app` |

## Enhancement Modules

After scaffolding, use `tinkerise add` to layer on tooling:

| Module | What it does |
|--------|-------------|
| `eslint` | ESLint with framework-aware config |
| `prettier` | Prettier with Tailwind plugin support |
| `husky` | Git hooks with lint-staged |
| `ci` | GitHub Actions CI workflow |
| `docker` | Dockerfile + docker-compose |
| `env` | Type-safe environment variables (t3-env) |
| `commitlint` | Conventional commit enforcement |
| `testing` | Vitest configuration |
| `renovate` | Automated dependency updates |
| `editorconfig` | EditorConfig for consistent formatting |

## Utility Templates

| Template | What it generates |
|----------|------------------|
| `mcp-server` | Model Context Protocol server (ESM) |
| `cli-tool` | Commander.js CLI with bin entry |
| `npm-lib` | Dual CJS/ESM library with TypeScript |

Create a template with:

```bash
tinkerise template mcp-server my-server
tinkerise template cli-tool my-tool
tinkerise template npm-lib my-lib
```

## Configuration

tinkerise supports global config, per-project config, and shareable presets:

```bash
# Initialize global config
tinkerise config init

# Set default options
tinkerise config set typescript true
tinkerise config set packageManager bun

# Save current settings as a preset
tinkerise preset save my-stack --framework next

# Use a preset
tinkerise preset use my-stack
```

Config files are stored in `~/.config/tinkerise/` (XDG-compliant).

## Contributing

We welcome contributions of all kinds! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

This project uses:
- **Bun** as the package manager
- **Conventional Commits** enforced by commitlint + husky
- **Changesets** for versioning

The short alias `tk` works everywhere `tinkerise` does.

## License

MIT License -- see [LICENSE](LICENSE) for details.
