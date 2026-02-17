import { describe, expect, it, vi } from 'vitest'

// Mock which module
vi.mock('which', () => ({
  default: vi.fn(),
}))

const { default: which } = await import('which')
const { verifyPmBinary } = await import('../../src/pm/verify')

const mockedWhich = vi.mocked(which)

describe('verifyPmBinary()', () => {
  it('returns true when which resolves to a path', async () => {
    mockedWhich.mockResolvedValueOnce('/usr/local/bin/pnpm' as never)
    expect(await verifyPmBinary('pnpm')).toBe(true)
  })

  it('returns false when which returns null (nothrow mode)', async () => {
    mockedWhich.mockResolvedValueOnce(null as never)
    expect(await verifyPmBinary('yarn')).toBe(false)
  })

  it('calls which with nothrow option', async () => {
    mockedWhich.mockResolvedValueOnce('/usr/bin/npm' as never)
    await verifyPmBinary('npm')
    expect(mockedWhich).toHaveBeenCalledWith('npm', { nothrow: true })
  })
})
