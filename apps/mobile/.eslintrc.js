module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    // Minimal rules to avoid conflicts
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-console': 'off',
    'no-undef': 'off', // TypeScript handles this
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  globals: {
    __DEV__: 'readonly',
    globalThis: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
};
