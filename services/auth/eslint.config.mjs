import base from '@tooling/eslint-config/api.lint.js';

export default [
  ...base,
  {
    ignores: ['dist/**/*', '*.config.js', '*.config.mjs'],
  },
];
