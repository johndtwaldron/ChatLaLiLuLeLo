module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:react-native/all',
  ],
  rules: {
    // Minimal rules to avoid conflicts
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-console': 'off',
    'no-undef': 'off', // TypeScript handles this
    
    // React Native specific rules to prevent text node regressions
    'react-native/no-raw-text': 'error', // Prevent raw text in Views
    'react-native/split-platform-components': 'off', // Allow platform-specific components
    'react-native/no-inline-styles': 'off', // Allow inline styles (we use them extensively)
    'react-native/no-color-literals': 'off', // Allow color literals
    'react-native/no-unused-styles': 'warn', // Warn about unused styles
    'react-native/sort-styles': 'off', // Disable style sorting (too strict for our codebase)
    'react-native/no-single-element-style-arrays': 'off', // Allow single-element style arrays
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    'react-native/react-native': true,
  },
  globals: {
    __DEV__: 'readonly',
    globalThis: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  overrides: [
    {
      // Disable raw text rule in test files where it's common to have test strings
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
      rules: {
        'react-native/no-raw-text': 'off',
      },
    },
  ],
};
