module.exports = {
  trailingComma: "es5",
  bracketSpacing: true,
  printWidth: 120,
  proseWrap: "preserve",
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  arrowParens: "always",
  overrides: [
    {
      files: "*.json",
      options: {
        singleQuote: false,
      },
    },
  ],
};
