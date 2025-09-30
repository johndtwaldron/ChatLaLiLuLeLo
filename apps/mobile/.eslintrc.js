module.exports = {
  extends: ['expo', '@react-native'],
  rules: {
    // Allow unused vars that start with underscore
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Prefer const assertions over generic parameters
    'prefer-const': 'error',
  },
};
