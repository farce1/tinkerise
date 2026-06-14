import { describe, expect, it } from 'vitest'
import { TinkeriseLockSchema } from '../../src/lock/schema.js'
import { buildStackCommand, buildStackLock } from '../../src/stack/serialize.js'

describe('buildStackCommand', () => {
  it('builds a positional scaffold command with flags', () => {
    const cmd = buildStackCommand({
      framework: 'next',
      category: 'web',
      name: 'my-app',
      flags: ['typescript', 'tailwind'],
    })
    expect(cmd.scaffold).toBe('tinkerise web next my-app --typescript --tailwind')
    expect(cmd.add).toBeUndefined()
  })

  it('emits a follow-up add command for enhancements', () => {
    const cmd = buildStackCommand({
      framework: 'next',
      category: 'web',
      name: 'my-app',
      flags: ['typescript'],
      enhancements: ['eslint', 'prettier'],
    })
    expect(cmd.scaffold).toBe('tinkerise web next my-app --typescript')
    expect(cmd.add).toBe('tinkerise add eslint prettier')
  })

  it('omits the name and flags when not provided', () => {
    const cmd = buildStackCommand({ framework: 'vite', category: 'web' })
    expect(cmd.scaffold).toBe('tinkerise web vite')
    expect(cmd.add).toBeUndefined()
  })

  it('honors a custom program name for the tk alias', () => {
    const cmd = buildStackCommand(
      { framework: 'next', category: 'web', name: 'app', enhancements: ['eslint'] },
      'tk',
    )
    expect(cmd.scaffold).toBe('tk web next app')
    expect(cmd.add).toBe('tk add eslint')
  })
})

describe('buildStackLock', () => {
  const opts = { version: '1.2.3', packageManager: 'pnpm' }

  it('builds a schema-valid lock with mapped flags and enhancements', () => {
    const lock = buildStackLock(
      { framework: 'next', category: 'web', flags: ['typescript', 'tailwind'], enhancements: ['eslint', 'prettier'] },
      opts,
    )
    expect(TinkeriseLockSchema.safeParse(lock).success).toBe(true)
    expect(lock.framework).toBe('next')
    expect(lock.category).toBe('web')
    expect(lock.flags).toEqual({ typescript: true, tailwind: true })
    expect(lock.enhancements).toEqual([
      { id: 'eslint', version: null },
      { id: 'prettier', version: null },
    ])
    expect(lock.packageManager).toBe('pnpm')
    expect(lock.createdWith).toBe('1.2.3')
  })

  it('produces empty flags and enhancements when none are selected', () => {
    const lock = buildStackLock({ framework: 'go', category: 'backend' }, opts)
    expect(TinkeriseLockSchema.safeParse(lock).success).toBe(true)
    expect(lock.flags).toEqual({})
    expect(lock.enhancements).toEqual([])
  })
})
