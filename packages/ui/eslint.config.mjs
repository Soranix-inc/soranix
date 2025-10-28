import baseConfig from '@tooling/eslint-config/next.lint.js';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**/*', '*.config.js', '*.config.mjs'],
  },
];
