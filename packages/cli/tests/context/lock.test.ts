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
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LOCK_SCHEMA_VERSION, TinkeriseLockSchema, VERSION } from '@tinkerise/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildLock, LOCK_FILENAME, readLockFile, recordEnhancements, writeLockFile } from '../../src/context/lock.js'

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

describe('readLockFile', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tinkerise-lock-read-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('returns the parsed lock when present and valid', async () => {
    const lock = buildLock({ framework: 'next', flags: { typescript: true }, packageManager: 'pnpm' })
    await writeLockFile(tempDir, lock)

    expect(await readLockFile(tempDir)).toEqual(lock)
  })

  it('returns null when the file is missing', async () => {
    expect(await readLockFile(tempDir)).toBeNull()
  })

  it('returns null for invalid JSON', async () => {
    await writeFile(join(tempDir, LOCK_FILENAME), 'not json', 'utf-8')
    expect(await readLockFile(tempDir)).toBeNull()
  })

  it('returns null when content fails schema validation', async () => {
    await writeFile(join(tempDir, LOCK_FILENAME), JSON.stringify({ schemaVersion: 1 }), 'utf-8')
    expect(await readLockFile(tempDir)).toBeNull()
  })
})

describe('recordEnhancements', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tinkerise-lock-enh-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('appends new enhancements with a null version', async () => {
    await writeLockFile(tempDir, buildLock({ framework: 'next', flags: {}, packageManager: 'npm' }))

    await recordEnhancements(tempDir, ['eslint', 'prettier'])

    const lock = await readLockFile(tempDir)
    expect(lock?.enhancements).toEqual([
      { id: 'eslint', version: null },
      { id: 'prettier', version: null },
    ])
  })

  it('does not duplicate enhancements already recorded', async () => {
    await writeLockFile(tempDir, buildLock({ framework: 'next', flags: {}, packageManager: 'npm' }))

    await recordEnhancements(tempDir, ['eslint'])
    await recordEnhancements(tempDir, ['eslint', 'husky'])

    const lock = await readLockFile(tempDir)
    expect(lock?.enhancements.map(e => e.id)).toEqual(['eslint', 'husky'])
  })

  it('is a no-op when no lock file exists', async () => {
    await recordEnhancements(tempDir, ['eslint'])
    expect(existsSync(join(tempDir, LOCK_FILENAME))).toBe(false)
  })
})
