// ESLint flat config for Next.js project
const prettierPlugin = require('eslint-plugin-prettier');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const importPlugin = require('eslint-plugin-import');
const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const nextPlugin = require('@next/eslint-plugin-next');

module.exports = [
    // Global ignores
    {
        ignores: [
            'node_modules/**',
            'src/generated/**',
            '.next/**',
            '.idea/**',
            'out/**',
            'build/**',
            'next-env.d.ts',
        ],
    },
    // Base config for all files
    {
        files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        plugins: {
            prettier: prettierPlugin,
            'react-hooks': reactHooksPlugin,
            import: importPlugin,
            '@typescript-eslint': typescriptEslintPlugin,
            '@next/next': nextPlugin,
        },
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            'prettier/prettier': 'error',
            'max-lines': ['error', { max: 300 }],
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        ['parent', 'sibling'],
                    ],
                    pathGroups: [
                        {
                            pattern: '@/components/**',
                            group: 'internal',
                        },
                        {
                            pattern: '@/hooks/**',
                            group: 'internal',
                        },
                        {
                            pattern: '@/lib/**',
                            group: 'internal',
                        },
                    ],
                    'newlines-between': 'always',
                },
            ],
            '@typescript-eslint/no-use-before-define': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
    // TypeScript-specific config for type-aware rules
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                project: ['./tsconfig.json'],
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        rules: {
            '@typescript-eslint/no-unnecessary-condition': 'warn',
        },
    },
];
