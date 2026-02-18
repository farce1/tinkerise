import { describe, expect, it } from 'vitest'
import { mergeConfigChain } from '../../src/config/merge'
import type { TinkeriseUserConfig } from '@tinkerise/shared'

describe('mergeConfigChain()', () => {
  it('returns empty object when called with no arguments', () => {
    expect(mergeConfigChain()).toEqual({})
  })

  it('returns empty object when all layers are null/undefined', () => {
    expect(mergeConfigChain(null, undefined, null)).toEqual({})
  })

  it('returns the single layer when only one is defined', () => {
    const layer: Partial<TinkeriseUserConfig> = { packageManager: 'pnpm' }

    expect(mergeConfigChain(layer)).toEqual({ packageManager: 'pnpm' })
  })

  it('returns single defined layer when others are null/undefined', () => {
    const layer: Partial<TinkeriseUserConfig> = { typescript: true }

    expect(mergeConfigChain(null, layer, undefined)).toEqual({ typescript: true })
  })

  it('second layer overrides first for same keys', () => {
    const first: Partial<TinkeriseUserConfig> = { packageManager: 'npm' }
    const second: Partial<TinkeriseUserConfig> = { packageManager: 'pnpm' }

    expect(mergeConfigChain(first, second)).toEqual({ packageManager: 'pnpm' })
  })

  it('merges non-overlapping keys from both layers', () => {
    const first: Partial<TinkeriseUserConfig> = { packageManager: 'npm' }
    const second: Partial<TinkeriseUserConfig> = { typescript: true }

    expect(mergeConfigChain(first, second)).toEqual({
      packageManager: 'npm',
      typescript: true,
    })
  })

  it('third layer (CLI flags) overrides all previous layers', () => {
    const global: Partial<TinkeriseUserConfig> = {
      packageManager: 'npm',
      typescript: false,
      defaultCategory: 'web',
    }
    const project: Partial<TinkeriseUserConfig> = {
      packageManager: 'pnpm',
      typescript: true,
    }
    const cliFlags: Partial<TinkeriseUserConfig> = {
      packageManager: 'bun',
    }

    const result = mergeConfigChain(global, project, cliFlags)

    expect(result).toEqual({
      packageManager: 'bun',
      typescript: true,
      defaultCategory: 'web',
    })
  })

  it('filters out null and undefined layers correctly', () => {
    const global: Partial<TinkeriseUserConfig> = { defaultCategory: 'backend' }
    const cliFlags: Partial<TinkeriseUserConfig> = { typescript: true }

    const result = mergeConfigChain(global, null, undefined, cliFlags)

    expect(result).toEqual({
      defaultCategory: 'backend',
      typescript: true,
    })
  })

  it('full three-layer merge: CLI > project > global', () => {
    const global: Partial<TinkeriseUserConfig> = {
      packageManager: 'npm',
      typescript: false,
      defaultCategory: 'web',
    }
    const project: Partial<TinkeriseUserConfig> = {
      packageManager: 'pnpm',
      defaultCategory: 'backend',
    }
    const cli: Partial<TinkeriseUserConfig> = {
      defaultCategory: 'mobile',
    }

    const result = mergeConfigChain(global, project, cli)

    expect(result).toEqual({
      packageManager: 'pnpm', // project overrides global
      typescript: false, // global value (not overridden)
      defaultCategory: 'mobile', // CLI overrides everything
    })
  })

  it('handles empty objects as layers', () => {
    const global: Partial<TinkeriseUserConfig> = { packageManager: 'yarn' }

    expect(mergeConfigChain(global, {})).toEqual({ packageManager: 'yarn' })
  })

  it('returns reference to single layer (no unnecessary clone)', () => {
    const layer: Partial<TinkeriseUserConfig> = { typescript: true }
    const result = mergeConfigChain(layer)

    expect(result).toBe(layer)
  })
})
