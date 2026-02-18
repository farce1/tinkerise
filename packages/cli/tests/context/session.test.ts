/**
 * Tests for file-based session persistence.
 *
 * Verifies:
 * - writeSessionFile creates valid JSON with correct structure
 * - readSessionFile returns data within expiry window
 * - readSessionFile returns empty for expired sessions
 * - readSessionFile returns empty for missing files
 * - getSessionContext prefers in-memory over file-based
 * - getSessionContext falls back to file when in-memory empty
 * - writeSessionFile auto-adds to .gitignore
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  writeSessionFile,
  readSessionFile,
  getSessionContext,
  setSessionContext,
  clearSessionContext,
  SESSION_FILENAME,
} from '../../src/context/session.js'

describe('session file persistence', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tinkerise-session-test-'))
    clearSessionContext()
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('writeSessionFile creates valid JSON with correct structure', async () => {
    // Create a package.json so readSessionFile validation passes
    await writeFile(join(tempDir, 'package.json'), '{}', 'utf-8')

    await writeSessionFile(tempDir, { framework: 'next', packageManager: 'pnpm' })

    const raw = await readFile(join(tempDir, SESSION_FILENAME), 'utf-8')
    const data = JSON.parse(raw)

    expect(data.version).toBe(1)
    expect(data.framework).toBe('next')
    expect(data.packageManager).toBe('pnpm')
    expect(data.projectDir).toBe(tempDir)
    expect(typeof data.createdAt).toBe('number')
    expect(data.createdAt).toBeGreaterThan(0)
  })

  it('readSessionFile returns data within expiry window', async () => {
    await writeFile(join(tempDir, 'package.json'), '{}', 'utf-8')
    await writeSessionFile(tempDir, { framework: 'vite', packageManager: 'bun' })

    const result = await readSessionFile(tempDir)

    expect(result.framework).toBe('vite')
    expect(result.packageManager).toBe('bun')
    expect(result.projectDir).toBe(tempDir)
  })

  it('readSessionFile returns empty for expired session', async () => {
    await writeFile(join(tempDir, 'package.json'), '{}', 'utf-8')

    // Write a session with createdAt 6 minutes ago (expired)
    const expiredSession = {
      version: 1,
      framework: 'next',
      packageManager: 'pnpm',
      projectDir: tempDir,
      createdAt: Date.now() - 6 * 60 * 1000,
    }
    await writeFile(
      join(tempDir, SESSION_FILENAME),
      JSON.stringify(expiredSession, null, 2),
      'utf-8',
    )

    const result = await readSessionFile(tempDir)

    expect(result.framework).toBeUndefined()
    expect(result.packageManager).toBeUndefined()
    expect(result.projectDir).toBeUndefined()
  })

  it('readSessionFile returns empty for missing file', async () => {
    const result = await readSessionFile(tempDir)

    expect(result.framework).toBeUndefined()
    expect(result.packageManager).toBeUndefined()
    expect(result.projectDir).toBeUndefined()
  })

  it('getSessionContext prefers in-memory over file-based', async () => {
    await writeFile(join(tempDir, 'package.json'), '{}', 'utf-8')

    // Write file-based session with 'vue'
    await writeSessionFile(tempDir, { framework: 'vue', packageManager: 'npm' })

    // Set in-memory session with 'react'
    setSessionContext({ framework: 'react', packageManager: 'pnpm', projectDir: tempDir })

    // Mock process.cwd to point to tempDir for file-based fallback
    const originalCwd = process.cwd
    process.cwd = () => tempDir

    try {
      const result = await getSessionContext()
      // In-memory takes priority
      expect(result.framework).toBe('react')
      expect(result.packageManager).toBe('pnpm')
    } finally {
      process.cwd = originalCwd
    }
  })

  it('getSessionContext falls back to file when in-memory empty', async () => {
    await writeFile(join(tempDir, 'package.json'), '{}', 'utf-8')

    // Write file-based session
    await writeSessionFile(tempDir, { framework: 'astro', packageManager: 'bun' })

    // Ensure in-memory is empty
    clearSessionContext()

    // Mock process.cwd to point to tempDir
    const originalCwd = process.cwd
    process.cwd = () => tempDir

    try {
      const result = await getSessionContext()
      // Should fall back to file-based session
      expect(result.framework).toBe('astro')
      expect(result.packageManager).toBe('bun')
      expect(result.projectDir).toBe(tempDir)
    } finally {
      process.cwd = originalCwd
    }
  })

  it('writeSessionFile adds entry to .gitignore', async () => {
    await writeFile(join(tempDir, 'package.json'), '{}', 'utf-8')

    await writeSessionFile(tempDir, { framework: 'next', packageManager: 'npm' })

    const gitignore = await readFile(join(tempDir, '.gitignore'), 'utf-8')
    expect(gitignore).toContain(SESSION_FILENAME)
  })

  it('writeSessionFile does not duplicate .gitignore entry', async () => {
    await writeFile(join(tempDir, 'package.json'), '{}', 'utf-8')

    // Write twice
    await writeSessionFile(tempDir, { framework: 'next', packageManager: 'npm' })
    await writeSessionFile(tempDir, { framework: 'vite', packageManager: 'bun' })

    const gitignore = await readFile(join(tempDir, '.gitignore'), 'utf-8')
    const matches = gitignore.split('\n').filter(line => line.trim() === SESSION_FILENAME)
    expect(matches).toHaveLength(1)
  })

  it('writeSessionFile appends to existing .gitignore', async () => {
    await writeFile(join(tempDir, 'package.json'), '{}', 'utf-8')
    await writeFile(join(tempDir, '.gitignore'), 'node_modules\n', 'utf-8')

    await writeSessionFile(tempDir, { framework: 'next', packageManager: 'npm' })

    const gitignore = await readFile(join(tempDir, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('node_modules')
    expect(gitignore).toContain(SESSION_FILENAME)
  })

  it('readSessionFile returns empty for invalid JSON', async () => {
    await writeFile(join(tempDir, SESSION_FILENAME), 'not json', 'utf-8')

    const result = await readSessionFile(tempDir)
    expect(result.framework).toBeUndefined()
  })

  it('readSessionFile returns empty when projectDir has no package.json', async () => {
    // Create a session pointing to a dir without package.json
    const emptyDir = await mkdtemp(join(tmpdir(), 'tinkerise-empty-'))
    try {
      const sessionData = {
        version: 1,
        framework: 'next',
        packageManager: 'npm',
        projectDir: emptyDir,
        createdAt: Date.now(),
      }
      await writeFile(
        join(tempDir, SESSION_FILENAME),
        JSON.stringify(sessionData, null, 2),
        'utf-8',
      )

      const result = await readSessionFile(tempDir)
      expect(result.framework).toBeUndefined()
    } finally {
      await rm(emptyDir, { recursive: true, force: true })
    }
  })
})
