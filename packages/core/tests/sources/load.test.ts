import { describe, expect, it, vi } from 'vitest'
import { loadNpmEnhancement } from '../../src/sources/load'

function validModule() {
  return {
    id: 'biome',
    name: 'Biome',
    description: 'Biome linter/formatter',
    dependsOn: [],
    detect: async () => ({ installed: false, configFiles: [], partial: false }),
    install: async () => ({ success: true, filesModified: [], packagesAdded: [], warnings: [] }),
  }
}

describe('loadNpmEnhancement', () => {
  it('loads a module exposed as a default export', async () => {
    const mod = validModule()
    const importer = vi.fn(async () => ({ default: mod }))

    const loaded = await loadNpmEnhancement('tinkerise-enhancement-biome', importer)

    expect(importer).toHaveBeenCalledWith('tinkerise-enhancement-biome')
    expect(loaded?.id).toBe('biome')
  })

  it('loads a module exposed as named exports (no default)', async () => {
    const loaded = await loadNpmEnhancement('pkg', async () => validModule())
    expect(loaded?.id).toBe('biome')
  })

  it('returns null when the export is missing required fields', async () => {
    const loaded = await loadNpmEnhancement('pkg', async () => ({ default: { id: 'x', name: 'X' } }))
    expect(loaded).toBeNull()
  })

  it('returns null when detect/install are not functions', async () => {
    const loaded = await loadNpmEnhancement('pkg', async () => ({
      default: { id: 'x', name: 'X', description: 'd', dependsOn: [], detect: 'nope', install: 'nope' },
    }))
    expect(loaded).toBeNull()
  })

  it('returns null when the import throws', async () => {
    const loaded = await loadNpmEnhancement('pkg', async () => {
      throw new Error('not installed')
    })
    expect(loaded).toBeNull()
  })
})
