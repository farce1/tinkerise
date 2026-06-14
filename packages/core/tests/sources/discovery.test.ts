import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { discoverNpmSources } from '../../src/sources/discovery'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tinkerise-src-discovery-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function writePkg(pkg: unknown): Promise<void> {
  await writeFile(join(dir, 'package.json'), JSON.stringify(pkg), 'utf-8')
}

describe('discoverNpmSources', () => {
  it('finds scaffolder and enhancement packages in deps and devDeps', async () => {
    await writePkg({
      dependencies: { 'tinkerise-scaffolder-svelte': '^1.0.0', 'react': '^18' },
      devDependencies: { 'tinkerise-enhancement-biome': '^1.0.0' },
    })

    expect((await discoverNpmSources(dir)).sort()).toEqual([
      'tinkerise-enhancement-biome',
      'tinkerise-scaffolder-svelte',
    ])
  })

  it('finds scoped source packages', async () => {
    await writePkg({
      dependencies: {
        '@acme/tinkerise-scaffolder-x': '^1.0.0',
        '@acme/tinkerise-enhancement-y': '^1.0.0',
      },
    })

    expect((await discoverNpmSources(dir)).sort()).toEqual([
      '@acme/tinkerise-enhancement-y',
      '@acme/tinkerise-scaffolder-x',
    ])
  })

  it('ignores presets and unrelated packages', async () => {
    await writePkg({
      dependencies: { 'tinkerise-preset-saas': '^1.0.0', 'express': '^4' },
    })

    expect(await discoverNpmSources(dir)).toEqual([])
  })

  it('returns an empty list when package.json is missing', async () => {
    expect(await discoverNpmSources(dir)).toEqual([])
  })
})
