# Phase 9: Additional Enhancements & Utility Templates - Research

**Researched:** 2026-02-18
**Domain:** Enhancement modules (docker, env, commitlint, testing, renovate, editorconfig) + Utility template scaffolders (MCP server, CLI tool, npm library)
**Confidence:** HIGH

## Summary

Phase 9 extends the existing enhancement module system (Phase 5/6) with six new modules and adds three utility template scaffolders as top-level commands. The enhancement modules follow the exact same `defineEnhancement()` pattern established in Phase 5, using `EnhancementModule` interface with `detect()` and `install()` methods. The utility templates represent a new concept -- code-generated project scaffolders that produce complete projects without delegating to upstream tools.

The existing codebase already supports the `'utility'` category in the `ScaffolderEntrySchema` (line 84 of `packages/shared/src/registry/schemas.ts`), but the utility templates do NOT use the scaffolder registry. Per user decision, they are top-level commands (`tinkerise mcp`, `tinkerise cli`, `tinkerise lib`) that generate projects directly through code generation, not registry delegation. This means they need their own generation logic registered as Commander.js commands in the CLI entry point.

**Primary recommendation:** Implement the six enhancement modules using the identical pattern from Phase 6 (eslint/prettier/husky/ci modules), and implement utility templates as standalone Commander.js commands that generate project files programmatically (no upstream tool delegation, no registry entries).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Docker enhancement: Generate Dockerfile + .dockerignore only -- no docker-compose.yml
- Docker: Framework-aware Dockerfile generation detecting project's framework for optimized multi-stage builds (Next.js standalone output, Vite static build with nginx, FastAPI with uvicorn)
- Docker: .dockerignore should match the framework's build artifacts and node_modules
- Env enhancement: Validated env approach (t3-env style) with .env, .env.example, plus a type-safe env validation module using Zod schemas
- Env: Add .env to .gitignore automatically
- Env: Generic env validation module -- one standard env.ts pattern, no framework-specific client/server splitting
- Testing enhancement: Always Vitest -- no Jest fallback regardless of framework
- Testing: Config only -- generate vitest.config.ts and add test scripts to package.json -- no example test files
- Commitlint enhancement: @commitlint/config-conventional rule set -- standard feat/fix/chore prefixes
- Commitlint: Integrate with husky if already present (reuse existing hook setup)
- MCP server template: Code-generated (not static template) -- adapts to user choices (PM, TypeScript settings)
- CLI tool template: Commander.js starter with one example command, bin entry, TypeScript, tsup build
- CLI tool template: Code-generated -- adapts to project name, PM, etc.
- npm library template: Publish-ready with TypeScript, tsup dual CJS/ESM build, package.json exports, Vitest config, README template
- npm library template: Code-generated -- adapts to project name, PM, etc.
- Template invocation UX: Top-level commands only (`tinkerise mcp`, `tinkerise cli`, `tinkerise lib`) -- no `tinkerise util` category prefix
- Template invocation UX: Name + generate flow (`tinkerise mcp my-server`) generates immediately with sensible defaults, flags for overrides -- no interactive prompts
- Template invocation UX: No auto-add of enhancements after scaffolding -- user runs `tinkerise add` separately

### Claude's Discretion
- Renovate update strategy defaults
- EditorConfig settings
- MCP server template opinionatedness level
- Utility template grouping in `tinkerise list`

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADD-05 | User can add a multi-stage Dockerfile + .dockerignore via `tinkerise add docker` | Framework-aware Dockerfile patterns researched for Next.js, Vite, FastAPI; enhancement module pattern verified from existing codebase |
| ADD-06 | User can add .env.example template, .env in .gitignore, and validation setup via `tinkerise add env` | @t3-oss/env-core v0.13.10 API verified; generic createEnv() pattern documented; Zod schema approach confirmed |
| ADD-07 | User can add conventional commit enforcement via `tinkerise add commitlint` | @commitlint/cli + @commitlint/config-conventional v19.x API verified; husky commit-msg hook integration pattern documented |
| ADD-08 | User can add Vitest config via `tinkerise add testing` | Vitest v3.x defineConfig() pattern verified; vitest.config.ts generation approach documented |
| ADD-09 | User can add Renovate config via `tinkerise add renovate` | renovate.json with `config:recommended` preset verified; update strategy options documented |
| ADD-10 | User can add EditorConfig via `tinkerise add editorconfig` | Standard .editorconfig format researched; sensible defaults identified |
| UTIL-01 | User can scaffold an MCP server template via `tinkerise mcp` | @modelcontextprotocol/sdk v1.26.0 API verified; McpServer + StdioServerTransport + tool registration patterns documented |
| UTIL-02 | User can scaffold a Node.js CLI tool template via `tinkerise cli` | Commander.js + tsup + TypeScript pattern verified from tinkerise's own codebase; bin entry + package.json exports pattern documented |
| UTIL-03 | User can scaffold an npm package/library template via `tinkerise lib` | tsup dual CJS/ESM build + package.json exports + Vitest config verified from tinkerise's own packages |
</phase_requirements>

## Standard Stack

### Core (Enhancement Modules)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @commitlint/cli | ^19.6.0 | CLI for commit message linting | Already in dependencyVersionMap |
| @commitlint/config-conventional | ^19.6.0 | Conventional Commits rule set | Per locked decision; standard in JS ecosystem |
| vitest | ^3.1.0 | Test runner config generation | Already in dependencyVersionMap; per locked decision (always Vitest) |
| @t3-oss/env-core | ^0.13.10 | Type-safe env variable validation | Per locked decision (t3-env style); framework-agnostic core package |
| zod | ^4.3.6 | Schema validation for env vars | Already a project dependency (@tinkerise/shared) |

### Core (Utility Templates -- Generated Into User Projects)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @modelcontextprotocol/sdk | ^1.26.0 | MCP server SDK (generated into projects) | Official MCP TypeScript SDK; v1.x is stable current |
| commander | ^13.0.0 | CLI framework (generated into projects) | Same library tinkerise uses; battle-tested |
| tsup | ^8.4.0 | TypeScript bundler (generated into projects) | Same bundler tinkerise uses; supports CJS/ESM dual output |
| vitest | ^3.1.0 | Test framework (generated into lib template) | Per project pattern; already in dependencyVersionMap |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @t3-oss/env-core | Raw Zod parse of process.env | t3-env adds server/client separation, empty string handling; user chose t3-env style |
| @commitlint/config-conventional | Custom commitlint rules | conventional-commits is the ecosystem standard; no reason to customize |
| @modelcontextprotocol/sdk v1 | @modelcontextprotocol/server v2 | v2 not published to npm yet; v1.26.0 is current stable; v2 migration is documented when ready |

**Installation (for development of tinkerise itself):**
No new dependencies needed for tinkerise. Enhancement modules generate files and run install commands in user projects. Utility templates generate code files -- all generation is string-based, no template engine needed.

## Architecture Patterns

### Pattern 1: Enhancement Module (Existing, Proven)

**What:** Each enhancement module implements `EnhancementModule` interface via `defineEnhancement()`.
**When to use:** All six new enhancement modules.
**Example (from existing codebase):**
```typescript
// Source: packages/core/src/enhancements/modules/eslint.ts
export const eslintModule = defineEnhancement({
  id: 'eslint',
  name: 'ESLint',
  description: 'Flat config with framework-appropriate plugins',
  dependsOn: [],
  async detect(ctx: ProjectContext) { /* check for existing config files */ },
  async install(ctx: ProjectContext) { /* generate files, install packages */ },
})
```

**Registration (from existing codebase):**
```typescript
// Source: packages/core/src/enhancements/modules/index.ts
export const allEnhancementModules: EnhancementModule[] = [
  eslintModule, prettierModule, huskyModule, ciModule,
  // Phase 9 adds: dockerModule, envModule, commitlintModule, testingModule, renovateModule, editorconfigModule
]
export const enhancementRegistry: ReadonlyMap<string, EnhancementModule> = new Map(
  allEnhancementModules.map(m => [m.id, m]),
)
```

### Pattern 2: Framework-Aware Config Map (Existing, Proven)

**What:** Static config object maps FrameworkId to framework-specific settings.
**When to use:** Docker (Dockerfile per framework), env (different .env patterns).
**Example (from existing codebase):**
```typescript
// Source: packages/core/src/enhancements/modules/eslint.ts
const FRAMEWORK_ESLINT_MAP: Partial<Record<FrameworkId, FrameworkEslintConfig>> = {
  next: { packages: ['eslint-plugin-react'], ... },
  vue: { packages: ['eslint-plugin-vue'], ... },
}
```

For Docker, this becomes:
```typescript
interface DockerConfig {
  baseImage: string
  buildStage: string
  runStage: string
  ignorePatterns: string[]
}
const FRAMEWORK_DOCKER_MAP: Partial<Record<FrameworkId | 'fastapi' | 'go' | 'rust', DockerConfig>> = { ... }
```

**Note on FrameworkId:** Current FrameworkId type only includes web frameworks (next, react, vue, etc.). Docker enhancement needs to also detect backend frameworks (fastapi, django, go, rust) which are NOT in the FrameworkId union. The Docker module will need its own framework detection or accept a broader detection approach. The `ProjectContext.framework` may be `null` for backend projects -- Docker module should detect from package.json/requirements.txt/go.mod/Cargo.toml independently.

### Pattern 3: Utility Template as Top-Level Command (New)

**What:** Commander.js command that generates a complete project directory from code.
**When to use:** MCP server, CLI tool, npm library templates.
**Example (pattern for CLI entry point registration):**
```typescript
// Source: packages/cli/src/index.ts (modeled on monorepo command)
program
  .command('mcp')
  .summary('Scaffold an MCP server')
  .description('Scaffold a new MCP server project with TypeScript and stdio transport.')
  .argument('<name>', 'Project name')
  .option('--package-manager <pm>', 'Package manager (npm, pnpm, yarn, bun)')
  .option('--no-install', 'Skip dependency installation')
  .action(async (name: string, options) => {
    await generateMcpServer(name, options)
  })
```

**Generator function pattern:**
```typescript
async function generateMcpServer(name: string, options: TemplateOptions): Promise<void> {
  // 1. Create directory
  // 2. Generate package.json
  // 3. Generate tsconfig.json
  // 4. Generate src/index.ts (MCP server with example tool)
  // 5. Generate tsup.config.ts
  // 6. Run package install (unless --no-install)
  // 7. Show summary card
}
```

### Pattern 4: Version Map Centralization (Existing, Proven)

**What:** All package versions referenced in enhancement modules come from `dependencyVersionMap`.
**When to use:** Any enhancement module that installs packages.
**Example (from existing codebase):**
```typescript
// Source: packages/core/src/enhancements/version-map.ts
export const dependencyVersionMap = {
  'vitest': '^3.1.0',
  '@commitlint/cli': '^19.6.0',
  '@commitlint/config-conventional': '^19.6.0',
  // Phase 9 additions needed: @t3-oss/env-core, zod version for env
} as const satisfies Record<string, string>
```

### Pattern 5: Shared Utilities (Existing, Proven)

**What:** `_utils.ts` provides `installPackages()`, `writeConfigFile()`, `addScript()`, `readPackageJson()`.
**When to use:** All enhancement modules and potentially utility templates.
**Example:** All existing modules use these helpers -- new modules should too.

### Anti-Patterns to Avoid
- **Framework detection duplication:** Docker module needs broader detection than web FrameworkId. Do NOT add backend framework IDs to the existing FrameworkId type -- use a separate Docker-specific detection function that checks for requirements.txt (Python), go.mod (Go), Cargo.toml (Rust), etc.
- **Conditional package installs in config-only modules:** Testing and EditorConfig do NOT need to install packages (config file only). Renovate is a config file only. Keep these lightweight.
- **Interactive prompts in generators:** Per locked decision, utility templates use `name + generate` with flags for overrides, NO interactive prompts. CI-safe by default.
- **Template files on disk:** Per locked decision, all templates are code-generated, NOT static template files. Use string building (same as eslint/ci modules do).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Env variable validation | Custom Zod parse of process.env | @t3-oss/env-core createEnv() | Handles empty strings, server/client separation, runtime env binding |
| Commit message validation | Custom regex-based linting | @commitlint/cli + config-conventional | 50+ rules, widely adopted, husky integration proven |
| Renovate config | Custom dependency update logic | renovate.json with config:recommended preset | Renovate is a hosted service; we only generate its config file |
| MCP server boilerplate | Custom protocol implementation | @modelcontextprotocol/sdk | Official SDK, handles transport, serialization, protocol compliance |
| Dockerfile templates | Template engine (EJS, Handlebars) | String concatenation functions | Same pattern used by all existing modules; no template engine dependency needed |
| package.json generation | Manual JSON string building | Object construction + JSON.stringify | Avoids formatting issues, handles escaping properly |

**Key insight:** Enhancement modules generate config files; they don't implement the tools themselves. The code-generation approach used by ESLint, Prettier, CI modules is the correct pattern -- build strings programmatically, write with `writeConfigFile()`.

## Common Pitfalls

### Pitfall 1: Docker FrameworkId vs Broader Detection
**What goes wrong:** The existing `FrameworkId` type only covers web frameworks (next, react, vue, etc.). Docker support needs to detect FastAPI (requirements.txt/pyproject.toml), Go (go.mod), Rust (Cargo.toml), Django, Express. Using `ctx.framework` alone misses all backend frameworks.
**Why it happens:** The enhancement context builder was designed for web framework enhancements.
**How to avoid:** Docker module implements its own detection function that checks for: `next.config.*` (Next.js), `vite.config.*` + no next (Vite/static), `requirements.txt` with fastapi/django (Python), `go.mod` (Go), `Cargo.toml` (Rust), `package.json` scripts with `express` or `node` (Node.js). Fall back to a generic Node.js Dockerfile when framework is not detected.
**Warning signs:** Docker generates wrong Dockerfile for backend projects.

### Pitfall 2: Commitlint Husky Integration When Husky Not Present
**What goes wrong:** Commitlint needs a `commit-msg` hook in `.husky/`. If husky is not already installed, writing to `.husky/commit-msg` without first installing husky creates orphaned files.
**Why it happens:** Per locked decision: "Integrate with husky if already present." But what if husky is NOT present?
**How to avoid:** Commitlint module should: (1) Check if husky/`.husky` directory exists, (2) If yes: add `commit-msg` hook file, (3) If no: add commitlint as a standalone config only -- user can run `tinkerise add husky` separately to get hooks. Do NOT silently install husky as a side effect.
**Warning signs:** `.husky/commit-msg` file exists but husky's `prepare` script is not set up.

### Pitfall 3: Env Enhancement .gitignore Modification
**What goes wrong:** Adding `.env` to `.gitignore` can corrupt the file if not handled carefully (missing newline before appended entry, duplicate entries, etc.).
**Why it happens:** .gitignore is a line-based text file that may or may not end with a newline.
**How to avoid:** Read existing .gitignore, check if `.env` is already present, append with a leading newline if the file doesn't end with one. Use a robust append pattern: `\n.env\n` with dedup check.
**Warning signs:** .gitignore has `.env` appended without newline separator on the same line as previous entry.

### Pitfall 4: MCP SDK v1 vs v2 Import Paths
**What goes wrong:** The MCP TypeScript SDK is transitioning from v1 (`@modelcontextprotocol/sdk`) to v2 (`@modelcontextprotocol/server`, `@modelcontextprotocol/client`, `@modelcontextprotocol/core`). v2 packages are NOT published to npm yet as of Feb 2026.
**Why it happens:** Migration docs exist in the SDK repo, but v2 packages are not yet available.
**How to avoid:** Generate templates using v1 import paths: `@modelcontextprotocol/sdk/server/mcp.js`, `@modelcontextprotocol/sdk/server/stdio.js`. Pin to `^1.26.0`. Add a comment in generated code noting the v2 migration path.
**Warning signs:** `@modelcontextprotocol/server` npm install fails.

### Pitfall 5: Utility Template PM Command Differences
**What goes wrong:** Utility templates run `npm install` (or equivalent) after generating. Different PMs have different commands and behaviors.
**Why it happens:** Templates need to run post-generation install with the correct PM.
**How to avoid:** Reuse the existing `_utils.ts` `installPackages()` pattern or equivalent. The PM is resolved from the `--package-manager` flag or detection. The generated `package.json` should use `"scripts": { "build": "tsup", ... }` which is PM-agnostic.
**Warning signs:** Template generates `npm run build` in README but user uses pnpm.

### Pitfall 6: tsup Dual CJS/ESM Output for Library Template
**What goes wrong:** Configuring package.json `"exports"` incorrectly for dual CJS/ESM causes `ERR_MODULE_NOT_FOUND` or `ERR_REQUIRE_ESM`.
**Why it happens:** The conditional exports map must correctly separate `"import"` (ESM) and `"require"` (CJS) paths, and the generated files must match.
**How to avoid:** Follow the proven pattern:
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```
With tsup config: `format: ['esm', 'cjs']`. The `types` field must come first per TypeScript resolution order.
**Warning signs:** Library works when imported as ESM but fails as CJS (or vice versa).

## Code Examples

### Enhancement Module: Docker (Framework-Aware Dockerfile)

```typescript
// Pattern for framework-aware Docker generation
interface DockerTemplate {
  dockerfile: string
  dockerignore: string
}

// Next.js standalone output Dockerfile
function nextjsDockerfile(): string {
  return `FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
`
}

// Vite static build with nginx
function viteDockerfile(): string {
  return `FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`
}

// FastAPI with uvicorn
function fastapiDockerfile(): string {
  return `FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim AS runner
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
RUN adduser --disabled-password --gecos "" appuser
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
`
}
```

### Enhancement Module: Env (t3-env Style)

```typescript
// Generated env.ts content (generic, no framework-specific splitting)
function buildEnvModule(): string {
  return `import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
`
}

// Generated .env.example content
function buildEnvExample(): string {
  return `# Database
DATABASE_URL=

# Environment
NODE_ENV=development
`
}
```

### Enhancement Module: Commitlint

```typescript
// Source: Context7 /websites/commitlint_js
// commitlint.config.js content
function buildCommitlintConfig(): string {
  return `export default { extends: ['@commitlint/config-conventional'] };\n`
}

// Husky commit-msg hook content
const COMMIT_MSG_HOOK = `npx --no -- commitlint --edit $1\n`
```

### Enhancement Module: Testing (Vitest Config Only)

```typescript
// Source: Context7 /vitest-dev/vitest
// vitest.config.ts content (config only, no example test files)
function buildVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
})
`
}
```

### Utility Template: MCP Server

```typescript
// Source: Context7 /modelcontextprotocol/typescript-sdk
// Generated src/index.ts for MCP server template
function buildMcpServerEntry(name: string): string {
  return `#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "${name}",
  version: "1.0.0",
});

// Example tool -- replace with your own
server.tool(
  "hello",
  "Say hello to someone",
  { name: z.string().describe("Name to greet") },
  async ({ name }) => ({
    content: [{ type: "text", text: \`Hello, \${name}!\` }],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
`
}
```

### Utility Template: CLI Tool

```typescript
// Pattern mirrors tinkerise's own setup
function buildCliEntry(name: string): string {
  return `#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("${name}")
  .description("A CLI tool built with tinkerise")
  .version("0.0.1");

program
  .command("greet")
  .description("Say hello")
  .argument("<name>", "Name to greet")
  .action((name: string) => {
    console.log(\`Hello, \${name}!\`);
  });

program.parse();
`
}
```

### Utility Template: npm Library

```typescript
// tsup.config.ts for dual CJS/ESM output
function buildLibTsupConfig(): string {
  return `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
});
`
}

// package.json exports for dual output
function buildLibPackageJson(name: string): Record<string, unknown> {
  return {
    name,
    version: "0.0.1",
    type: "module",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        require: "./dist/index.cjs",
      },
    },
    files: ["dist"],
    scripts: {
      build: "tsup",
      test: "vitest run",
      typecheck: "tsc --noEmit",
    },
    // devDependencies added programmatically
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @modelcontextprotocol/sdk v1 (monolithic) | v2 split packages (server/client/core) | v2 in development, NOT released | Use v1 import paths now; v2 migration documented |
| MCP server.tool() variadic | server.registerTool() config object | v2 (unreleased) | Stay on v1 server.tool() API for now |
| dotenv + manual process.env access | @t3-oss/env-core with Zod validation | 2023+ | Type-safe env access, runtime validation, empty string handling |
| Jest as default test runner | Vitest as default | 2023+ | Faster, Vite-native, ESM-first, compatible API |
| Renovate custom configs | config:recommended preset | Stable | Single-line config covers most use cases |
| commitlint v18 | commitlint v19 | 2024 | husky v9 integration, simplified hook setup |

**Deprecated/outdated:**
- `@modelcontextprotocol/sdk` v1 variadic `server.tool()` API is deprecated in favor of `server.registerTool()` -- but v2 packages are not yet on npm. Use v1 API.
- tiangolo/uvicorn-gunicorn-fastapi Docker base image is officially deprecated -- use multi-stage build from scratch instead.
- Old husky v8 setup (`npx husky install`) is deprecated -- v9 uses `npx husky init` or just `husky` as prepare script.

## Claude's Discretion Recommendations

### Renovate Update Strategy Defaults
**Recommendation:** Use `config:recommended` as the base, which provides sensible defaults (auto-merge patch updates, group minor updates, weekly schedule for major). This is the most widely adopted baseline.

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"]
}
```

**Rationale:** `config:recommended` (formerly `config:base`) is the official recommendation from Renovate. It enables auto-merge for patch-level updates, groups minor updates, and schedules weekly runs. This balances freshness with stability. Users who want more aggressive updates can modify the generated config.

### EditorConfig Settings
**Recommendation:** Use widely-adopted defaults aligned with the JS/TS ecosystem:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

**Rationale:** 2-space indent is the JS/TS ecosystem standard. LF line endings prevent cross-platform issues. UTF-8 is universal. Markdown exception preserves intentional trailing whitespace (line breaks). Makefile exception is required (tabs are syntactically significant).

### MCP Server Template Opinionatedness
**Recommendation:** Moderately opinionated -- include one working example tool with Zod schema validation, stdio transport, TypeScript, tsup build, and a README explaining how to add more tools. Include the MCP Inspector configuration for testing.

Generated structure:
```
my-server/
  src/
    index.ts         # McpServer with one example tool
  package.json       # name, bin, scripts, dependencies
  tsconfig.json      # strict TypeScript config
  tsup.config.ts     # ESM build with shims
  README.md          # Usage instructions, adding tools, testing with Inspector
```

**Rationale:** An MCP server without at least one example tool is useless as a starter. Including Zod for input validation follows the SDK's own patterns. Stdio transport is the most common for local MCP servers. Not including HTTP/SSE transport keeps it simple -- users can add it when needed.

### Utility Template Grouping in `tinkerise list`
**Recommendation:** Add a "Utility Templates" section in `tinkerise list` output, below the existing Web/Backend/Mobile scaffolder groups. Show them with a different visual treatment since they are top-level commands, not `tinkerise <category> <framework>` invocations.

```
Web
  ✓ Next.js
  ✓ Vite
  ...

Backend
  ✓ FastAPI
  ...

Mobile
  ✓ Flutter
  ...

Templates
  ✓ mcp        MCP server with TypeScript
  ✓ cli        CLI tool with Commander.js
  ✓ lib        npm library with dual CJS/ESM
```

**Rationale:** Users running `tinkerise list` should see the full capability set. Grouping under "Templates" (not "Utility") is cleaner and avoids the rejected `tinkerise util` prefix. These entries do NOT go through the scaffolder registry -- the list command can read from a separate static list or a lightweight template registry.

## Open Questions

1. **Docker detection for backend frameworks**
   - What we know: ProjectContext.framework is `FrameworkId | null`, which only includes web frameworks. Backend projects will have `framework: null`.
   - What's unclear: Should Docker module add its own detection (check for go.mod, Cargo.toml, requirements.txt) or should we extend the framework detection system?
   - Recommendation: Docker module implements its own lightweight detection function. This avoids expanding FrameworkId (which would affect all other enhancement modules) and keeps Docker's broader detection self-contained. The detection reads the filesystem directly rather than relying on `ctx.framework`.

2. **Utility template list integration**
   - What we know: Templates are NOT scaffolder registry entries. They are standalone Commander.js commands.
   - What's unclear: Should `tinkerise list` read from the scaffolder registry only, or should we add a parallel lightweight template registry?
   - Recommendation: Add a `TEMPLATE_METADATA` constant (parallel to `SCAFFOLDER_METADATA`) in `packages/core/src/registry/metadata.ts` and update the list command to display both. No Zod schema needed for these -- they're just display data.

3. **Utility template --no-install behavior**
   - What we know: `--no-install` flag skips dependency installation after scaffolding.
   - What's unclear: Should generated package.json still list dependencies (just not installed) or should it be modified?
   - Recommendation: Always generate complete package.json with all dependencies listed. `--no-install` simply skips the `npm install` step. This matches how existing scaffolders handle it.

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/commitlint_js` - commitlint configuration, husky integration, config-conventional setup
- Context7 `/t3-oss/t3-env` - createEnv() API, generic core setup without framework bindings, Zod schema validation
- Context7 `/websites/renovatebot` - renovate.json presets, config:recommended, config:best-practices, schedule options
- Context7 `/modelcontextprotocol/typescript-sdk` - McpServer, StdioServerTransport, tool registration API, v1 vs v2 migration
- Context7 `/vitest-dev/vitest` - vitest.config.ts defineConfig(), test include/exclude patterns

### Secondary (MEDIUM confidence)
- Existing codebase `packages/core/src/enhancements/modules/*.ts` - Proven enhancement module pattern, _utils.ts helpers
- Existing codebase `packages/shared/src/registry/schemas.ts` - ScaffolderEntrySchema already has 'utility' category
- Existing codebase `packages/cli/src/index.ts` - Commander.js command registration pattern (monorepo command as model)
- npm registry - @modelcontextprotocol/sdk v1.26.0 (verified current), @t3-oss/env-core v0.13.10 (verified current)
- [Next.js Docker examples](https://github.com/kristiyan-velkov/nextjs-prod-dockerfile) - Multi-stage standalone Dockerfile patterns
- [Vite Docker guide](https://www.buildwithmatija.com/blog/production-react-vite-docker-deployment) - nginx static serving pattern
- [FastAPI Docker docs](https://fastapi.tiangolo.com/deployment/docker/) - Official uvicorn Dockerfile guidance

### Tertiary (LOW confidence)
- MCP SDK v2 migration timing - v2 packages not yet on npm; exact release date unknown (flagged for validation)
- @t3-oss/env-core compatibility with Zod v4 - tinkerise uses Zod v4.3.6; t3-env may still expect Zod v3. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via Context7 and npm; versions confirmed current
- Architecture: HIGH - Enhancement module pattern proven across 4 existing modules; utility template pattern modeled on existing monorepo command
- Pitfalls: HIGH - Docker detection gap identified and solution documented; husky integration edge case addressed; MCP SDK version gap documented

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable domain, 30 days)
