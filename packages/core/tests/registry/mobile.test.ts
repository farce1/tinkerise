import { describe, expect, it } from 'vitest'
import {
  getAllScaffolders,
  getScaffolder,
  getScaffoldersByCategory,
} from '../../src/registry/index'
import { getScaffolderMetadata } from '../../src/registry/metadata'
import { flutterPrerequisite } from '../../src/registry/scaffolders/mobile'

describe('flutterPrerequisite helper', () => {
  it('returns command "flutter" with versionFlag "--version"', () => {
    const prereq = flutterPrerequisite('>=3.10.0')
    expect(prereq.command).toBe('flutter')
    expect(prereq.versionFlag).toBe('--version')
  })

  it('applies versionRange parameter', () => {
    const prereq = flutterPrerequisite('>=3.20.0')
    expect(prereq.versionRange).toBe('>=3.20.0')
  })

  it('has install instructions for all 3 platforms', () => {
    const prereq = flutterPrerequisite('>=3.10.0')
    expect(prereq.installInstructions).toHaveProperty('darwin')
    expect(prereq.installInstructions).toHaveProperty('linux')
    expect(prereq.installInstructions).toHaveProperty('win32')
  })
})

describe('Flutter scaffolder', () => {
  it('resolves by name with correct category and command', () => {
    const entry = getScaffolder('flutter')
    expect(entry).toBeDefined()
    expect(entry!.name).toBe('flutter')
    expect(entry!.category).toBe('mobile')
    expect(entry!.command).toBe('flutter')
  })

  it('uses flutter CLI directly, not npx', () => {
    const entry = getScaffolder('flutter')!
    expect(entry.command).toBe('flutter')
    expect(entry.command).not.toBe('npx')
  })

  it('has flutter prerequisite with versionRange >=3.10.0', () => {
    const entry = getScaffolder('flutter')!
    expect(entry.prerequisites).toHaveLength(1)
    expect(entry.prerequisites[0].command).toBe('flutter')
    expect(entry.prerequisites[0].versionRange).toBe('>=3.10.0')
  })

  it('has no dart prerequisite (Flutter bundles Dart, Pitfall 4)', () => {
    const entry = getScaffolder('flutter')!
    expect(entry.prerequisites).toHaveLength(1)
    const dartPrereq = entry.prerequisites.find(p => p.command === 'dart')
    expect(dartPrereq).toBeUndefined()
  })

  it('maps unified "platforms" to native "--platforms"', () => {
    const entry = getScaffolder('flutter')!
    const platformsFlag = entry.flags.find(f => f.unified === 'platforms')
    expect(platformsFlag).toBeDefined()
    expect(platformsFlag!.native).toBe('--platforms')
  })

  it('maps unified "no-install" to native "--no-pub"', () => {
    const entry = getScaffolder('flutter')!
    const noInstallFlag = entry.flags.find(f => f.unified === 'no-install')
    expect(noInstallFlag).toBeDefined()
    expect(noInstallFlag!.native).toBe('--no-pub')
  })

  it('uses delegate integration with "flutter create"', () => {
    const entry = getScaffolder('flutter')!
    expect(entry.integration).toEqual({ type: 'delegate', command: 'flutter create' })
  })

  it('has metadata with displayName "Flutter"', () => {
    const meta = getScaffolderMetadata('flutter')
    expect(meta).toBeDefined()
    expect(meta!.displayName).toBe('Flutter')
  })
})

describe('React Native (Expo) scaffolder', () => {
  it('resolves by name "rn" with correct category and command', () => {
    const entry = getScaffolder('rn')
    expect(entry).toBeDefined()
    expect(entry!.name).toBe('rn')
    expect(entry!.category).toBe('mobile')
    expect(entry!.command).toBe('npx')
  })

  it('name is "rn" (not "reactnative" or "react-native")', () => {
    const entry = getScaffolder('rn')!
    expect(entry.name).toBe('rn')
  })

  it('uses npx as command (Node.js ecosystem)', () => {
    const entry = getScaffolder('rn')!
    expect(entry.command).toBe('npx')
  })

  it('packageName is "create-expo-app"', () => {
    const entry = getScaffolder('rn')!
    expect(entry.packageName).toBe('create-expo-app')
  })

  it('has node prerequisite with versionRange >=18.0.0', () => {
    const entry = getScaffolder('rn')!
    expect(entry.prerequisites).toHaveLength(1)
    expect(entry.prerequisites[0].command).toBe('node')
    expect(entry.prerequisites[0].versionRange).toBe('>=18.0.0')
  })

  it('maps unified "no-install" to native "--no-install"', () => {
    const entry = getScaffolder('rn')!
    const noInstallFlag = entry.flags.find(f => f.unified === 'no-install')
    expect(noInstallFlag).toBeDefined()
    expect(noInstallFlag!.native).toBe('--no-install')
  })

  it('maps unified "typescript" to native "--template blank-typescript"', () => {
    const entry = getScaffolder('rn')!
    const tsFlag = entry.flags.find(f => f.unified === 'typescript')
    expect(tsFlag).toBeDefined()
    expect(tsFlag!.native).toBe('--template blank-typescript')
  })

  it('uses delegate integration with "create-expo-app"', () => {
    const entry = getScaffolder('rn')!
    expect(entry.integration).toEqual({ type: 'delegate', command: 'create-expo-app' })
  })

  it('has metadata with displayName "React Native (Expo)"', () => {
    const meta = getScaffolderMetadata('rn')
    expect(meta).toBeDefined()
    expect(meta!.displayName).toBe('React Native (Expo)')
  })
})

describe('cross-category completeness', () => {
  it('getScaffoldersByCategory returns correct counts per category', () => {
    expect(getScaffoldersByCategory('web')).toHaveLength(7)
    expect(getScaffoldersByCategory('backend')).toHaveLength(5)
    expect(getScaffoldersByCategory('mobile')).toHaveLength(2)
  })

  it('getAllScaffolders returns all 14 entries', () => {
    expect(getAllScaffolders()).toHaveLength(14)
  })
})
