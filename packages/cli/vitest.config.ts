import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@tinkerise/cli',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/prompts/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],
  },
})
