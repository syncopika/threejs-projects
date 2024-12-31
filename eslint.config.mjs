// eslint.config.mjs
// https://github.com/eslint/eslint/issues/17400

//import js from '@eslint/js';
import html from '@html-eslint/eslint-plugin';
import parser from '@html-eslint/parser';

export default [
  {
    rules: {
      'semi': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'no-unused-vars': 'warn',
      'space-in-parens': ['error', 'never'],
    },
  },
  {
    ignores: [
      '**/node_modules/**', 
      'libs/**/*',
      'basketball/CannonDebugRenderer.js',
    ],
  },
  {
    files: ['**/*.html'],
    plugins: {
      '@html-eslint': html,
    },
    languageOptions: {
      parser,
    },
    rules: {
      '@html-eslint/indent': ['error', 2],
      '@html-eslint/require-doctype': 'error',
      //'@html-eslint/require-closing-tags': 'error',
    },
  },
];