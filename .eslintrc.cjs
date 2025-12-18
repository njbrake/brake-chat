module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/recommended',
		'prettier'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'unused-imports'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	rules: {
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'unused-imports/no-unused-imports': 'error',
		'unused-imports/no-unused-vars': [
			'warn',
			{
				vars: 'all',
				varsIgnorePattern: '^_',
				args: 'after-used',
				argsIgnorePattern: '^_'
			}
		],
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unsafe-function-type': 'off',
		'no-constant-condition': 'off',
		'svelte/no-at-html-tags': 'off',
		'svelte/valid-compile': ['error', { ignoreWarnings: true }],
		'no-prototype-builtins': 'off',
		'@typescript-eslint/no-empty-object-type': 'off',
		'svelte/no-unused-svelte-ignore': 'off',
		'@typescript-eslint/no-unused-expressions': 'off',
		'no-empty': 'off',
		'no-unsafe-optional-chaining': 'off',
		'no-ex-assign': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		'no-useless-escape': 'off',
		'no-async-promise-executor': 'off',
		'no-control-regex': 'off',
		'prefer-const': 'off'
	},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		}
	]
};
