import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@tinkerise/core',
    include: [
      'tests/**/*.test.ts',
      'src/**/__tests__/**/*.test.ts',
    ],
  },
})
