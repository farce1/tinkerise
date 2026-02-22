import type { ProjectContext } from '../../../src/enhancements/types.js'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { dockerModule } from '../../../src/enhancements/modules/docker.js'

const TEST_ROOT = join('/', 'tmp', 'test-project')
const projectPath = (relativePath: string) => join(TEST_ROOT, ...relativePath.split('/'))

const mockAccess = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockMkdir = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('node:fs/promises', () => ({
  access: mockAccess,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}))

function makeCtx(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    rootDir: TEST_ROOT,
    packageManager: 'npm',
    framework: null,
    packageJson: { type: 'module' },
    installedDeps: {},
    freshScaffold: false,
    verbose: false,
    ...overrides,
  }
}

describe('dockerModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    mockReadFile.mockRejectedValue(new Error('ENOENT'))
  })

  describe('detect', () => {
    it('returns not installed when no Dockerfile exists', async () => {
      const result = await dockerModule.detect(makeCtx())
      expect(result.installed).toBe(false)
      expect(result.configFiles).toEqual([])
    })

    it('returns installed when Dockerfile exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('Dockerfile'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await dockerModule.detect(makeCtx())
      expect(result.installed).toBe(true)
      expect(result.configFiles).toContain(projectPath('Dockerfile'))
    })

    it('returns installed when .dockerignore exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path === projectPath('.dockerignore'))
          return undefined
        throw new Error('ENOENT')
      })

      const result = await dockerModule.detect(makeCtx())
      expect(result.installed).toBe(true)
      expect(result.configFiles).toContain(projectPath('.dockerignore'))
    })
  })

  describe('install', () => {
    it('generates Next.js Dockerfile when framework is next', async () => {
      const result = await dockerModule.install(makeCtx({ framework: 'next' }))

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('Dockerfile'),
      )
      expect(dockerfileCall).toBeTruthy()
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('node:22-alpine')
      expect(dockerfile).toContain('AS deps')
      expect(dockerfile).toContain('AS builder')
      expect(dockerfile).toContain('AS runner')
      expect(dockerfile).toContain('.next/standalone')
      expect(dockerfile).toContain('nextjs')
      expect(dockerfile).toContain('EXPOSE 3000')
      expect(result.packagesAdded).toEqual([])
    })

    it('generates Vite Dockerfile for react framework', async () => {
      await dockerModule.install(makeCtx({ framework: 'react' }))

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('Dockerfile'),
      )
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('node:22-alpine AS builder')
      expect(dockerfile).toContain('nginx:alpine')
      expect(dockerfile).toContain('/usr/share/nginx/html')
      expect(dockerfile).toContain('EXPOSE 80')
    })

    it('generates Vite Dockerfile for vue framework', async () => {
      await dockerModule.install(makeCtx({ framework: 'vue' }))

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('Dockerfile'),
      )
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('nginx:alpine')
    })

    it('generates Vite Dockerfile for svelte framework', async () => {
      await dockerModule.install(makeCtx({ framework: 'svelte' }))

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('Dockerfile'),
      )
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('nginx:alpine')
    })

    it('generates FastAPI Dockerfile when requirements.txt contains fastapi', async () => {
      mockReadFile.mockImplementation(async (path: string) => {
        if ((path as string).endsWith('requirements.txt')) {
          return 'fastapi==0.110.0\nuvicorn==0.29.0\n'
        }
        throw new Error('ENOENT')
      })

      await dockerModule.install(makeCtx())

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('Dockerfile'),
      )
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('python:3.12-slim')
      expect(dockerfile).toContain('uvicorn')
      expect(dockerfile).toContain('EXPOSE 8000')
      expect(dockerfile).toContain('appuser')
    })

    it('generates Django Dockerfile when requirements.txt contains django', async () => {
      mockReadFile.mockImplementation(async (path: string) => {
        if ((path as string).endsWith('requirements.txt')) {
          return 'django==5.0\ngunicorn==21.2.0\n'
        }
        throw new Error('ENOENT')
      })

      await dockerModule.install(makeCtx())

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('Dockerfile'),
      )
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('python:3.12-slim')
      expect(dockerfile).toContain('gunicorn')
      expect(dockerfile).toContain('EXPOSE 8000')
    })

    it('generates Go Dockerfile when go.mod exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if ((path as string).endsWith('go.mod'))
          return undefined
        throw new Error('ENOENT')
      })

      await dockerModule.install(makeCtx())

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('Dockerfile'),
      )
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('golang:1.23-alpine')
      expect(dockerfile).toContain('CGO_ENABLED=0')
      expect(dockerfile).toContain('scratch')
      expect(dockerfile).toContain('EXPOSE 8080')
    })

    it('generates Rust Dockerfile when Cargo.toml exists', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if ((path as string).endsWith('Cargo.toml'))
          return undefined
        throw new Error('ENOENT')
      })

      await dockerModule.install(makeCtx())

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('Dockerfile'),
      )
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('rust:1.82-slim')
      expect(dockerfile).toContain('cargo build --release')
      expect(dockerfile).toContain('debian:bookworm-slim')
      expect(dockerfile).toContain('EXPOSE 8080')
    })

    it('generates generic Node.js Dockerfile as fallback', async () => {
      await dockerModule.install(makeCtx())

      const dockerfileCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).endsWith('Dockerfile'),
      )
      const dockerfile = dockerfileCall![1] as string

      expect(dockerfile).toContain('node:22-alpine')
      expect(dockerfile).toContain('npm run build')
      expect(dockerfile).toContain('dist/index.js')
      expect(dockerfile).toContain('EXPOSE 3000')
    })

    it('writes .dockerignore with appropriate patterns', async () => {
      await dockerModule.install(makeCtx({ framework: 'next' }))

      const ignoreCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('.dockerignore'),
      )
      expect(ignoreCall).toBeTruthy()
      const ignoreContent = ignoreCall![1] as string

      expect(ignoreContent).toContain('node_modules')
      expect(ignoreContent).toContain('.git')
      expect(ignoreContent).toContain('.env')
      expect(ignoreContent).toContain('.next')
    })

    it('writes Python .dockerignore for FastAPI projects', async () => {
      mockReadFile.mockImplementation(async (path: string) => {
        if ((path as string).endsWith('requirements.txt')) {
          return 'fastapi==0.110.0\n'
        }
        throw new Error('ENOENT')
      })

      await dockerModule.install(makeCtx())

      const ignoreCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('.dockerignore'),
      )
      const ignoreContent = ignoreCall![1] as string

      expect(ignoreContent).toContain('__pycache__')
      expect(ignoreContent).toContain('*.pyc')
      expect(ignoreContent).toContain('.venv')
    })

    it('writes Rust .dockerignore for Rust projects', async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if ((path as string).endsWith('Cargo.toml'))
          return undefined
        throw new Error('ENOENT')
      })

      await dockerModule.install(makeCtx())

      const ignoreCall = mockWriteFile.mock.calls.find(
        (c: unknown[]) => (c[0] as string).includes('.dockerignore'),
      )
      const ignoreContent = ignoreCall![1] as string

      expect(ignoreContent).toContain('target')
    })

    it('returns success with both files modified', async () => {
      const result = await dockerModule.install(makeCtx())

      expect(result.success).toBe(true)
      expect(result.filesModified).toHaveLength(2)
      expect(result.filesModified[0]).toContain('Dockerfile')
      expect(result.filesModified[1]).toContain('.dockerignore')
    })
  })
})
