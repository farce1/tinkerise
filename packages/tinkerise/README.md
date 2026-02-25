# tinkerise

One command to scaffold any project with any stack.

tinkerise is a unified CLI scaffolding tool that wraps official framework scaffolders. Instead of remembering `create-next-app`, `create-vite`, `create-astro`, `flutter create`, `cargo generate`, and a dozen others, use one consistent interface for all of them.

## Install

```bash
npm install -g tinkerise
```

Requires Node.js >= 20.11.0.

## Quick start

```bash
# Interactive guided flow
tinkerise

# Or use the short alias
tk
```

Scaffold directly by specifying a category, framework, and project name:

```bash
tinkerise web next my-app
tinkerise backend express my-api
tinkerise mobile rn my-mobile-app
```

## Supported frameworks

### Web

| Framework | Command | Delegates to |
|-----------|---------|-------------|
| Next.js | `tinkerise web next` | `create-next-app` |
| Vite | `tinkerise web vite` | `create-vite` |
| Astro | `tinkerise web astro` | `create-astro` |
| T3 Stack | `tinkerise web t3` | `create-t3-app` |
| Remix | `tinkerise web remix` | `create-react-router` |
| TanStack Start | `tinkerise web tanstack` | `@tanstack/cli` |

### Backend

| Framework | Command | Delegates to |
|-----------|---------|-------------|
| Express | `tinkerise backend express` | `express-generator-typescript` |
| FastAPI | `tinkerise backend fastapi` | `fastapi-admin` |
| Django | `tinkerise backend django` | `django-admin` |
| Go | `tinkerise backend go` | `go-blueprint` |
| Rust (Axum) | `tinkerise backend rust` | `cargo generate` |

### Mobile

| Framework | Command | Delegates to |
|-----------|---------|-------------|
| Flutter | `tinkerise mobile flutter` | `flutter create` |
| React Native / Expo | `tinkerise mobile rn` | `create-expo-app` |

### Other

| Type | Command | Delegates to |
|------|---------|-------------|
| Turborepo monorepo | `tinkerise monorepo` | `create-turbo` |
| MCP server | `tinkerise mcp` | built-in template |
| CLI tool | `tinkerise cli` | built-in template |
| npm library | `tinkerise lib` | built-in template |

## Enhancements

Add tooling to any project after scaffolding:

```bash
tinkerise add eslint prettier docker
```

Available enhancements: `eslint`, `prettier`, `husky`, `commitlint`, `changelog`, `ci`, `testing`, `docker`, `env`, `renovate`, `editorconfig`.

## Commands

| Command | Description |
|---------|-------------|
| `tinkerise` | Interactive scaffolding flow |
| `tinkerise list` | Show available scaffolders and enhancements |
| `tinkerise add [enhancements...]` | Add tooling to an existing project |
| `tinkerise doctor` | Check system for required tools |
| `tinkerise config` | Manage global/project configuration |
| `tinkerise preset` | Save and reuse configuration presets |
| `tinkerise update` | Self-update the CLI |

## Global flags

```
--typescript, --ts    Use TypeScript
--tailwind            Add Tailwind CSS
--eslint              Add ESLint
--no-git              Skip git initialization
--no-install          Skip dependency installation
--package-manager     Use npm, pnpm, yarn, or bun
--preset <name>       Apply a saved preset
--verbose             Show detailed output
```

## Presets

Save and reuse your preferred configuration:

```bash
# Save current config as a preset
tinkerise preset save my-stack

# Apply a saved preset
tinkerise preset use my-stack

# Or pass inline
tinkerise web next my-app --preset my-stack
```

## Documentation

Full docs at [tinkerise.dev](https://tinkerise.dev)

## License

MIT
