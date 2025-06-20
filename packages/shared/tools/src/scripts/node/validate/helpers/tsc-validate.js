// ESLint & Imports -->>

import chalk from 'chalk'
import { exec as callbackExec } from 'node:child_process'
import { promisify } from 'node:util'

//--------------------------------------------------------------------------------------------------------------<<

const exec = promisify(callbackExec)

// Regex patterns for different TSC summary lines
// const summaryPatternBase = /^Found (\d+) errors?/ // General pattern to find summary lines and extract total error count
// const sameFileRegex = /^Found (\d+) errors? in the same file, starting at: (.+?):(\d+)/
// const singleErrorRegex = /^Found 1 error in (.+?):(\d+)/
// const multiFileRegex = /^Found (\d+) errors? in (\d+) files?\.$/

export async function validateTSC() { //>
	let rawOutput = ''
	let exitCode = 0

	try {
		// --pretty is key. --noEmit is for validation-only.
		const result = await exec('npx tsc --pretty --noEmit')

		rawOutput = result.stderr + result.stdout
	}
	catch (e) {
		rawOutput = (e.stderr || '') + (e.stdout || '')
		exitCode = typeof e.code === 'number' ? e.code : 1
	}

	// Success case: TSC exited cleanly.
	if (exitCode === 0) {
		return { success: true, errorMessages: '', issueCount: 0 }
	}

	// Failure case: TSC found errors or failed to run.
	let issueCount = 0
	let errorMessages = rawOutput.trim() // Default to the full, pre-formatted output.

	// This regex will find any "Found X error(s)..." summary line, regardless of format.
	const summaryPattern = /^Found (\d+) errors?/
	const outputLines = rawOutput.trim().split(/\r?\n/)
	const summaryLine = outputLines.find(line => summaryPattern.test(line))

	if (summaryLine) {
		const match = summaryLine.match(summaryPattern)

		// We have a specific count from TSC's summary.
		issueCount = Number.parseInt(match[1], 10)
	}

	// If the process failed but we couldn't parse a count (e.g., a config error),
	// ensure we report at least one issue so it doesn't get missed.
	if (issueCount === 0) {
		issueCount = 1
	}

	// Provide a more helpful message for a common execution failure.
	if (rawOutput.includes('ENOENT')) {
		errorMessages = chalk.red('\n--- TSC Command Execution Failed ---\n')
		  + chalk.yellow('Error: Could not execute \'npx tsc\'.\n')
		  + chalk.dim('  Ensure Node.js and npm are installed correctly.')
	}

	return {
		success: false,
		errorMessages,
		issueCount,
	}
} // <
