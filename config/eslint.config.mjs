import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import prettierConfig from './prettier.config.mjs';

const tsProjects = ['./tsconfig.json', './tsconfig.node.json'];
const tsconfigRootDir = fileURLToPath(new URL('..', import.meta.url));

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'public',
      '.github',
      'refs',
      '*.config.*',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['src/**/*.{ts,tsx}', 'config/**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: tsProjects,
        tsconfigRootDir,
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: tsProjects,
        },
      },
    },
    rules: {
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      'prettier/prettier': ['error', prettierConfig],
    },
  },
  prettier,
);

