import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
	{
		// Default ignores of eslint-config-next.
		ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts']
	},
	...nextVitals,
	...nextTs,
	{
		rules: {
			'react-hooks/set-state-in-effect': 'off',
			'react-hooks/preserve-manual-memoization': 'off',
			'react-hooks/immutability': 'off'
		}
	}
];

export default eslintConfig;
