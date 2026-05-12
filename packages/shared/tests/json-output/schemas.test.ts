import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ErrorPayloadSchema, makeEnvelope } from '../../src/json-output/envelope.js'

describe('errorPayloadSchema', () => {
  it('parses a valid error payload', () => {
    const payload = ErrorPayloadSchema.parse({
      code: 'PRESET_NOT_FOUND',
      message: 'preset xyz not found',
    })

    expect(payload.code).toBe('PRESET_NOT_FOUND')
    expect(payload.message).toBe('preset xyz not found')
  })

  it('rejects a payload missing message', () => {
    expect(() => ErrorPayloadSchema.parse({ code: 'X' })).toThrow()
  })

  it('rejects a payload missing code', () => {
    expect(() => ErrorPayloadSchema.parse({ message: 'x' })).toThrow()
  })
})

describe('makeEnvelope', () => {
  const schema = makeEnvelope('list', z.object({ x: z.number() }))

  it('accepts the success variant with matching command literal and schemaVersion', () => {
    const result = schema.parse({
      schemaVersion: 1,
      command: 'list',
      data: { x: 1 },
    })

    expect(result).toEqual({ schemaVersion: 1, command: 'list', data: { x: 1 } })
  })

  it('accepts the error variant', () => {
    const result = schema.parse({
      schemaVersion: 1,
      command: 'list',
      error: { code: 'X', message: 'y' },
    })

    expect('error' in result && result.error.code).toBe('X')
  })

  it('rejects the wrong schemaVersion (literal mismatch)', () => {
    const result = schema.safeParse({
      schemaVersion: 2,
      command: 'list',
      data: { x: 1 },
    })

    expect(result.success).toBe(false)
  })

  it('rejects the wrong command literal', () => {
    const result = schema.safeParse({
      schemaVersion: 1,
      command: 'doctor',
      data: { x: 1 },
    })

    expect(result.success).toBe(false)
  })

  it('rejects mixed data + error (mutual exclusion per D-05)', () => {
    const result = schema.safeParse({
      schemaVersion: 1,
      command: 'list',
      data: { x: 1 },
      error: { code: 'X', message: 'y' },
    })

    expect(result.success).toBe(false)
  })

  it('supports overriding schemaVersion', () => {
    const v2Schema = makeEnvelope('list', z.object({ x: z.number() }), 2)

    expect(v2Schema.safeParse({ schemaVersion: 2, command: 'list', data: { x: 1 } }).success).toBe(true)
    expect(v2Schema.safeParse({ schemaVersion: 1, command: 'list', data: { x: 1 } }).success).toBe(false)
  })
})
