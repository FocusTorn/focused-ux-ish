/* eslint-disable antfu/consistent-list-newline */

import seahaxWrapPlugin from '@seahax/eslint-plugin-wrap'

import { //>
	combine,
	comments,
	imports,
	javascript,
	jsdoc,
	// jsonc,
	markdown,
	node,
	// sortPackageJson,
	// sortTsconfig,
	stylistic,
	toml,
	typescript,
	unicorn,
	// vue,
	yaml,
} from '@antfu/eslint-config' //<

const focusTornBaseRules = { //>

	'comma-spacing': ['error', { before: false, after: true }],
	'no-extra-semi': 'error',
	'space-in-parens': ['warn', 'never'],
	'license-header/header': 'off',
	'license/unknown': 'off',
	'no-console': 'off',
	'no-unused-vars': 'off', // Handled by unused-imports/no-unused-vars
	'require-resolve-not-external': 'off',
	'antfu/curly': 'off',
	'style/indent': ['error', 'tab'],
	'style/no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
	'style/no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 0 }],
	'style/no-trailing-spaces': ['warn', { skipBlankLines: true, ignoreComments: true }],
	'style/semi': ['error', 'never'],

	// 'arrow-body-style': ['error', 'as-needed'],

	'style/padded-blocks': [
		'error',
		{ blocks: 'never', classes: 'always' },
		{ allowSingleLineBlocks: true },
	],
	'style/brace-style': ['error', '1tbs', { allowSingleLine: false }],
	'operator-linebreak': ['error', 'before'],
	'style/max-statements-per-line': 'off',
	'style/no-tabs': 'off',
	'style/spaced-comment': 'off',
    
	// 'style/lines-between-class-members': 'off',
	// 'style/lines-between-class-members': ['error', ''],
    
	'style/padding-line-between-statements': ['error',
        
		// { "blankLine": "always", "prev": "*", "next": ["enum", "interface", "type"] },
        
		// { "blankLine": "always", "prev": "*", "next": ["enum", "interface", "type"] },
        
		{ blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] },
		{ blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
		{ blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        
	],

	'unused-imports/no-unused-imports': 'warn', // Changed from 'off' to 'warn'
	'unused-imports/no-unused-vars': ['warn', { //>
		vars: 'all',
		varsIgnorePattern: '^_',
		args: 'after-used',
		argsIgnorePattern: '^_',
	}], //<

} //<

export default combine(

	{ ignores: [ //>
		'**/.turbo/**',
		'pnpm-lock.yaml',
		'**/node_modules/**',
		'**/coverage/**',

		'**/dist/**',
		'**/.output/**',

		'**/*.model.*/**',

		'**/*removed*/**/*',
		'**/*X_____*.*',
		'**/*X_____*/*.*',
		'**/*_____X*.*',
		'**/*_____X*/*.*',

		// Remove tsconfig.eslint.json from ignores if it was there
		// 'tsconfig.eslint.json',
	] }, //<

	comments(),
	node(),
	jsdoc(),
	imports(),
	unicorn(),
	stylistic(),
	markdown(),
	yaml(),
	toml(),
	javascript({ //>
		overrides: { 'no-unused-vars': 'off' },
	}), //<
	typescript({ //>
		stylistic: true,
		// tsconfigPath: "tsconfig.eslint.json", // REMOVED
		// tsconfigRootDir: projectRoot, // REMOVED
		// By removing tsconfigPath, @typescript-eslint/parser will look for tsconfig.json
		// in the CWD (i.e., each package directory when run via Turbo).
		project: true, // This tells the parser to find the closest tsconfig.json
		overrides: {
			'ts/no-unused-vars': 'off',
		},
	}), //<

	// seahaxWrapPlugin.config({
	//     maxLen: 100,
	//     tabWidth: 4,
	//     autoFix: true,
	//     severity: 'warn'
	// }),

	// {
	//     name: 'focused-ux/custom-formatting-tweaks',
	// 	 rules: {
	//     // For function call parentheses (e.g., of `registerCommand` and `showUserIconAssignments`):
	//     // Only force newlines for parentheses if there are many items or if it's already multiline.
	//     // 'multiline' means if arguments span multiple lines, parens will be on new lines.
	//     // Using an object with `minItems` can also work: e.g. { minItems: 3 } to not affect 1 or 2 arg calls.
	//     'style/function-paren-newline': ['warn', 'multiline-arguments'], // Changed from 'always'

	//     // For arguments within a function call:
	//     // 'consistent' means if one argument is on a new line, all must be.
	//     // This is less aggressive than 'always' for calls with few arguments that might fit on one line.
	//     'style/function-call-argument-newline': ['warn', 'consistent'], // Changed from 'always'

	//     // For the arrow function body:
	//     // This rule should correctly place the body on the next line.
	//     'style/implicit-arrow-linebreak': ['warn', 'below'], // Kept as is

	//     // Optional: Ensure consistent spacing around the arrow operator.
	//     'style/arrow-spacing': ['warn', { "before": true, "after": true }],

	//     // The rule below might be too aggressive if it's forcing the `=>` to a new line
	//     // in combination with other settings. Your base config has it as 'before'.
	//     // 'style/operator-linebreak': ['error', 'before'], // This is in your focusTornBaseRules

	//     // If the `() =>` split persists, you might experiment with this for arrow functions specifically:
	//     // 'style/operator-linebreak': ['warn', 'after', { 'overrides': { '=>': 'after' } }],

	//     // Or, if you want to specifically allow `() => body` on one line if short:
	//     // 'style/operator-linebreak': ['warn', 'after', { 'overrides': { '=>': 'ignore' } }],
	// }
	// },

	{ name: 'focused-ux/project-base-rules', //>

		rules: {

			...focusTornBaseRules,

			// '@seahax/wrap/import': ['warn', { maxLen: 100, tabWidth: 4, autoFix: true }],
			// '@seahax/wrap/export': ['warn', { maxLen: 100, tabWidth: 4, autoFix: true }],
			// '@seahax/wrap/function': ['warn', { maxLen: 100, tabWidth: 4, autoFix: true }],
			// '@seahax/wrap/object': ['warn', { maxLen: 100, tabWidth: 4, autoFix: true }],
			// '@seahax/wrap/array': ['warn', { maxLen: 100, tabWidth: 4, autoFix: true }],
			// '@seahax/wrap/ternary': ['warn', { maxLen: 100, tabWidth: 4, autoFix: true }],
			// '@seahax/wrap/union': ['warn', { maxLen: 100, tabWidth: 4, autoFix: true }],
			// '@seahax/wrap/chain': ['warn', { maxLen: 100, tabWidth: 4, autoFix: true }],

		},
		plugins: {
			'@seahax/wrap': seahaxWrapPlugin,
		},

	}, //<

	{ name: 'focused-ux/vscode-extensions-rules', //>
		files: ['packages/*-satellite/**/*.ts', 'apps/*-orchestrator/**/*.ts'],
		rules: {

		},
		languageOptions: {
			globals: { },
		},
	}, //<

	{ name: 'focused-ux/test-rules', //>
		files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
		rules: {
			'ts/no-explicit-any': 'off', // Often 'any' is used more liberally in tests
			'no-console': 'off', // Allow console.log in tests

			// Example for Vitest/Jest globals:
			// 'vitest/globals': 'error', // if using eslint-plugin-vitest
		},
		languageOptions: {
			globals: { // For Vitest/Jest like environments
				describe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				vi: 'readonly', // For Vitest
				jest: 'readonly', // For Jest
			},
		},
	}, //<

)
