// eslint.config.mjs
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-plugin-next";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";



export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.stylisticTypeChecked,
  {
    extends: [...tseslint.configs.strictTypeChecked],
    files: ["**/*.{ts,tsx}"],

    plugins: {
      next,
      react,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "react/jsx-no-comment-textnodes": "warn",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-target-blank": "error",
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
      ...reactHooks.configs["recommended-latest"].rules,
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  }
);
