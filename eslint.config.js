//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    // `commercial/` is the PRIVATE commercial overlay — a separate build unit with its own toolchain,
    // merged in only at build time via the #commercial seam. Keep it out of the open-source lint surface.
    ignores: ['eslint.config.js', 'prettier.config.js', 'commercial/**'],
  },
]
