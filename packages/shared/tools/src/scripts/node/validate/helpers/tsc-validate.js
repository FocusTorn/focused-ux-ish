// ESLint & Imports -->>

import chalk from 'chalk'
import { exec as callbackExec } from 'node:child_process'
import { promisify } from 'node:util'

//--------------------------------------------------------------------------------------------------------------<<

const exec = promisify(callbackExec)

// Regex patterns for different TSC summary lines
const summaryPatternBase = /^Found (\d+) errors?/ // General pattern to find summary lines and extract total error count
const sameFileRegex = /^Found (\d+) errors? in the same file, starting at: (.+?):(\d+)/
const singleErrorRegex = /^Found 1 error in (.+?):(\d+)/
const multiFileRegex = /^Found (\d+) errors? in (\d+) files?\.$/

export async function validateTSC() { //>
	let rawOutput = ''
	let exitCode = 0
	let errorMessages = ''
	let issueCount = 0 // This will be the overall issue count from TSC's summary

	try {
		const result = await exec('npx tsc --pretty --noEmit') // --noEmit is important
		rawOutput = result.stderr + result.stdout
		// exitCode remains 0 if successful
	} catch (e) {
		rawOutput = (e.stderr || '') + (e.stdout || '')
		exitCode = typeof e.code === 'number' ? e.code : 1
	}

	const outputLines = rawOutput.trim().split(/\r?\n/)
	
	let summaryLineText = ''
	let summaryLineIndex = -1

	for (let i = 0; i < outputLines.length; i++) {
		if (summaryPatternBase.test(outputLines[i])) {
			summaryLineText = outputLines[i]
			summaryLineIndex = i
			const baseMatch = summaryLineText.match(summaryPatternBase)
			if (baseMatch && baseMatch[1]) {
				issueCount = Number.parseInt(baseMatch[1], 10)
			}
			break // Found the primary summary line
		}
	}
	if (summaryLineText === '' && outputLines.some(line => line.startsWith('Found 0 errors.'))) {
		summaryLineText = 'Found 0 errors.'
		issueCount = 0
	}
    
	if (exitCode !== 0 && !summaryLineText && issueCount === 0) { // Handles exec errors where TSC might not have run or summarized
		if (rawOutput.includes('ENOENT')) {
			errorMessages = chalk.red('\n--- TSC Command Execution Failed ---\n')
			  + chalk.yellow('Error: Could not execute \'npx tsc\'.\n')
			  + chalk.dim('  Ensure Node.js and npm are installed correctly.\n')
			if (rawOutput.trim()) {
				errorMessages += chalk.dim(`  System error details: ${rawOutput.trim()}\n`)
			}
			issueCount = 1 // Count as at least one issue for reporting
		} else {
			errorMessages = `${chalk.red(`\n--- TSC Execution Problem (Exited with code ${exitCode}) ---\n`)
			}${rawOutput.trim()}\n`
			issueCount = 1 // Count as at least one issue for reporting
		}
	} else if (issueCount > 0 && summaryLineText) {
		// Errors were found, and we have a summary line from TSC.
		let formattedSummary = ''
		const tableContentLines = []

		const sameFileMatch = summaryLineText.match(sameFileRegex)
		const singleErrorMatch = summaryLineText.match(singleErrorRegex)
		const multiFileMatch = summaryLineText.match(multiFileRegex)

		if (sameFileMatch) {
			const errorCount = sameFileMatch[1]
			const filePath = sameFileMatch[2]
			const lineNumber = sameFileMatch[3]
			const plural = errorCount === '1' ? '' : 's'
			
			formattedSummary = chalk.yellow(`TSC found ${errorCount} error${plural} in 1 file.\n`)
			tableContentLines.push(chalk.white('Errors  Files'))
			const countStr = String(errorCount).padStart(5, ' ')
			tableContentLines.push(chalk.white(`${countStr}  ${filePath}:${lineNumber}`))
		} else if (singleErrorMatch) {
			const filePath = singleErrorMatch[1]
			const lineNumber = singleErrorMatch[2]
			
			formattedSummary = chalk.yellow(`TSC found 1 error in 1 file.\n`)
			tableContentLines.push(chalk.white('Errors  Files'))
			tableContentLines.push(chalk.white(`     1  ${filePath}:${lineNumber}`))
		} else if (multiFileMatch) {
			// For "Found X errors in Y files."
			formattedSummary = chalk.yellow(`${summaryLineText.trim()}\n`)
			// The actual "Errors Files" table is printed by tsc --pretty *after* this summary.
			if (summaryLineIndex !== -1 && outputLines.length > summaryLineIndex + 1) {
				for (let i = summaryLineIndex + 1; i < outputLines.length; i++) {
					if (outputLines[i].trim() !== '') { // Add non-empty lines
						tableContentLines.push(chalk.white(outputLines[i]))
					}
				}
			}
		} else {
			// Fallback for other summary lines if errors are indicated but not matching specific formats
			// This might include generic error messages from tsc not fitting the patterns.
			formattedSummary = chalk.yellow(`${summaryLineText.trim()}\n`)
			// Add lines before the summary as potential details, if they exist and aren't empty
			if (summaryLineIndex > 0) {
				for (let i = 0; i < summaryLineIndex; i++) {
					if (outputLines[i].trim() !== '' && !outputLines[i].startsWith('Watching for file changes.')) {
						tableContentLines.push(chalk.white(outputLines[i]))
					}
				}
			}
		}
		errorMessages = formattedSummary + tableContentLines.join(
			'\n',
		) + (tableContentLines.length > 0 ? '\n' : '')
	}
	// If issueCount is 0 and exitCode is 0, errorMessages remains empty, indicating success.
	// The run-validations.mjs script will handle printing the "PASSED" status.

	return {
		success: issueCount === 0 && exitCode === 0,
		errorMessages: errorMessages.trim(),
		issueCount, // This is the total issueCount from TSC's summary or 1 for execution errors
	}
} //<
