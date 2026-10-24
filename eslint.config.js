import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      '**/dist/',
      '**/.vite/',
      'docs/.astro/',
      'docs/dist/',
      'backend/drizzle/',
      '.agents/',
      'backend/data/',
      'backend/logs/',
    ],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  // Shared rules for every TS/JS file in the repo.
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // Backend, dev scripts and root-level config files run on Node.
  {
    files: [
      'backend/src/**/*.ts',
      'scripts/**/*.mjs',
      'drizzle.config.ts',
      'vitest.config.ts',
      'eslint.config.js',
      'frontend/vite.config.ts',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },

  // React frontend.
  {
    files: ['frontend/**/*.{ts,tsx}'],
    plugins: {
      ...react.configs.flat.recommended.plugins,
      ...reactHooks.configs.flat.recommended.plugins,
    },
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.flat.recommended.rules,
    },
  },

  // Turn off stylistic rules that Prettier already owns. Must stay last.
  prettier,
);
