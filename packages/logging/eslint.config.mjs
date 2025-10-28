import baseConfig from '@tooling/eslint-config/api.lint.js';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**/*', '*.config.js', '*.config.mjs'],
  },
];
