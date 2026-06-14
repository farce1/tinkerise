import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/stack/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
})
