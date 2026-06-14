import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureSourceTrusted,
  getTrustStorePath,
  isSourceTrusted,
  listTrustedSources,
  trustSource,
  untrustSource,
} from '../../src/sources/trust-store'

let tmpDir: string

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `tinkerise-trust-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(tmpDir, { recursive: true })
  vi.stubEnv('XDG_CONFIG_HOME', tmpDir)
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(tmpDir, { recursive: true, force: true })
})

describe('trust store', () => {
  it('places the store inside the config dir', () => {
    expect(getTrustStorePath()).toBe(path.join(tmpDir, 'tinkerise', 'trusted-sources.json'))
  })

  it('reports untrusted sources when the store is empty', async () => {
    expect(await isSourceTrusted('npm:foo')).toBe(false)
    expect(await listTrustedSources()).toEqual([])
  })

  it('trusts a source and persists it', async () => {
    await trustSource('npm:foo')

    expect(await isSourceTrusted('npm:foo')).toBe(true)
    const sources = await listTrustedSources()
    expect(sources.map(s => s.id)).toEqual(['npm:foo'])
    expect(typeof sources[0]!.trustedAt).toBe('string')
    expect(sources[0]!.trustedAt.length).toBeGreaterThan(0)
  })

  it('does not duplicate an already-trusted source', async () => {
    await trustSource('npm:foo')
    await trustSource('npm:foo')

    expect((await listTrustedSources()).filter(s => s.id === 'npm:foo')).toHaveLength(1)
  })

  it('untrusts a source and reports whether it was removed', async () => {
    await trustSource('npm:foo')

    expect(await untrustSource('npm:foo')).toBe(true)
    expect(await isSourceTrusted('npm:foo')).toBe(false)
    expect(await untrustSource('npm:foo')).toBe(false)
  })
})

describe('ensureSourceTrusted', () => {
  it('returns true without prompting when already trusted', async () => {
    await trustSource('npm:foo')
    const onConsent = vi.fn(async () => false)

    expect(await ensureSourceTrusted('npm:foo', onConsent)).toBe(true)
    expect(onConsent).not.toHaveBeenCalled()
  })

  it('prompts and trusts the source when consent is granted', async () => {
    const onConsent = vi.fn(async () => true)

    expect(await ensureSourceTrusted('npm:foo', onConsent)).toBe(true)
    expect(onConsent).toHaveBeenCalledWith({ id: 'npm:foo' })
    expect(await isSourceTrusted('npm:foo')).toBe(true)
  })

  it('does not trust the source when consent is denied', async () => {
    const onConsent = vi.fn(async () => false)

    expect(await ensureSourceTrusted('npm:foo', onConsent)).toBe(false)
    expect(await isSourceTrusted('npm:foo')).toBe(false)
  })
})
