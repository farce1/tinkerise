/**
 * Scaffolder metadata — display names, descriptions, and suggestions.
 *
 * Separate from the Zod-validated registry schema to keep display
 * concerns separate from execution (per research recommendation).
 */

export interface ScaffolderMetadata {
  /** Human-readable display name */
  displayName: string
  /** One-line description for tinkerise list */
  description: string
  /** Framework-aware enhancement suggestions shown in summary card */
  suggestions: string[]
}

export const SCAFFOLDER_METADATA: Record<string, ScaffolderMetadata> = {
  next: {
    displayName: 'Next.js',
    description: 'React framework with SSR, routing, and API routes',
    suggestions: [
      'Run `tinkerise add prettier` to add code formatting',
      'Run `tinkerise add husky` to add pre-commit hooks',
    ],
  },
  vite: {
    displayName: 'Vite',
    description: 'Fast build tool with hot module replacement',
    suggestions: [
      'Run `tinkerise add eslint` to add linting',
      'Run `tinkerise add prettier` to add code formatting',
    ],
  },
  astro: {
    displayName: 'Astro',
    description: 'Content-focused web framework with island architecture',
    suggestions: [
      'Run `tinkerise add prettier` to add code formatting',
      'Run `tinkerise add husky` to add pre-commit hooks',
    ],
  },
  t3: {
    displayName: 'T3',
    description: 'Full-stack TypeScript app with tRPC, Prisma, and NextAuth',
    suggestions: [
      'Run `tinkerise add prettier` to add code formatting',
      'Run `tinkerise add ci` to add GitHub Actions CI',
    ],
  },
  remix: {
    displayName: 'Remix (React Router v7)',
    description: 'Full-stack React framework with nested routes and loaders',
    suggestions: [
      'Run `tinkerise add eslint` to add linting',
      'Run `tinkerise add prettier` to add code formatting',
    ],
  },
  tanstack: {
    displayName: 'TanStack Start',
    description: 'Full-stack React framework powered by TanStack Router',
    suggestions: [
      'Run `tinkerise add prettier` to add code formatting',
      'Run `tinkerise add ci` to add GitHub Actions CI',
    ],
  },
  turbo: {
    displayName: 'Turborepo',
    description: 'High-performance monorepo build system',
    suggestions: [
      'Run `tinkerise add eslint` to add monorepo-wide linting',
      'Run `tinkerise add ci` to add GitHub Actions CI',
    ],
  },
  fastapi: {
    displayName: 'FastAPI',
    description: 'Modern Python API framework with automatic docs',
    suggestions: [
      'Run `tinkerise add docker` to add Docker support',
      'Run `tinkerise doctor` to verify Python setup',
    ],
  },
  django: {
    displayName: 'Django',
    description: 'Full-featured Python web framework with admin and ORM',
    suggestions: [
      'Run `tinkerise add docker` to add Docker support',
      'Run `tinkerise doctor` to verify Python setup',
    ],
  },
  go: {
    displayName: 'Go',
    description: 'Go HTTP service with framework choice (Chi, Gin, Fiber, Echo)',
    suggestions: [
      'Run `tinkerise add docker` to add Docker support',
      'Run `tinkerise doctor` to verify Go setup',
    ],
  },
  rust: {
    displayName: 'Rust (Axum)',
    description: 'Rust web service with Axum framework',
    suggestions: [
      'Run `tinkerise add docker` to add Docker support',
      'Run `tinkerise doctor` to verify Rust setup',
    ],
  },
  express: {
    displayName: 'Express',
    description: 'TypeScript Express.js API with structured CRUD template',
    suggestions: [
      'Run `tinkerise add eslint` to add linting',
      'Run `tinkerise add docker` to add Docker support',
    ],
  },
}

/**
 * Get metadata for a scaffolder by name.
 * Returns undefined if no metadata exists.
 */
export function getScaffolderMetadata(name: string): ScaffolderMetadata | undefined {
  return SCAFFOLDER_METADATA[name]
}
