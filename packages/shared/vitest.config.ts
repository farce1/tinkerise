import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@tinkerise/shared',
    include: ['tests/**/*.test.ts'],
  },
})
