/**
 * Docker enhancement module.
 *
 * Generates a framework-aware multi-stage Dockerfile and .dockerignore.
 * Detects project framework beyond web FrameworkIds by inspecting the
 * filesystem for Python, Go, and Rust project markers.
 */

import type { FrameworkId, ProjectContext } from '../types.js'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineEnhancement } from '../define.js'
import { writeConfigFile } from './_utils.js'

/** Extended framework type for Docker (includes non-web frameworks) */
type DockerFramework
  = | 'next'
    | 'vite'
    | 'fastapi'
    | 'django'
    | 'go'
    | 'rust'
    | 'node'

/** Docker-specific config per framework */
interface DockerConfig {
  dockerfile: string
  dockerignore: string[]
}

/** Common .dockerignore patterns */
const BASE_IGNORE = [
  'node_modules',
  '.git',
  '.env',
  '*.md',
  '.github',
]

const NODE_IGNORE = [
  ...BASE_IGNORE,
  'dist',
  '.next',
  '.nuxt',
  '.output',
]

const PYTHON_IGNORE = [
  ...BASE_IGNORE,
  '__pycache__',
  '*.pyc',
  '.venv',
  'venv',
]

const GO_IGNORE = [
  ...BASE_IGNORE,
  'vendor',
]

const RUST_IGNORE = [
  ...BASE_IGNORE,
  'target',
]

/** Vite-style web frameworks that produce static builds */
const VITE_FRAMEWORKS: ReadonlySet<FrameworkId> = new Set([
  'react',
  'vue',
  'svelte',
  'astro',
])

/**
 * Detect the Docker-relevant framework from project context and filesystem.
 *
 * Checks ctx.framework first (for web frameworks), then falls back to
 * filesystem inspection for backend/systems languages.
 */
export async function detectDockerFramework(ctx: ProjectContext): Promise<DockerFramework> {
  // Web frameworks from ctx.framework
  if (ctx.framework === 'next' || ctx.framework === 'remix') {
    return 'next'
  }
  if (ctx.framework && VITE_FRAMEWORKS.has(ctx.framework)) {
    return 'vite'
  }

  // Filesystem-based detection for non-web frameworks
  // Check Python (FastAPI / Django)
  const pythonFramework = await detectPythonFramework(ctx.rootDir)
  if (pythonFramework)
    return pythonFramework

  // Check Go
  try {
    await access(join(ctx.rootDir, 'go.mod'))
    return 'go'
  }
  catch {
    // Not a Go project
  }

  // Check Rust
  try {
    await access(join(ctx.rootDir, 'Cargo.toml'))
    return 'rust'
  }
  catch {
    // Not a Rust project
  }

  // Fallback: generic Node.js
  return 'node'
}

/**
 * Detect Python web framework from requirements.txt or pyproject.toml.
 */
async function detectPythonFramework(rootDir: string): Promise<'fastapi' | 'django' | null> {
  const filesToCheck = ['requirements.txt', 'pyproject.toml']

  for (const file of filesToCheck) {
    try {
      const content = await readFile(join(rootDir, file), 'utf-8')
      const lower = content.toLowerCase()
      if (lower.includes('fastapi'))
        return 'fastapi'
      if (lower.includes('django'))
        return 'django'
    }
    catch {
      // File doesn't exist
    }
  }

  return null
}

const FRAMEWORK_DOCKER_MAP: Record<DockerFramework, DockerConfig> = {
  next: {
    dockerfile: `FROM node:22-alpine AS base

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
`,
    dockerignore: NODE_IGNORE,
  },

  vite: {
    dockerfile: `FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`,
    dockerignore: NODE_IGNORE,
  },

  fastapi: {
    dockerfile: `FROM python:3.12-slim AS builder
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
`,
    dockerignore: PYTHON_IGNORE,
  },

  django: {
    dockerfile: `FROM python:3.12-slim AS builder
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
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
`,
    dockerignore: PYTHON_IGNORE,
  },

  go: {
    dockerfile: `FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server .

FROM scratch AS runner
COPY --from=builder /app/server /server
EXPOSE 8080
CMD ["/server"]
`,
    dockerignore: GO_IGNORE,
  },

  rust: {
    dockerfile: `FROM rust:1.82-slim AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim AS runner
WORKDIR /app
COPY --from=builder /app/target/release/app /app/server
EXPOSE 8080
CMD ["/app/server"]
`,
    dockerignore: RUST_IGNORE,
  },

  node: {
    dockerfile: `FROM node:22-alpine AS base

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
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
`,
    dockerignore: NODE_IGNORE,
  },
}

export const dockerModule = defineEnhancement({
  id: 'docker',
  name: 'Docker',
  description: 'Framework-aware multi-stage Dockerfile and .dockerignore',
  dependsOn: [],

  async detect(ctx: ProjectContext) {
    const configFiles: string[] = []

    for (const file of ['Dockerfile', '.dockerignore']) {
      try {
        await access(join(ctx.rootDir, file))
        configFiles.push(join(ctx.rootDir, file))
      }
      catch {
        // File doesn't exist
      }
    }

    return {
      installed: configFiles.length > 0,
      configFiles,
      partial: false,
    }
  },

  async install(ctx: ProjectContext) {
    const framework = await detectDockerFramework(ctx)
    const config = FRAMEWORK_DOCKER_MAP[framework]

    // Write Dockerfile
    const dockerfilePath = await writeConfigFile(
      ctx.rootDir,
      'Dockerfile',
      config.dockerfile,
    )

    // Write .dockerignore
    const dockerignorePath = await writeConfigFile(
      ctx.rootDir,
      '.dockerignore',
      `${config.dockerignore.join('\n')}\n`,
    )

    return {
      success: true,
      filesModified: [dockerfilePath, dockerignorePath],
      packagesAdded: [],
      warnings: [],
    }
  },
})
