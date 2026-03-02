import { defineScaffolder } from '@tinkerise/shared'
import { describe, expect, it } from 'vitest'
import { buildCommandArgs, executeScaffolder, ScaffolderNotFoundError } from '../../src/executor/index'

/** Test entry for buildCommandArgs */
const delegateEntry = defineScaffolder({
  name: 'test-delegate',
  category: 'web',
  command: 'npx',
  packageName: 'create-test',
  integration: { type: 'delegate', command: 'create-test' },
})

const wrapEntry = defineScaffolder({
  name: 'test-wrap',
  category: 'web',
  command: 'npx',
  packageName: 'create-wrap',
  integration: { type: 'wrap', command: 'wrap-tool' },
})

const templateEntry = defineScaffolder({
  name: 'test-template',
  category: 'utility',
  command: 'npx',
  packageName: 'create-template',
  integration: { type: 'template', templateDir: './templates/test' },
})

describe('buildCommandArgs()', () => {
  it('delegate strategy: [command, projectName, ...flags]', () => {
    const args = buildCommandArgs(delegateEntry, 'my-app', ['--typescript'], [])
    expect(args).toEqual(['create-test', 'my-app', '--typescript'])
  })

  it('wrap strategy: [command, projectName, ...flags]', () => {
    const args = buildCommandArgs(wrapEntry, 'my-app', ['--ts'], [])
    expect(args).toEqual(['wrap-tool', 'my-app', '--ts'])
  })

  it('template strategy: [projectName, ...flags]', () => {
    const args = buildCommandArgs(templateEntry, 'my-app', [], [])
    expect(args).toEqual(['my-app'])
  })

  it('appends passthrough args after -- separator', () => {
    const args = buildCommandArgs(delegateEntry, 'my-app', ['--ts'], ['--experimental'])
    expect(args).toEqual(['create-test', 'my-app', '--ts', '--', '--experimental'])
  })

  it('no -- separator when passthrough args are empty', () => {
    const args = buildCommandArgs(delegateEntry, 'my-app', ['--ts'], [])
    expect(args).not.toContain('--')
  })
})

describe('scaffolderNotFoundError', () => {
  it('includes scaffolder name in message', () => {
    const error = new ScaffolderNotFoundError('nonexistent')
    expect(error.message).toContain('nonexistent')
    expect(error.name).toBe('ScaffolderNotFoundError')
  })
})

describe('executeScaffolder() input validation', () => {
  it('rejects unsafe project names before scaffolder lookup/execution', async () => {
    await expect(
      executeScaffolder({
        scaffolderName: 'next',
        projectName: '../outside',
        userFlags: {},
      }),
    ).rejects.toThrow('Invalid value')
  })
})
