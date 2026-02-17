import { describe, expect, it } from 'vitest'
import {
  getScaffolder,
  getScaffoldersByCategory,
} from '../../src/registry/index'
import { getScaffolderMetadata } from '../../src/registry/metadata'
import { pythonPrerequisite } from '../../src/registry/scaffolders/backend'

describe('pythonPrerequisite helper', () => {
  it('returns correct command and versionFlag', () => {
    const prereq = pythonPrerequisite('>=3.10')
    expect(prereq.command).toBe('python3')
    expect(prereq.versionFlag).toBe('--version')
  })

  it('applies versionRange parameter', () => {
    const prereq = pythonPrerequisite('>=3.12')
    expect(prereq.versionRange).toBe('>=3.12')
  })

  it('has install instructions for all 3 platforms', () => {
    const prereq = pythonPrerequisite('>=3.10')
    expect(prereq.installInstructions).toHaveProperty('darwin')
    expect(prereq.installInstructions).toHaveProperty('linux')
    expect(prereq.installInstructions).toHaveProperty('win32')
  })
})

describe('FastAPI scaffolder', () => {
  it('resolves by name with correct category and command', () => {
    const entry = getScaffolder('fastapi')
    expect(entry).toBeDefined()
    expect(entry!.name).toBe('fastapi')
    expect(entry!.category).toBe('backend')
    expect(entry!.command).toBe('fastapi-admin')
    expect(entry!.packageName).toBe('fastapi-admin-cli')
  })

  it('is included in backend category', () => {
    const entries = getScaffoldersByCategory('backend')
    const names = entries.map(e => e.name)
    expect(names).toContain('fastapi')
  })

  it('has python3 prerequisite with version >=3.10', () => {
    const entry = getScaffolder('fastapi')!
    const pythonPrereq = entry.prerequisites.find(p => p.command === 'python3')
    expect(pythonPrereq).toBeDefined()
    expect(pythonPrereq!.versionRange).toBe('>=3.10')
  })

  it('has fastapi-admin tool prerequisite with pip install instructions', () => {
    const entry = getScaffolder('fastapi')!
    const toolPrereq = entry.prerequisites.find(p => p.command === 'fastapi-admin')
    expect(toolPrereq).toBeDefined()
    expect(toolPrereq!.installInstructions).toBeDefined()
    expect(toolPrereq!.installInstructions!['darwin']).toContain('pip install fastapi-admin-cli')
    expect(toolPrereq!.installInstructions!['linux']).toContain('pip install fastapi-admin-cli')
    expect(toolPrereq!.installInstructions!['win32']).toContain('pip install fastapi-admin-cli')
  })

  it('uses delegate integration with multi-word command', () => {
    const entry = getScaffolder('fastapi')!
    expect(entry.integration).toEqual({ type: 'delegate', command: 'fastapi-admin startproject' })
  })

  it('has metadata with displayName and description', () => {
    const meta = getScaffolderMetadata('fastapi')
    expect(meta).toBeDefined()
    expect(meta!.displayName).toBe('FastAPI')
    expect(meta!.description).toBeTruthy()
  })
})

describe('Django scaffolder', () => {
  it('resolves by name with correct category and command', () => {
    const entry = getScaffolder('django')
    expect(entry).toBeDefined()
    expect(entry!.name).toBe('django')
    expect(entry!.category).toBe('backend')
    expect(entry!.command).toBe('django-admin')
    expect(entry!.packageName).toBe('django')
  })

  it('is included in backend category', () => {
    const entries = getScaffoldersByCategory('backend')
    const names = entries.map(e => e.name)
    expect(names).toContain('django')
  })

  it('has python3 prerequisite with version >=3.10', () => {
    const entry = getScaffolder('django')!
    const pythonPrereq = entry.prerequisites.find(p => p.command === 'python3')
    expect(pythonPrereq).toBeDefined()
    expect(pythonPrereq!.versionRange).toBe('>=3.10')
  })

  it('has django-admin tool prerequisite with pip install instructions', () => {
    const entry = getScaffolder('django')!
    const toolPrereq = entry.prerequisites.find(p => p.command === 'django-admin')
    expect(toolPrereq).toBeDefined()
    expect(toolPrereq!.installInstructions).toBeDefined()
    expect(toolPrereq!.installInstructions!['darwin']).toContain('pip install django')
    expect(toolPrereq!.installInstructions!['linux']).toContain('pip install django')
    expect(toolPrereq!.installInstructions!['win32']).toContain('pip install django')
  })

  it('uses delegate integration with multi-word command', () => {
    const entry = getScaffolder('django')!
    expect(entry.integration).toEqual({ type: 'delegate', command: 'django-admin startproject' })
  })

  it('has metadata with displayName and description', () => {
    const meta = getScaffolderMetadata('django')
    expect(meta).toBeDefined()
    expect(meta!.displayName).toBe('Django')
    expect(meta!.description).toBeTruthy()
  })
})
