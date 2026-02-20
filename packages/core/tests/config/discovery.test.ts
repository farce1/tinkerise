import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { discoverNpmPresets, loadNpmPreset } from '../../src/config/discovery'

let tmpDir: string

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `tinkerise-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(tmpDir, { recursive: true })
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

/**
 * Helper to write a package.json with given deps/devDeps.
 */
async function writePackageJson(
  dir: string,
  deps: Record<string, string> = {},
  devDeps: Record<string, string> = {},
) {
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ dependencies: deps, devDependencies: devDeps }, null, 2),
    'utf-8',
  )
}

describe('discoverNpmPresets()', () => {
  it('discovers tinkerise-preset-react-starter in dependencies', async () => {
    await writePackageJson(tmpDir, {
      'react': '^18.0.0',
      'tinkerise-preset-react-starter': '^1.0.0',
    })

    const presets = await discoverNpmPresets(tmpDir)
    expect(presets).toContain('tinkerise-preset-react-starter')
  })

  it('discovers @myorg/tinkerise-preset-saas in devDependencies', async () => {
    await writePackageJson(tmpDir, {}, {
      '@myorg/tinkerise-preset-saas': '^2.0.0',
      'vitest': '^1.0.0',
    })

    const presets = await discoverNpmPresets(tmpDir)
    expect(presets).toContain('@myorg/tinkerise-preset-saas')
  })

  it('ignores non-preset packages', async () => {
    await writePackageJson(tmpDir, {
      'react': '^18.0.0',
      'tinkerise': '^1.0.0',
      '@tinkerise/core': '^1.0.0',
    })

    const presets = await discoverNpmPresets(tmpDir)
    expect(presets).toEqual([])
  })

  it('returns empty array when no package.json exists', async () => {
    const presets = await discoverNpmPresets(tmpDir)
    expect(presets).toEqual([])
  })

  it('returns empty array when no matching deps found', async () => {
    await writePackageJson(tmpDir, {
      react: '^18.0.0',
      typescript: '^5.0.0',
    }, {
      vitest: '^1.0.0',
    })

    const presets = await discoverNpmPresets(tmpDir)
    expect(presets).toEqual([])
  })

  it('discovers presets from both dependencies and devDependencies combined', async () => {
    await writePackageJson(tmpDir, {
      'tinkerise-preset-react-starter': '^1.0.0',
    }, {
      'tinkerise-preset-dev-tools': '^1.0.0',
      '@company/tinkerise-preset-enterprise': '^3.0.0',
    })

    const presets = await discoverNpmPresets(tmpDir)
    expect(presets).toHaveLength(3)
    expect(presets).toContain('tinkerise-preset-react-starter')
    expect(presets).toContain('tinkerise-preset-dev-tools')
    expect(presets).toContain('@company/tinkerise-preset-enterprise')
  })
})

describe('loadNpmPreset()', () => {
  it('returns null for a nonexistent package name', async () => {
    const result = await loadNpmPreset('tinkerise-preset-nonexistent-pkg-xyz')
    expect(result).toBeNull()
  })
})
