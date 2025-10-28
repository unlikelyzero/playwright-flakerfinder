module.exports = {
  extends: ['plugin:playwright/recommended'],
  plugins: ['playwright'],
  rules: {
    // Enforce no conditional logic in tests
    'playwright/no-conditional-in-test': 'error',
    // Enforce no try-catch in tests
    'playwright/no-restricted-matchers': 'off',
    // Additional Playwright best practices
    'playwright/prefer-lowercase-title': 'error',
    'playwright/prefer-strict-equal': 'error',
    'playwright/prefer-to-be': 'error',
    'playwright/prefer-to-contain': 'error',
    'playwright/prefer-to-have-count': 'error',
    'playwright/prefer-to-have-length': 'error',
    'playwright/require-top-level-describe': 'error',
    'playwright/valid-describe-callback': 'error',
    'playwright/valid-expect': 'error',
    'playwright/valid-title': 'error',
  },
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.test.ts'],
      rules: {
        // Stricter rules for test files
        'playwright/no-conditional-in-test': 'error',
        'playwright/no-restricted-matchers': 'off',
      },
    },
  ],
};
