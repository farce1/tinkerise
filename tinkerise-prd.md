# tinkerise — Product Requirements Document

**Universal CLI Scaffolding Aggregator**

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | February 16, 2026 |
| **Status** | Draft |
| **License** | MIT (Open Source) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Product Vision & Goals](#4-product-vision--goals)
5. [Command Interface Design](#5-command-interface-design)
6. [Architecture](#6-architecture)
7. [Distribution Strategy](#7-distribution-strategy)
8. [Scaffolder Integration Details](#8-scaffolder-integration-details)
9. [Enhancement Modules (Detailed)](#9-enhancement-modules-detailed)
10. [Milestones & Phased Delivery](#10-milestones--phased-delivery)
11. [Technology Stack](#11-technology-stack)
12. [Testing Strategy](#12-testing-strategy)
13. [Open-Source Strategy](#13-open-source-strategy)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Future Considerations](#15-future-considerations)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

tinkerise is an open-source command-line tool that unifies project scaffolding across the entire modern development ecosystem. Instead of requiring developers to remember dozens of different `create-*` commands, framework-specific flags, and setup rituals, tinkerise provides a single, beautiful CLI interface that orchestrates existing best-in-class scaffolding tools behind the scenes.

> **Core Value Proposition**
>
> One command. Any stack. Best practices included. tinkerise doesn't reinvent scaffolding — it aggregates and orchestrates the official tools developers already trust, adding a unified experience, composable post-scaffold enhancements, and team-shareable presets on top.

The tool adopts antfu/ni's proven **detect → map → execute** architectural pattern: the user expresses intent (e.g., `tinkerise web next`), tinkerise maps that intent to the correct underlying scaffolder with appropriate flags, and executes it. This approach ensures tinkerise always stays current with upstream tooling while requiring minimal maintenance per supported framework.

tinkerise is built in TypeScript, distributed via both npm/npx and Homebrew, and targets individual developers, open-source maintainers, and engineering teams who want to standardize project initialization across their organizations.

---

## 2. Problem Statement

### 2.1 The Fragmentation Problem

Modern development requires choosing from an overwhelming number of frameworks, languages, and toolchains. Each comes with its own scaffolding command, its own flags, and its own assumptions about project setup. A developer working across frontend, backend, mobile, and infrastructure may need to remember:

- `npx create-next-app@latest --typescript --tailwind --eslint --app`
- `npm create vite@latest --template react-ts`
- `npx create-t3-app@latest`
- `django-admin startproject mysite`
- `cargo init --name my-project`
- `flutter create --org com.example my_app`
- `dotnet new webapi -n MyApi`
- `go mod init github.com/user/project`

Each command has different conventions for naming, flag syntax, interactive vs. non-interactive modes, and post-scaffold setup requirements. This fragmentation costs developers time, creates cognitive overhead, and leads to inconsistent project structures across teams.

### 2.2 The Best Practices Gap

Even after scaffolding, most generated projects lack production-grade tooling. Developers must manually configure ESLint (now flat config), Prettier, git hooks (husky + lint-staged), commit conventions (commitlint), CI/CD pipelines, Docker, and environment variable management. This repetitive setup work is error-prone and creates inconsistency across projects within the same team or organization.

### 2.3 The Team Standardization Challenge

Engineering teams often want standardized project templates that include company-specific configurations, internal packages, and architectural decisions. Current scaffolding tools don't support shareable, versionable preset configurations that teams can distribute and maintain as the organization's standards evolve.

### 2.4 Why Previous Attempts Failed

Research into prior universal scaffolders reveals a graveyard of abandoned projects. Yeoman's ecosystem of 5,600+ generators created an overwhelming choice paradox with inconsistent quality. SAO was abandoned after five years. Cloverfield never gained traction. The common failure mode is attempting to build a new template engine or generator ecosystem instead of leveraging existing, maintained tools.

> **Key Insight**
>
> Tools that wrap existing ecosystems (like antfu/ni wrapping package managers) succeed. Tools that try to replace existing ecosystems fail. tinkerise wraps; it does not replace.

---

## 3. Target Users

### 3.1 User Personas

#### Individual Developers

Full-stack and polyglot developers who frequently start new projects across multiple frameworks and languages. They value speed, consistency, and not having to look up the exact `create-*` command syntax every time. They install tinkerise globally via Homebrew or npm and use it as their default project initialization tool.

#### Open-Source Maintainers

Developers who create many small-to-medium projects, libraries, and proof-of-concept applications. They want a fast path from idea to working project with CI, linting, and testing already configured. They value the post-scaffold enhancements that tinkerise provides.

#### Engineering Team Leads

Technical leads responsible for standardizing development practices across teams. They want to create and distribute custom presets that encode organizational standards: preferred frameworks, required tooling, internal package dependencies, and CI/CD configurations. They distribute presets as npm packages.

### 3.2 User Journey

The typical user journey flows through four stages: **discovery** (finding tinkerise via GitHub, Homebrew, or team recommendation), **installation** (a single `brew install` or `npm install` command), **first use** (running tinkerise with their preferred stack and experiencing the unified prompt flow), and **adoption** (creating presets, using `tinkerise add` for enhancements, and recommending it to teammates).

---

## 4. Product Vision & Goals

### 4.1 Vision Statement

tinkerise becomes the universal entry point for starting any software project. Developers think "I need a new project" and reach for tinkerise regardless of the target stack, knowing they'll get a production-ready foundation with consistent tooling, shareable configurations, and zero framework-specific knowledge required.

### 4.2 Design Principles

- **Wrap, don't replace:** Always delegate to official scaffolding tools. Never maintain competing templates. This ensures tinkerise stays current automatically and users trust the output.
- **Curated, not crowd-sourced:** Support only official, well-maintained scaffolders. Quality over quantity. Avoid Yeoman's signal-to-noise problem.
- **Progressive disclosure:** Simple commands for common cases, powerful flags for advanced usage. A beginner runs `tinkerise web next` and gets something great; a power user passes `--preset` and `--add` flags for full control.
- **Composable enhancements:** Post-scaffold tooling (ESLint, Prettier, CI, Docker) is additive and modular, never forced. Each add-on is independent but aware of others.
- **Beautiful by default:** The CLI experience itself should be delightful. Use modern prompt UIs (@clack/prompts), clear progress indicators, and helpful error messages.

### 4.3 Success Metrics

| Metric | Target (6 months) | Target (12 months) |
|---|---|---|
| GitHub Stars | 1,000 | 5,000 |
| npm Weekly Downloads | 2,000 | 15,000 |
| Homebrew Installs | 500 | 3,000 |
| Supported Scaffolders | 12–15 | 20–25 |
| Post-Scaffold Add-ons | 6–8 | 12–15 |
| Community Presets Published | 5 | 25+ |
| Contributor Count | 5–10 | 20+ |

---

## 5. Command Interface Design

### 5.1 Command Grammar

tinkerise follows a consistent command grammar across all categories:

> **Command Pattern**
>
> `tinkerise <category> [framework] [project-name] [--flags]`

Categories map to broad project types. The framework argument selects the specific scaffolder. If omitted, tinkerise launches an interactive selection flow using @clack/prompts. An optional short alias `tk` is provided for convenience.

### 5.2 Primary Commands

| Command | Description | Underlying Tool |
|---|---|---|
| `tinkerise web next` | Next.js application | create-next-app |
| `tinkerise web vite` | Vite application (React, Vue, Svelte, etc.) | create-vite |
| `tinkerise web astro` | Astro website | create-astro |
| `tinkerise web tanstack` | TanStack Start application | create-tanstack-app |
| `tinkerise web t3` | T3 full-stack app (Next + tRPC + Prisma) | create-t3-app |
| `tinkerise web remix` | Remix application | create-remix |
| `tinkerise backend fastapi` | Python FastAPI project | fastapi CLI / template |
| `tinkerise backend django` | Python Django project | django-admin startproject |
| `tinkerise backend go` | Go HTTP service | go mod init + template |
| `tinkerise backend rust` | Rust web service (Actix/Axum) | cargo init + template |
| `tinkerise backend express` | Express.js API | express-generator / template |
| `tinkerise mobile flutter` | Flutter application | flutter create |
| `tinkerise mobile rn` | React Native app | npx create-expo-app |
| `tinkerise mcp` | MCP server template | create-mcp-server / template |
| `tinkerise cli` | Node.js CLI tool template | Custom template |
| `tinkerise lib` | npm package / library | Custom template |
| `tinkerise monorepo` | Turborepo monorepo | create-turbo |

### 5.3 Enhancement Commands

The `tinkerise add` command injects post-scaffold tooling into any existing project. Inspired by Astro's `astro add` pattern, each enhancement is a composable module that detects the existing project structure and adapts accordingly.

| Command | What It Adds |
|---|---|
| `tinkerise add eslint` | ESLint flat config with framework-appropriate plugins |
| `tinkerise add prettier` | Prettier config with Tailwind plugin if detected |
| `tinkerise add husky` | Git hooks via husky + lint-staged for pre-commit linting |
| `tinkerise add commitlint` | Conventional commit enforcement + changelog generation |
| `tinkerise add ci` | GitHub Actions workflow (lint, type-check, test, build) |
| `tinkerise add docker` | Multi-stage Dockerfile + .dockerignore |
| `tinkerise add env` | .env.example template, .env in .gitignore, validation setup |
| `tinkerise add testing` | Vitest or Jest config with example test files |
| `tinkerise add renovate` | Renovate config for automated dependency updates |
| `tinkerise add editorconfig` | Cross-editor formatting consistency |

### 5.4 Utility Commands

| Command | Description |
|---|---|
| `tinkerise list` | Show all available scaffolders and add-ons |
| `tinkerise doctor` | Check system for required tools (Node, Python, Go, etc.) |
| `tinkerise preset save <name>` | Save current project config as a reusable preset |
| `tinkerise preset use <name>` | Apply a saved or npm-distributed preset |
| `tinkerise update` | Self-update to latest version (with install method detection) |
| `tinkerise config` | Manage global tinkerise configuration |

### 5.5 Interactive Mode

When tinkerise is invoked without arguments or with only a category (e.g., just `tinkerise web`), it enters an interactive flow powered by @clack/prompts. The flow progressively narrows choices:

1. Category selection (web, backend, mobile, mcp, cli, lib, monorepo)
2. Framework selection within the chosen category
3. Framework-specific options (TypeScript, CSS framework, auth, ORM, etc.)
4. Optional post-scaffold enhancements (ESLint, Prettier, CI, Docker, etc.)
5. Project name and directory confirmation

Every interactive prompt has a corresponding CLI flag, enabling fully non-interactive execution for CI/CD environments and scripting. The CI environment is auto-detected via the `ci-info` package, falling back to sensible defaults.

---

## 6. Architecture

### 6.1 Core Architecture: Detect → Map → Execute

tinkerise adopts the architectural pattern proven by antfu/ni. Think of it as a universal translator: the user speaks one language (tinkerise commands), and the tool translates that into whatever specific dialect each scaffolding tool expects.

1. **Parse:** Commander.js parses the CLI input into a structured intent (category, framework, flags, project name).
2. **Resolve:** The scaffolder registry maps the intent to a specific tool, validates that it's available (or can be auto-installed), and computes the exact command with arguments.
3. **Prompt:** If any required information is missing, @clack/prompts collects it interactively, merging answers with any flags already provided.
4. **Execute:** execa spawns the underlying scaffolding tool with stdio inherited for real-time output. The user sees the familiar output from the tool they trust.
5. **Enhance:** If post-scaffold add-ons were selected, each enhancement module runs sequentially, detecting the project structure and injecting configuration files.
6. **Finalize:** Summary output showing what was created, next steps, and any additional setup instructions.

### 6.2 Scaffolder Registry

The scaffolder registry is a declarative data structure (not hardcoded logic) that maps framework identifiers to their execution details. Each entry specifies the npm package or system command to invoke, the argument mapping from tinkerise's unified flag names to tool-specific flags, prerequisite checks (e.g., Python >= 3.10 for FastAPI, Go >= 1.21 for Go projects), and whether the tool supports non-interactive mode.

This design means adding a new scaffolder requires only adding a new entry to the registry — no logic changes, no new code paths. The registry is the single source of truth for all supported frameworks.

### 6.3 Enhancement Module System

Each post-scaffold enhancement (ESLint, Prettier, husky, etc.) is an isolated module following create-t3-app's installer pattern. Modules declare their dependencies on other modules (e.g., Prettier's Tailwind plugin depends on Tailwind being present), access a shared dependency version map for consistent package versions, can detect existing project configuration to avoid conflicts, and operate idempotently — running an add-on twice produces the same result.

### 6.4 Configuration System

tinkerise uses cosmiconfig for configuration file discovery, automatically searching for `tinkerise.config.ts`, `tinkerise.config.js`, `.tinkeriserc` (JSON/YAML), and the "tinkerise" key in `package.json`. A `defineConfig()` helper provides TypeScript autocomplete for configuration authors.

Configuration supports three scopes:

- **Global** (`~/.config/tinkerise/config.json`): Stores defaults like preferred package manager, default TypeScript preference, and telemetry opt-in/out.
- **Project** (`tinkerise.config.ts` in the repo root): Defines team presets and stack compositions.
- **Inline** (CLI flags): Overrides everything and enables scripting.

### 6.5 Preset System

Presets are the mechanism for team standardization. A preset captures a complete scaffolding configuration: framework, options, and post-scaffold enhancements. Presets can be stored locally (saved to `~/.config/tinkerise/presets/`), distributed as npm packages (`@mycompany/tinkerise-preset-saas`), or referenced from GitHub repositories.

When a preset is invoked, tinkerise merges preset configuration with any CLI overrides, resolves the scaffolder and enhancements, and executes the full pipeline non-interactively. This enables one-command project creation that encodes organizational standards.

---

## 7. Distribution Strategy

### 7.1 npm (Primary Channel)

tinkerise is published to npm with a `bin` field mapping both `tinkerise` and `tk` to the compiled entry point. This enables `npx tinkerise` (no install), `npm install -g tinkerise` (global install), and `bunx tinkerise` (Bun users). The package targets Node.js >= 18 and is compiled with tsup to a single ESM bundle with a shebang header.

### 7.2 Homebrew (Secondary Channel)

A Homebrew tap (`homebrew-tinkerise`) provides macOS and Linux installation via `brew install tinkerise`. The formula uses the standard `depends_on "node"` pattern, installing from the npm registry tarball into `libexec` with symlinked executables. This is the same approach used by `vercel-cli` and `firebase-cli`.

Formula updates are automated via GitHub Actions: when a new version is published to npm, a workflow triggers the `mislav/bump-homebrew-formula-action` to update the tap repository with the new version and SHA256 hash.

### 7.3 Install Method Detection

tinkerise detects its installation method at runtime (Homebrew, npm global, npx, Bun) and adjusts update instructions accordingly. When running via npx, it skips update prompts entirely. When installed globally via Homebrew, it suggests `brew upgrade tinkerise` instead of `npm update`.

---

## 8. Scaffolder Integration Details

### 8.1 Integration Strategy per Scaffolder

Each scaffolder is integrated using one of three strategies, chosen based on the tool's capabilities:

- **Direct delegation:** The scaffolder supports CLI flags for non-interactive mode. tinkerise collects input, maps to flags, and spawns the tool with stdio inherited. This is the preferred strategy and applies to most Node.js scaffolders (create-next-app, create-vite, create-t3-app, create-astro, create-remix, create-turbo).
- **Wrapped execution:** The scaffolder requires some pre/post-processing. tinkerise runs the tool, then applies additional modifications. Applies to django-admin (post-scaffold settings.py configuration), flutter create (post-scaffold pubspec.yaml adjustments).
- **Template-based:** No suitable third-party scaffolder exists. tinkerise maintains its own minimal template, delivered via giget (tarball download from a template repository). Applies to MCP servers, CLI tools, npm libraries, Go services, and Rust services. These templates are maintained in a separate `tinkerise-templates` repository.

### 8.2 Prerequisite Detection

Before executing a scaffolder, tinkerise validates that all required system dependencies are present. The `tinkerise doctor` command runs all checks at once for a comprehensive system audit.

| Framework | Prerequisites | Auto-Install? |
|---|---|---|
| Next.js, Vite, Astro, T3 | Node.js >= 18, npm/pnpm/yarn | No (prompt to install) |
| FastAPI | Python >= 3.10, pip/pipx | No |
| Django | Python >= 3.10, pip | No |
| Go | Go >= 1.21 | No |
| Rust / Axum / Actix | Rust toolchain (rustup) | No |
| Flutter | Flutter SDK, Dart | No |
| React Native (Expo) | Node.js >= 18 | No |
| MCP Server | Node.js >= 18 | No |

### 8.3 Flag Mapping Examples

Each scaffolder entry in the registry includes a flag map that translates tinkerise's unified option names to tool-specific CLI arguments. This is the core of the aggregation pattern.

| tinkerise Flag | create-next-app | create-vite | create-t3-app |
|---|---|---|---|
| `--typescript` / `--ts` | `--typescript` | `--template react-ts` | (default, always TS) |
| `--tailwind` | `--tailwind` | (post-scaffold add) | `--tailwind` |
| `--eslint` | `--eslint` | (post-scaffold add) | (included) |
| `--no-git` | `--no-git` | (n/a) | `--noGit` |
| `--no-install` | `--no-install` | (n/a) | `--noInstall` |
| `--package-manager` | `--use-pnpm/yarn/npm` | (n/a) | (n/a) |

---

## 9. Enhancement Modules (Detailed)

### 9.1 Module Architecture

Each enhancement module implements a standard interface that defines its unique identifier, human-readable name and description, a `detect` function to check if the enhancement is already present, a list of dependencies on other modules, an `install` function that performs the actual configuration, and a framework compatibility matrix.

Modules receive a context object containing the project root path, detected package manager, detected framework, installed dependencies, and the results of previously-run modules. This context allows modules to adapt intelligently — for example, the ESLint module installs different plugins depending on whether the project uses React, Vue, or Svelte.

### 9.2 Dependency Resolution

When a user selects multiple add-ons, tinkerise resolves their dependency graph to determine execution order. For example, the Prettier module checks if Tailwind is present (either from the initial scaffold or from another add-on) and conditionally adds the `prettier-plugin-tailwindcss`. The CI workflow module checks which testing framework is present and adjusts the workflow steps accordingly.

Circular dependencies are not permitted and will result in a clear error at module registration time. All dependency relationships are declared statically, not computed at runtime.

### 9.3 Idempotency and Conflict Detection

Every module must be idempotent. If a user runs `tinkerise add eslint` on a project that already has ESLint configured, the module detects the existing configuration and offers three options: **skip** (keep existing), **merge** (combine configs intelligently), or **replace** (overwrite with tinkerise's defaults). This prevents destructive operations on existing projects and makes tinkerise safe to use on any codebase.

---

## 10. Milestones & Phased Delivery

> **Delivery Philosophy**
>
> Ship a thin, polished slice in Phase 1 that works perfectly for the most common use case (web scaffolding). Expand coverage and power features in subsequent phases based on user feedback and adoption signals.

### 10.1 Phase 1 — Foundation (Weeks 1–6)

The first phase delivers the core loop end-to-end for the most popular web frameworks. Success criteria: a user can install tinkerise, run a single command, and get a fully scaffolded project with optional enhancements.

**Deliverables:**

- CLI skeleton with commander + @clack/prompts + execa
- Scaffolder registry with 5–7 web frameworks: Next.js, Vite, Astro, T3, Remix, TanStack Start, Turbo
- Interactive and non-interactive modes
- 4 core enhancement modules: ESLint, Prettier, husky + lint-staged, GitHub Actions CI
- npm publishing with npx support
- Homebrew tap with automated formula updates
- Documentation site (Starlight) with getting-started guide
- CI pipeline: lint, type-check, test, release automation with changesets

### 10.2 Phase 2 — Backend & Mobile (Weeks 7–12)

Expand beyond web to cover backend and mobile scaffolding. Introduce the preset system for team standardization.

**Deliverables:**

- Backend scaffolders: FastAPI, Django, Go, Rust (Axum), Express
- Mobile scaffolders: Flutter, React Native (Expo)
- Prerequisite detection and `tinkerise doctor` command
- Preset system (save, use, npm distribution)
- Configuration file support via cosmiconfig (`tinkerise.config.ts`)
- 4 additional enhancement modules: Docker, env management, commitlint, testing setup
- Global config management (`tinkerise config`)

### 10.3 Phase 3 — Ecosystem & Community (Weeks 13–20)

Focus on community growth, ecosystem integrations, and power features.

**Deliverables:**

- MCP server, CLI tool, and npm library templates
- `tinkerise add` for existing projects (retrofit enhancements onto non-tinkerise projects)
- Community preset registry / showcase
- `tinkerise update` with install-method-aware self-update
- Additional enhancement modules: Renovate, EditorConfig, Dependabot, Sentry
- Telemetry (opt-in, privacy-respecting) for prioritizing scaffolder support
- VS Code extension for visual project scaffolding

### 10.4 Phase 4 — Advanced Features (Weeks 21+)

Long-term features driven by community adoption and feedback.

**Deliverables:**

- Monorepo-aware scaffolding (add packages to existing Turborepo/Nx workspaces)
- AI-assisted project initialization (describe what you want, get a recommended stack)
- Formal plugin API for community-contributed scaffolders
- Enterprise features: private preset registries, audit logging, compliance templates
- Cross-platform binary distribution (Node.js SEA or Bun compile) for zero-dependency install

---

## 11. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Language | TypeScript 5.x (strict mode) | Type safety, developer familiarity, npm ecosystem access |
| CLI Framework | commander.js | Battle-tested, lightweight, excellent TS support, huge community |
| Interactive Prompts | @clack/prompts | Beautiful UX, modern API, adopted by create-t3-app and create-astro |
| Process Execution | execa v9 | Promise-based, cross-platform, automatic argument escaping |
| Config Discovery | cosmiconfig | Industry standard, supports .rc / .ts / package.json configs |
| Bundler | tsup (esbuild-based) | Fast builds, ESM output, automatic shebang injection |
| Package Manager | pnpm | Fast, disk-efficient, excellent monorepo support |
| Monorepo Tool | Turborepo | Fast task execution, caching, pipeline orchestration |
| Testing | Vitest | Fast, ESM-native, Jest-compatible API, snapshot testing |
| Linting | ESLint (flat config) + Prettier | Modern config format, consistent code style |
| Release | changesets + GitHub Actions | Monorepo-aware versioning, automated npm + Homebrew publishing |
| Documentation | Starlight (Astro) | Purpose-built docs framework, fast, beautiful defaults |
| CI/CD | GitHub Actions | Tight npm/Homebrew integration, matrix testing |

---

## 12. Testing Strategy

### 12.1 Test Layers

tinkerise's test strategy operates across three layers to ensure reliability without excessive execution time.

- **Unit tests** validate individual functions: flag mapping logic, registry resolution, enhancement module dependency graphs, config merging, and prerequisite detection. These use Vitest with in-memory mocks and run in under 10 seconds.
- **Integration tests** validate the full CLI invocation path. They spawn the tinkerise binary using execa, pass real arguments, and assert on exit codes, stdout content (stripped of ANSI codes via `strip-ansi`), and generated file existence. Snapshot testing captures CLI output for regression detection.
- **End-to-end scaffold tests** run the actual scaffolding pipeline in a temporary directory and verify the output project is valid. This includes checking that the generated project installs dependencies, passes linting, and builds successfully. These tests are expensive and run only in CI, gated behind a `TINKERISE_E2E=true` environment variable.

### 12.2 CI Matrix

The CI pipeline tests across Node.js 18, 20, and 22 on Ubuntu. macOS runners are used for Homebrew formula validation. Each PR runs unit + integration tests; the full E2E suite runs on the main branch merge and pre-release.

---

## 13. Open-Source Strategy

### 13.1 Licensing

tinkerise is released under the MIT License, maximizing adoption and contribution potential. All dependencies must be MIT, Apache-2.0, BSD, or ISC licensed. A license audit runs in CI to prevent incompatible dependencies.

### 13.2 Repository Structure

The project uses a pnpm monorepo with Turborepo, separating the CLI package, core logic, enhancement modules, template references, and documentation site. This separation enables independent versioning and clear ownership boundaries.

### 13.3 Contribution Model

The project follows a "fork and PR" contribution model with required PR reviews, conventional commits (enforced via commitlint), and automated changeset requirements. A `CONTRIBUTING.md` provides setup instructions, architecture overview, and guidelines for adding new scaffolders or enhancement modules. Good first issues are labeled and maintained to onboard new contributors.

### 13.4 Community Channels

Community communication happens through GitHub Discussions (Q&A, ideas, show-and-tell), GitHub Issues (bugs, feature requests), and a Discord server for real-time collaboration. Release announcements are cross-posted to Twitter/X and relevant developer communities.

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Upstream scaffolder changes break flag mappings | High | Medium | Pin to @latest with automated weekly integration tests. Flag changes are detected by snapshot tests and addressed in patch releases. |
| Low initial adoption due to crowded CLI tooling space | Medium | High | Focus marketing on the unique aggregation value prop. Ship a flawless v1 for the top 3 frameworks. Target developers who already use multiple frameworks. |
| Maintenance burden grows linearly with supported scaffolders | Medium | Medium | Keep the scaffolder registry declarative. Automated tests catch breakage. Community contributors own specific scaffolder integrations. |
| Homebrew formula review/acceptance delays | Low | Low | Use a custom tap initially (no core formula approval needed). Consider submitting to homebrew-core once adoption justifies it. |
| Template-based scaffolders (Go, Rust, MCP) become stale | Medium | Medium | Minimize template scope. Use Renovate on the templates repo. Community ownership of language-specific templates. |
| User confusion between tinkerise and underlying tool errors | Medium | Medium | Clearly attribute errors to the underlying tool. Provide contextual help links. Never swallow or transform upstream error output. |

---

## 15. Future Considerations

### 15.1 Plugin Architecture

While Phase 1–3 deliberately avoids a formal plugin system (to reduce complexity and avoid Yeoman's pitfalls), a lightweight plugin mechanism may become necessary as the community grows. The planned approach follows oclif's model: plugins are npm packages conforming to a standard interface, discovered via a `plugins` key in the config file. Lifecycle hooks (`pre-scaffold`, `post-scaffold`, `pre-enhance`, `post-enhance`) provide extension points. This should only be built when there is demonstrated community demand for scaffolders that don't belong in the curated core registry.

### 15.2 AI-Assisted Scaffolding

A future capability where users describe their project in natural language ("I need a SaaS app with auth, payments, and a dashboard") and tinkerise recommends a stack, selects the right scaffolder, and configures appropriate enhancements. This requires careful UX design to avoid the "black box" problem and should surface its reasoning transparently.

### 15.3 Workspace-Aware Operations

For teams using monorepos, tinkerise could detect an existing workspace (Turborepo, Nx, pnpm workspaces) and scaffold new packages within it rather than creating standalone projects. This includes automatically updating workspace configurations, shared tooling references, and CI pipeline entries.

### 15.4 Binary Distribution

As Node.js Single Executable Applications (SEA) mature or Bun's compile feature stabilizes, distributing tinkerise as a standalone binary (no Node.js dependency) would simplify Homebrew distribution and remove the runtime dependency. This is tracked as a future optimization.

---

## 16. Appendix

### 16.1 Competitive Landscape

| Tool | Approach | Status | Key Lesson for tinkerise |
|---|---|---|---|
| Yeoman | Generator ecosystem (5,600+) | Active but declining | Crowd-sourced generators create noise. Curate instead. |
| SAO | Modern Yeoman alternative | Abandoned (2023) | Solo maintainer risk. Build community early. |
| Cloverfield | Yeoman discovery layer | Abandoned | Discovery alone isn't enough. Provide the full UX. |
| Backstage (Spotify) | Web-based software templates | Active (CNCF) | Proves enterprise demand. CLI fills a different niche. |
| ni (antfu) | Package manager aggregator | Active, ~7k stars | Detect-map-execute pattern works. Follow this model. |
| projen | Code-as-configuration | Active (AWS) | Too opinionated for general use. Stay flexible. |
| Nx generators | Monorepo plugin generators | Active | Plugin architecture is powerful but heavyweight. |

### 16.2 Key References & Prior Art

- **clig.dev** — Command Line Interface Guidelines for modern CLI design patterns
- **antfu/ni** — Package manager aggregation pattern and source code
- **create-t3-app architecture** — Modular installer pattern and dependency version management
- **Homebrew Node.js formula documentation** — Official guide for packaging Node.js CLIs
- **@clack/prompts** — Modern prompt library used by major scaffolders
- **execa documentation** — Cross-platform process execution patterns
- **cosmiconfig** — Configuration file discovery standard
- **Astro's `astro add` pattern** — Post-scaffold enhancement model

---

*End of Document*
