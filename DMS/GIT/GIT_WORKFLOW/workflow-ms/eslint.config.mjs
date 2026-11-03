import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Files to include
  {
    files: ["**/*.{js,mjs,cjs,ts}"], // Supports JS, MJS, CJS, and TS files
    ignores: ["node_modules", "dist", ".spec.ts"], // Ignore common directories
  },

  // Define global variables (adjusted for Node.js)
  {
    languageOptions: {
      globals: globals.node, // Use globals.node for Node.js environment
      parser: tsParser, // Use TypeScript parser
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json", // Point to your TypeScript configuration
      },
    },
  },

  // Base JavaScript rules
  pluginJs.configs.recommended,

  // TypeScript rules
  {
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },

  // Prettier integration
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error", // Enforce Prettier formatting
    },
  },

  // Custom rules
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "error",
      eqeqeq: "error",
      "default-case": "error",
      indent: ["error", 2],
      "no-mixed-spaces-and-tabs": "error",
      "no-undef": "off",
      "no-var": "error",
      "prefer-const": "error",
      "no-useless-return": "warn",
      "func-style": ["warn", "declaration"],
      "arrow-body-style": ["error", "as-needed"],
      "no-duplicate-imports": "error",
      "no-loop-func": "warn",
      "no-constant-condition": "warn",
      "no-new-wrappers": "error",
      "no-eval": "error",
      "no-new-func": "warn",
      "no-unsafe-finally": "off",
    },
  },
];
