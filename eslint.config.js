import js from "@eslint/js";
import importPlugin from "eslint-plugin-import-x";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js, mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      "no-console": "warn",
      "import/no-unresolved": "error",
    },
  },
  eslintConfigPrettier,
];
