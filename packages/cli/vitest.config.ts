import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@tinkerise/cli',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/utils/**/*.test.ts',
      'tests/commands/**/*.test.ts',
      'tests/prompts/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/e2e/**/*.test.ts',
    ],
  },
})
