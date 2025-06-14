#!/usr/bin/env node
// ESLint & Imports -->>

import { spawn } from 'node:child_process'
import process from 'node:process'
// import { fileURLToPath } from 'node:url'; // Not strictly needed for this simple script
// import path from 'node:path';

//--------------------------------------------------------------------------------------------------------------<<

const scriptArgs = process.argv.slice(
	2,
) // Get arguments passed to ts-run (e.g., the script path and its args)

if (scriptArgs.length === 0) {
	console.error('Error: No TypeScript file specified.')
	console.error('Usage: ts-run <path-to-typescript-file> [script-args...]')
	process.exit(1)
}

const nodeExecutable = process.execPath // Path to the current Node.js executable
const nodeImportArg = '--import=data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));'

const childProcessArgs = ['--trace-deprecation', nodeImportArg, ...scriptArgs]

const child = spawn(nodeExecutable, childProcessArgs, {
	stdio: 'inherit', // Inherit stdin, stdout, stderr from the parent process
	shell: false, // Generally safer and more direct unless shell features are needed
	// cwd: process.cwd(), // The script will run in the current working directory by default
	env: {
		...process.env, // Inherit current environment
		// NODE_NO_WARNINGS: '1', // Already handled by the calling script if needed there
	},
})

child.on('close', (code) => {
	process.exit(code === null ? 1 : code)
})

child.on('error', (err) => {
	console.error(`Failed to start underlying Node.js process for ts-run: ${err.message}`)
	process.exit(1)
})
