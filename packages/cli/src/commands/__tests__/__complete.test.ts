/**
 * Tests for the hidden `tinkerise __complete <kind>` subcommand (D-10).
 *
 * The handler emits newline-separated completion candidates to stdout
 * for the small closed set of supported kinds. Unknown kinds throw a
 * TinkeriseError with code COMPLETION_UNKNOWN_KIND so the central
 * handleError() boundary owns the rendering.
 *
 * Hidden-from-help is asserted via Commander's public `helpInformation()`
 * (NOT any private hidden-flag field) so the test survives Commander
 * minor-version upgrades. Mirrors the assertion form Plan 03 Task 2
 * uses on `tinkerise --help`.
 */

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerCompleteCommand } from '../__complete.js'

describe('__complete subcommand', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
  })

  function makeProgram(): Command {
    const program = new Command()
    program.name('tinkerise')
    program.exitOverride()
    registerCompleteCommand(program)
    return program
  }

  function collectStdout(): string {
    return stdoutSpy.mock.calls.map((args: unknown[]) => String(args[0])).join('')
  }

  it('emits the closed category set on `__complete categories`', async () => {
    await makeProgram().parseAsync(['node', 'tk', '__complete', 'categories'])
    expect(collectStdout()).toBe('web\nbackend\nmobile\n')
    // Happy path must not touch stderr.
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('emits scaffolder ids on `__complete scaffolders` (at least next + vite)', async () => {
    await makeProgram().parseAsync(['node', 'tk', '__complete', 'scaffolders'])
    const out = collectStdout()
    const ids = out.split('\n').filter(Boolean)
    expect(ids).toContain('next')
    expect(ids).toContain('vite')
    // Output ends with trailing newline.
    expect(out.endsWith('\n')).toBe(true)
  })

  it('emits only web-category scaffolders on `__complete scaffolders:web`', async () => {
    await makeProgram().parseAsync(['node', 'tk', '__complete', 'scaffolders:web'])
    const ids = collectStdout().split('\n').filter(Boolean)
    expect(ids).toContain('next')
    expect(ids).toContain('vite')
    // Backend-only scaffolders MUST NOT appear under :web.
    expect(ids).not.toContain('express')
    expect(ids).not.toContain('nest')
    expect(ids).not.toContain('django')
  })

  it('emits enhancement ids on `__complete enhancements` (at least eslint + prettier)', async () => {
    await makeProgram().parseAsync(['node', 'tk', '__complete', 'enhancements'])
    const ids = collectStdout().split('\n').filter(Boolean)
    expect(ids).toContain('eslint')
    expect(ids).toContain('prettier')
  })

  it('throws COMPLETION_UNKNOWN_KIND on unknown kind without writing to stdout', async () => {
    const program = makeProgram()
    await expect(
      program.parseAsync(['node', 'tk', '__complete', 'bogus']),
    ).rejects.toMatchObject({ code: 'COMPLETION_UNKNOWN_KIND' })
    // Error branch must NOT pollute the candidate stream.
    expect(collectStdout()).toBe('')
  })

  it('throws COMPLETION_UNKNOWN_KIND on unknown scaffolders:<category> suffix', async () => {
    const program = makeProgram()
    await expect(
      program.parseAsync(['node', 'tk', '__complete', 'scaffolders:utility']),
    ).rejects.toMatchObject({ code: 'COMPLETION_UNKNOWN_KIND' })
    expect(collectStdout()).toBe('')
  })

  it('hides __complete from --help per D-10 (public helpInformation API)', () => {
    // Stable end-state assertion: the rendered help text must not
    // mention __complete. This survives Commander upgrades because
    // it asserts the public contract (helpInformation output), not any
    // private hidden-flag field.
    const program = makeProgram()
    const help = program.helpInformation()
    expect(help).not.toContain('__complete')
  })
})
