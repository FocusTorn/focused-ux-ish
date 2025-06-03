/* eslint-disable antfu/consistent-list-newline */


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
	'style/indent': ['warn', 'tab'],
	'style/no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
	'style/no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 0 }],
	'style/no-trailing-spaces': ['warn', { skipBlankLines: true, ignoreComments: true }],
	'style/semi': ['error', 'never'],
	'style/padded-blocks': ['error', { blocks: 'never', classes: 'always' }, { allowSingleLineBlocks: true }],
	'operator-linebreak': ['error', 'before'],
	'style/lines-between-class-members': 'off',
	'style/max-statements-per-line': 'off',
	'style/no-tabs': 'off',
	'style/spaced-comment': 'off',
	'unicorn/prefer-node-protocol': 'off', // Keep off if you prefer not to use 'node:' prefix
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
		overrides: { 'no-unused-vars': 'off', },
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

	{ name: 'focused-ui-suite/project-base-rules', //>
		rules: {
			...focusTornBaseRules,
		},
	}, //<

	{ name: 'focused-ui-suite/vscode-extensions-rules', //>
		files: ['packages/*-satellite/**/*.ts', 'apps/*-orchestrator/**/*.ts'],
		rules: {
			// e.g., 'no-restricted-imports': ['error', { paths: [{ name: 'vscode', message: "Use 'import type' for vscode or injected adapters."}]}],
		},
		languageOptions: {
			globals: { },
		},
	}, //<

	{ name: 'focused-ui-suite/test-rules', //>
		files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
		rules: {
			'ts/no-explicit-any': 'off', // Often 'any' is used more liberally in tests
			'no-console': 'off',         // Allow console.log in tests
			
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