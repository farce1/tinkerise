import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { defineEnhancement } from '../../src/enhancements/define.js'
import { dependencyVersionMap } from '../../src/enhancements/version-map.js'
import type { EnhancementModule } from '../../src/enhancements/types.js'

/**
 * Creates a valid enhancement module for testing.
 */
function createValidModule(
  overrides: Partial<EnhancementModule> = {},
): EnhancementModule {
  return {
    id: 'test-module',
    name: 'Test Module',
    description: 'A test enhancement module',
    dependsOn: [],
    detect: async () => ({
      installed: false,
      configFiles: [],
      partial: false,
    }),
    install: async () => ({
      success: true,
      filesModified: [],
      packagesAdded: [],
      warnings: [],
    }),
    ...overrides,
  }
}

describe('defineEnhancement()', () => {
  it('validates a valid module definition and returns the same object', () => {
    const module = createValidModule()
    const result = defineEnhancement(module)

    expect(result.id).toBe('test-module')
    expect(result.name).toBe('Test Module')
    expect(result.description).toBe('A test enhancement module')
    expect(result.dependsOn).toEqual([])
    expect(typeof result.detect).toBe('function')
    expect(typeof result.install).toBe('function')
  })

  it('throws ZodError when id is missing', () => {
    const module = createValidModule()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (module as any).id

    expect(() => defineEnhancement(module)).toThrow(ZodError)
  })

  it('throws ZodError when name is missing', () => {
    const module = createValidModule()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (module as any).name

    expect(() => defineEnhancement(module)).toThrow(ZodError)
  })

  it('throws ZodError when description is missing', () => {
    const module = createValidModule()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (module as any).description

    expect(() => defineEnhancement(module)).toThrow(ZodError)
  })

  it('throws ZodError when dependsOn is missing', () => {
    const module = createValidModule()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (module as any).dependsOn

    expect(() => defineEnhancement(module)).toThrow(ZodError)
  })

  it('throws ZodError when detect is missing', () => {
    const module = createValidModule()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (module as any).detect

    expect(() => defineEnhancement(module)).toThrow(ZodError)
  })

  it('throws ZodError when install is missing', () => {
    const module = createValidModule()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (module as any).install

    expect(() => defineEnhancement(module)).toThrow(ZodError)
  })

  it('preserves detect/install functions through validation', async () => {
    const detectResult = {
      installed: true,
      configFiles: ['eslint.config.js'],
      partial: false,
      description: 'ESLint is configured',
    }
    const installResult = {
      success: true,
      filesModified: ['eslint.config.js'],
      packagesAdded: ['eslint'],
      warnings: ['Consider adding TypeScript support'],
    }

    const module = createValidModule({
      detect: async () => detectResult,
      install: async () => installResult,
    })

    const result = defineEnhancement(module)

    const ctx = {
      rootDir: '/test',
      packageManager: 'npm' as const,
      framework: null,
      packageJson: {},
      installedDeps: {},
      freshScaffold: false,
      verbose: false,
    }

    const detected = await result.detect(ctx)
    expect(detected).toEqual(detectResult)

    const installed = await result.install(ctx)
    expect(installed).toEqual(installResult)
  })

  it('accepts modules with non-empty dependsOn', () => {
    const module = createValidModule({
      dependsOn: ['eslint', 'prettier'],
    })

    const result = defineEnhancement(module)
    expect(result.dependsOn).toEqual(['eslint', 'prettier'])
  })
})

describe('dependencyVersionMap', () => {
  const expectedKeys = [
    'eslint',
    '@eslint/js',
    'typescript-eslint',
    'eslint-plugin-react',
    'eslint-plugin-vue',
    'eslint-plugin-svelte',
    'eslint-plugin-astro',
    'globals',
    'prettier',
    'prettier-plugin-tailwindcss',
    'husky',
    'lint-staged',
    'commitlint',
    '@commitlint/config-conventional',
    '@commitlint/cli',
    'vitest',
  ]

  it('contains all expected dependency keys', () => {
    const actualKeys = Object.keys(dependencyVersionMap)
    for (const key of expectedKeys) {
      expect(actualKeys).toContain(key)
    }
  })

  it('has values that are semver range strings starting with ^', () => {
    for (const [key, value] of Object.entries(dependencyVersionMap)) {
      expect(value).toMatch(/^\^/)
      // Verify it looks like a semver range: ^major.minor.patch
      expect(value).toMatch(/^\^\d+\.\d+\.\d+$/)
    }
  })

  it('has the correct number of entries', () => {
    expect(Object.keys(dependencyVersionMap)).toHaveLength(expectedKeys.length)
  })

  it('DependencyName type covers all entries (runtime check)', () => {
    // This validates that Object.keys matches the expected set,
    // proving DependencyName (keyof typeof) covers all entries
    const keys = Object.keys(dependencyVersionMap)
    expect(new Set(keys)).toEqual(new Set(expectedKeys))
  })
})
