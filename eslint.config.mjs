import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/out/**",
      "dist-electron/**",
      "release/**",
      "*.config.js",
    ],
  },
  // Default TypeScript/Node config
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Browser + DOM globals for packages/core and canvas-renderer
  {
    files: ["packages/{core,canvas-renderer,test-utils}/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        console: "readonly",
        HTMLCanvasElement: "readonly",
        CanvasRenderingContext2D: "readonly",
        ImageData: "readonly",
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
  },
  // React runtime globals and rules
  {
    files: ["runtimes/react/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        console: "readonly",
        HTMLCanvasElement: "readonly",
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  // Node.js globals for Electron app and other Node environments
  {
    files: ["apps/desktop-editor/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        Buffer: "readonly",
      },
    },
  },
  // React/JSX globals for all TSX/JSX files
  {
    files: ["**/*.{tsx,jsx}"],
    languageOptions: {
      globals: {
        React: "readonly",
        JSX: "readonly",
      },
    },
  },
  // Vitest globals for test files
  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/__tests__/**"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
  },
  // Browser globals for all runtimes
  {
    files: ["runtimes/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        console: "readonly",
        HTMLCanvasElement: "readonly",
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
      },
    },
  },
];
