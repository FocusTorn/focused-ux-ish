// build/ESBuild/esbuild.test.config.js
import esbuild from 'esbuild'

import process from 'process'

const isProduction = process.argv.includes('--production')

const config = {
	entryPoints: ['src/test/**/*.ts'],
	outdir: 'dist/test',
	bundle: true,
	platform: 'node',
	format: 'esm',
	sourcemap: true,
	plugins: [],
	logLevel: 'info',
	external: ['vscode'],
	minify: isProduction,
	metafile: true,
}

if (process.argv.includes('--watch')) {
	config.watch = {
		onRebuild(error, result) {
			if (error) {
				console.error('watch build failed:', error)
			}
			else {
				console.log('watch build succeeded:', result)
			}
		},
	}
}

if (process.argv.includes('--test')) {
	config.entryPoints = ['src/test/profile_target.ts']
	config.outdir = 'dist/test/mockProjectWorkspace'
}

esbuild.build(config).catch(() => process.exit(1))
