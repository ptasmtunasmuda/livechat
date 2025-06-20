import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        ignores: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/ssr/**',
            'tailwind.config.js',
            'resources/js/components/ui/**'
        ],
    },
    {
        files: ['resources/js/**/*.{js,ts,vue}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                process: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
            },
        },
        rules: {
            // Basic rules to keep code clean
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'no-undef': 'warn',
            'prefer-const': 'warn',
            'no-var': 'warn',
        },
    },
];
