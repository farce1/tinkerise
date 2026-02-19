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
  rules: {
    // process is always globally available in Node.js/Bun CLI context
    'node/prefer-global/process': 'off',
    // CLI tool uses console for user-facing output (tinkeriseLog, printTemplateSummary)
    'no-console': 'off',
  },
})
