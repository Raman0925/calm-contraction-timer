// SPDX-License-Identifier: Apache-2.0
import reactNativeConfig from '@react-native/eslint-config/flat';
import tseslint from 'typescript-eslint';

// The Flow block targets Flow-typed JS; this project has none and its plugin breaks on ESLint 9.
const reactNativeBlocks = reactNativeConfig.filter(block => !block.plugins?.['ft-flow']);

const HEX_COLOUR = '/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/';
const FUNCTIONAL_COLOUR = '/^(rgb|rgba|hsl|hsla)\\(/';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'android/', 'coverage/', '.bundle/', 'src/core/db/migrations/'],
  },
  ...reactNativeBlocks,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'react-native/no-color-literals': 'error',
      'react-native/no-inline-styles': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // Paper components take render props such as List.Item's `right`.
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    },
  },
  {
    // Raw colours and direct Paper imports are allowed only inside the design system.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/core/design/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=${HEX_COLOUR}]`,
          message: 'Use a theme colour from useAppTheme() instead of a raw colour.',
        },
        {
          selector: `Literal[value=${FUNCTIONAL_COLOUR}]`,
          message: 'Use a theme colour from useAppTheme() instead of a raw colour.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native-paper',
              message: 'Import components from @core/design instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
