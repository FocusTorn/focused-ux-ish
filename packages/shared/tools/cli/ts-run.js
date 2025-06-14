#!/usr/bin/env node
// ESLint & Imports -->>

import { spawn } from 'node:child_process'
import process from 'node:process'

//--------------------------------------------------------------------------------------------------------------<<

const scriptArgs = process.argv.slice(
	2,
) // Get arguments passed to ts-run (e.g., the script path and its args)

if (scriptArgs.length === 0) {
	console.error('Error: No TypeScript file specified.')
	console.error('Usage: ts-run <path-to-typescript-file> [script-args...]')
	process.exit(1)
}

// Determine the command for pnpm.
const pnpmCommand = process.platform === 'win32' ? 'pnpm.CMD' : 'pnpm'

// Arguments for "pnpm exec ts-node ..."
// The first argument to ts-node will be the script, followed by its arguments.
const childProcessArgs = [
	'exec', // pnpm command
	'ts-node', // package binary to execute
	'--esm', // Added --esm flag for ts-node
	...scriptArgs, // script path and its arguments
]

// console.log(`Executing: ${pnpmCommand} ${childProcessArgs.join(' ')}`); // For debugging
// console.log(`CWD for ts-run: ${process.cwd()}`);

const child = spawn(pnpmCommand, childProcessArgs, {
	stdio: 'inherit',
	// shell: false is generally preferred. pnpm itself will handle finding ts-node.
	// If 'pnpm.CMD' needs a shell on Windows, this might need to be true,
	// but pnpm's shims are usually executable directly.
	shell: process.platform === 'win32', // Changed to true for Windows
	env: {
		...process.env,
		NODE_NO_WARNINGS: process.env.NODE_NO_WARNINGS || '1',
	},
})

child.on('close', (code) => {
	process.exit(code === null ? 1 : code)
})

child.on('error', (err) => {
	console.error(`Failed to start process using command "${pnpmCommand} exec ts-node ...": ${err.message}`)
	if (err.code === 'ENOENT') {
		console.error(`Hint: Ensure '${pnpmCommand}' is accessible in your PATH. This script ('ts-run') relies on 'pnpm' to execute 'ts-node'.`)
	} else if (err.code === 'EINVAL') {
		console.error(`Hint: The arguments passed via '${pnpmCommand}' might be invalid. Args: ${childProcessArgs.join(' ')}`)
	}
	process.exit(1)
})