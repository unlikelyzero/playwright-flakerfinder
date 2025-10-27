import playwright from 'eslint-plugin-playwright';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      playwright,
      '@typescript-eslint': typescript,
    },
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Enforce no conditional logic in tests
      'playwright/no-conditional-in-test': 'error',
      // Enforce no hardcoded timeouts - use centralized timeouts from playwright.config.ts
      'playwright/no-wait-for-timeout': 'error',
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
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      // Stricter rules for test files
      'playwright/no-conditional-in-test': 'error',
    },
  },
];
