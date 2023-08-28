module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
    },
    'extends': [
        'plugin:lit/recommended',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    'overrides': [
        {
            'env': {
                'node': true,
            },
            'files': [
                '.eslintrc.{js,cjs}',
            ],
            'parserOptions': {
                'sourceType': 'script',
            },
        },
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module',
    },
    'plugins': [
        '@typescript-eslint',
    ],
    'rules': {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        indent: ['error', 4],
        quotes: ['error', 'single'],
        semi: 0,
        'no-extra-semi': 0,
        'comma-dangle': ['error', 'always-multiline'], // Reasoning behind using dangling commas -> https://github.com/airbnb/javascript#commas--dangling
        'no-useless-constructor': 'off', // che: Bug in rule - unless disabled makes eslint crash
        'standard/no-callback-literal': 'off', // che: useless rule
        eqeqeq: ['error', 'smart'],
        'no-return-assign': 'off',
        'prefer-promise-reject-errors': 'off',
        'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
        'space-before-function-paren': ['error', 'never'],
        '@typescript-eslint/no-unused-vars': [2, { args: 'none' }],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
    },
}