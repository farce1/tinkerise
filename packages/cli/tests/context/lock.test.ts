/**
 * Tests for tinkerise.lock build + write.
 *
 * Verifies:
 * - buildLock derives the category from the registry per framework
 * - buildLock stamps schemaVersion/createdWith and defaults enhancements
 * - buildLock throws on an unknown framework
 * - writeLockFile emits a schema-valid file at tinkerise.lock
 * - the lock is a committed artifact (never added to .gitignore)
 */

import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LOCK_SCHEMA_VERSION, TinkeriseLockSchema, VERSION } from '@tinkerise/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildLock, LOCK_FILENAME, writeLockFile } from '../../src/context/lock.js'

describe('buildLock', () => {
  it('derives the category from the registry per framework', () => {
    expect(buildLock({ framework: 'next', flags: {}, packageManager: 'npm' }).category).toBe('web')
    expect(buildLock({ framework: 'express', flags: {}, packageManager: 'npm' }).category).toBe('backend')
    expect(buildLock({ framework: 'rn', flags: {}, packageManager: 'npm' }).category).toBe('mobile')
  })

  it('stamps schemaVersion and createdWith and defaults enhancements', () => {
    const lock = buildLock({ framework: 'next', flags: { typescript: true }, packageManager: 'pnpm' })
    expect(lock.schemaVersion).toBe(LOCK_SCHEMA_VERSION)
    expect(lock.createdWith).toBe(VERSION)
    expect(lock.enhancements).toEqual([])
    expect(lock.flags).toEqual({ typescript: true })
    expect(lock.packageManager).toBe('pnpm')
  })

  it('produces a schema-valid lock', () => {
    const lock = buildLock({ framework: 'next', flags: { typescript: true }, packageManager: 'npm' })
    expect(TinkeriseLockSchema.safeParse(lock).success).toBe(true)
  })

  it('throws on an unknown framework', () => {
    expect(() => buildLock({ framework: 'nope', flags: {}, packageManager: 'npm' })).toThrow(/nope/)
  })
})

describe('writeLockFile', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tinkerise-lock-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('writes a schema-valid file at tinkerise.lock', async () => {
    const lock = buildLock({ framework: 'next', flags: { typescript: true }, packageManager: 'bun' })
    await writeLockFile(tempDir, lock)

    const raw = await readFile(join(tempDir, LOCK_FILENAME), 'utf-8')
    expect(LOCK_FILENAME).toBe('tinkerise.lock')
    const parsed = TinkeriseLockSchema.safeParse(JSON.parse(raw))
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data).toEqual(lock)
  })

  it('does not add the lock to .gitignore (committed artifact)', async () => {
    const lock = buildLock({ framework: 'next', flags: {}, packageManager: 'npm' })
    await writeLockFile(tempDir, lock)

    expect(existsSync(join(tempDir, '.gitignore'))).toBe(false)
  })
})
