/**
 * E2E scaffold tests for all 7 web framework scaffolders.
 *
 * Gated behind TINKERISE_E2E=true environment variable.
 * These tests call real upstream scaffolders in temp directories,
 * verifying the tinkerise pipeline works end-to-end with real tools.
 *
 * Usage:
 *   TINKERISE_E2E=true bun run test -- packages/cli/tests/e2e/scaffold.e2e.test.ts
 *
 * Skipped by default in CI and local test runs.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execaNode } from 'execa'

const E2E_ENABLED = process.env.TINKERISE_E2E === 'true'

// Path to the built CLI binary
const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js')

// Long timeout for E2E tests (scaffolding + optional install can take time)
const E2E_TIMEOUT = 180_000 // 3 minutes

/**
 * Helper to verify a file exists at the given path.
 * Throws if file does not exist.
 */
async function expectFileExists(filePath: string): Promise<void> {
  await expect(access(filePath)).resolves.toBeUndefined()
}

// ---------------------------------------------------------------------------
// Next.js
// ---------------------------------------------------------------------------
describe.skipIf(!E2E_ENABLED)('E2E: scaffold Next.js', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'tinkerise-e2e-next-'))
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('scaffolds a Next.js project', async () => {
    const result = await execaNode(CLI_PATH, [
      'web', 'next', 'test-next',
      '--ts', '--no-install', '--no-git',
    ], {
      cwd: tmpDir,
      timeout: E2E_TIMEOUT,
      reject: false,
    })

    expect(result.exitCode).toBe(0)

    const projectDir = join(tmpDir, 'test-next')
    await expectFileExists(projectDir)
    await expectFileExists(join(projectDir, 'package.json'))
    await expectFileExists(join(projectDir, 'tsconfig.json'))
  }, E2E_TIMEOUT)
})

// ---------------------------------------------------------------------------
// Vite
// ---------------------------------------------------------------------------
describe.skipIf(!E2E_ENABLED)('E2E: scaffold Vite', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'tinkerise-e2e-vite-'))
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('scaffolds a Vite project', async () => {
    // Vite doesn't install deps by default, so no --no-install needed
    const result = await execaNode(CLI_PATH, [
      'web', 'vite', 'test-vite',
      '--template', 'react', '--ts', '--no-git',
    ], {
      cwd: tmpDir,
      timeout: E2E_TIMEOUT,
      reject: false,
    })

    expect(result.exitCode).toBe(0)

    const projectDir = join(tmpDir, 'test-vite')
    await expectFileExists(projectDir)
    await expectFileExists(join(projectDir, 'package.json'))
    await expectFileExists(join(projectDir, 'vite.config.ts'))
  }, E2E_TIMEOUT)
})

// ---------------------------------------------------------------------------
// Astro
// ---------------------------------------------------------------------------
describe.skipIf(!E2E_ENABLED)('E2E: scaffold Astro', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'tinkerise-e2e-astro-'))
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('scaffolds an Astro project', async () => {
    // Pass --yes via passthrough to skip Astro's own prompts
    const result = await execaNode(CLI_PATH, [
      'web', 'astro', 'test-astro',
      '--no-install', '--no-git',
      '--', '--yes',
    ], {
      cwd: tmpDir,
      timeout: E2E_TIMEOUT,
      reject: false,
    })

    expect(result.exitCode).toBe(0)

    const projectDir = join(tmpDir, 'test-astro')
    await expectFileExists(projectDir)
    await expectFileExists(join(projectDir, 'package.json'))
  }, E2E_TIMEOUT)
})

// ---------------------------------------------------------------------------
// T3
// ---------------------------------------------------------------------------
describe.skipIf(!E2E_ENABLED)('E2E: scaffold T3', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'tinkerise-e2e-t3-'))
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('scaffolds a T3 project', async () => {
    // Use unified flags (--no-install, --no-git) which tinkerise translates
    // to native camelCase (--noInstall, --noGit).
    // Pass --CI via passthrough to suppress T3's interactive prompts.
    const result = await execaNode(CLI_PATH, [
      'web', 't3', 'test-t3',
      '--tailwind', '--no-install', '--no-git',
      '--', '--CI',
    ], {
      cwd: tmpDir,
      timeout: E2E_TIMEOUT,
      reject: false,
    })

    expect(result.exitCode).toBe(0)

    const projectDir = join(tmpDir, 'test-t3')
    await expectFileExists(projectDir)
    await expectFileExists(join(projectDir, 'package.json'))
  }, E2E_TIMEOUT)
})

// ---------------------------------------------------------------------------
// Remix (React Router v7)
// ---------------------------------------------------------------------------
describe.skipIf(!E2E_ENABLED)('E2E: scaffold Remix', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'tinkerise-e2e-remix-'))
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('scaffolds a Remix (React Router) project', async () => {
    // Pass --yes to skip RR's interactive prompts
    const result = await execaNode(CLI_PATH, [
      'web', 'remix', 'test-remix',
      '--no-install', '--no-git',
      '--', '--yes',
    ], {
      cwd: tmpDir,
      timeout: E2E_TIMEOUT,
      reject: false,
    })

    expect(result.exitCode).toBe(0)

    const projectDir = join(tmpDir, 'test-remix')
    await expectFileExists(projectDir)
  }, E2E_TIMEOUT)
})

// ---------------------------------------------------------------------------
// TanStack Start
// ---------------------------------------------------------------------------
describe.skipIf(!E2E_ENABLED)('E2E: scaffold TanStack Start', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'tinkerise-e2e-tanstack-'))
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('scaffolds a TanStack Start project', async () => {
    // Pass -y to create with defaults only
    const result = await execaNode(CLI_PATH, [
      'web', 'tanstack', 'test-tanstack',
      '--', '-y',
    ], {
      cwd: tmpDir,
      timeout: E2E_TIMEOUT,
      reject: false,
    })

    expect(result.exitCode).toBe(0)

    const projectDir = join(tmpDir, 'test-tanstack')
    await expectFileExists(projectDir)
  }, E2E_TIMEOUT)
})

// ---------------------------------------------------------------------------
// Turborepo
// ---------------------------------------------------------------------------
describe.skipIf(!E2E_ENABLED)('E2E: scaffold Turborepo', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'tinkerise-e2e-turbo-'))
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('scaffolds a Turborepo monorepo', async () => {
    const result = await execaNode(CLI_PATH, [
      'monorepo', 'test-turbo',
      '--no-install', '--package-manager', 'npm',
    ], {
      cwd: tmpDir,
      timeout: E2E_TIMEOUT,
      reject: false,
    })

    expect(result.exitCode).toBe(0)

    const projectDir = join(tmpDir, 'test-turbo')
    await expectFileExists(projectDir)
    await expectFileExists(join(projectDir, 'turbo.json'))
  }, E2E_TIMEOUT)
})
