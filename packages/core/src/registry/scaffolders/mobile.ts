/**
 * Mobile scaffolder registry entries.
 *
 * Each entry is pure data — adding a new mobile scaffolder requires only
 * adding a defineScaffolder() call here (REG-01).
 *
 * Mobile scaffolders:
 * - Flutter uses its own CLI directly (not npx)
 * - React Native (Expo) uses npx + create-expo-app (Node.js ecosystem)
 */

import { defineScaffolder } from '@tinkerise/shared'

/** Flutter prerequisite */
export function flutterPrerequisite(versionRange: string) {
  return {
    command: 'flutter',
    versionFlag: '--version',
    versionRange,
    installInstructions: {
      darwin: 'brew install --cask flutter',
      linux: 'snap install flutter --classic  # or https://docs.flutter.dev/get-started/install',
      win32: 'winget install Google.Flutter',
    },
  }
}

/**
 * Flutter scaffolder — delegates to flutter create.
 *
 * Official Flutter CLI. Supports --platforms for target platform selection,
 * --no-pub to skip dependency install, --org for organization domain.
 *
 * Pitfall 4: Only check flutter, NOT dart separately — Flutter bundles
 * its own Dart SDK. A separate dart install can conflict.
 */
export const flutter = defineScaffolder({
  name: 'flutter',
  category: 'mobile',
  command: 'flutter',
  packageName: 'flutter',
  integration: { type: 'delegate', command: 'flutter create' },
  prerequisites: [flutterPrerequisite('>=3.10.0')],
  flags: [
    { unified: 'platforms', native: '--platforms' },
    { unified: 'no-install', native: '--no-pub' },
  ],
  passthroughArgs: true,
})

/**
 * React Native (Expo) scaffolder — delegates to create-expo-app via npx.
 *
 * Official Expo scaffolder, maintained by the Expo team.
 * Per locked decision: React Native uses 'rn' as name
 * (`tinkerise mobile rn` — universally understood abbreviation).
 */
export const reactnative = defineScaffolder({
  name: 'rn',
  category: 'mobile',
  command: 'npx',
  packageName: 'create-expo-app',
  integration: { type: 'delegate', command: 'create-expo-app' },
  prerequisites: [
    {
      command: 'node',
      versionFlag: '--version',
      versionRange: '>=18.0.0',
      installInstructions: {
        darwin: 'brew install node',
        linux: 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs',
        win32: 'winget install OpenJS.NodeJS.LTS',
      },
    },
  ],
  flags: [
    { unified: 'no-install', native: '--no-install' },
    { unified: 'typescript', native: '--template blank-typescript' },
  ],
  passthroughArgs: true,
})
