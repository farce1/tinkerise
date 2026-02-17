import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  stylistic: {
    quotes: 'single',
    semi: false,
  },
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/.turbo/**',
    'templates/**',
  ],
})
