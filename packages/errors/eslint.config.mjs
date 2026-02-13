import baseConfig from '@tooling/eslint-config';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**']
  }
];














