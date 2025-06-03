// ESLint & Imports -->>

import chalk from 'chalk'
import { exec as callbackExec } from 'node:child_process'
import { promisify } from 'node:util'
import process from 'node:process'

//--------------------------------------------------------------------------------------------------------------<<

const exec = promisify(callbackExec)

const knipCategoryTitles = {
	dependencies: 'Unused Dependencies',
	devDependencies: 'Unused DevDependencies',
	optionalPeerDependencies: 'Unused Optional Peer Dependencies',
	unlisted: 'Unlisted Dependencies',
	binaries: 'Unlisted Binaries',
	unresolved: 'Unresolved Imports',
	exports: 'Unused Exports',
	nsExports: 'Unused Namespace Exports',
	types: 'Unused Types',
	nsTypes: 'Unused Namespace Types',
	enumMembers: 'Unused Enum Members',
	classMembers: 'Unused Class Members',
	duplicates: 'Duplicate Exports/Imports',
}

export async function validateKnip() { //>
	const command = `npx knip --reporter json --no-exit-code --no-progress`
	// console.log(chalk.dim(`Executing: ${command}`)); // Moved to orchestrator

	let knipStdout = ''
	let knipStderr = ''
	let cmdExecutionExitCode = 0
	const knipReport = { files: [], issues: [] }
	let errorMessages = ''
	let issueCount = 0

	try {
		const result = await exec(command, { cwd: process.cwd() })
		knipStdout = result.stdout
		knipStderr = result.stderr
	}
	catch (error) {
		knipStdout = error.stdout || ''
		knipStderr = error.stderr || ''
		cmdExecutionExitCode = typeof error.code === 'number' ? error.code : 1
		errorMessages += chalk.red('Knip command execution failed or Knip crashed:\n')
		if (knipStdout.trim())
			errorMessages += `${chalk.yellow('Knip Stdout:')}\n${knipStdout.trim()}\n`
		if (knipStderr.trim())
			errorMessages += `${chalk.red('Knip Stderr:')}\n${knipStderr.trim()}\n`
		if (cmdExecutionExitCode !== 0)
			errorMessages += chalk.red(`Command exit code: ${cmdExecutionExitCode}\n`)
		return { success: false, errorMessages: errorMessages.trim(), issueCount: 1 }
	}

	if (knipStderr.trim()) {
		// Stderr from Knip might be informational or actual errors not caught by JSON reporter
		errorMessages += chalk.yellow('Knip reported the following on stderr (may be informational):\n')
		errorMessages += `${knipStderr.trim()}\n`
		// We won't increment issueCount here unless Knip's JSON also shows issues or stdout is empty.
	}

	try {
		if (knipStdout.trim()) {
			const parsedOutput = JSON.parse(knipStdout)
			if (typeof parsedOutput === 'object' && parsedOutput !== null) {
				knipReport.files = Array.isArray(parsedOutput.files) ? parsedOutput.files : []
				knipReport.issues = Array.isArray(parsedOutput.issues) ? parsedOutput.issues : []
			}
			else {
				errorMessages += `${chalk.red('Knip JSON output was not in the expected object format. Output:\n')}${knipStdout.trim()}\n`
				return { success: false, errorMessages: errorMessages.trim(), issueCount: issueCount || 1 }
			}
		}
		else if (cmdExecutionExitCode === 0 && !knipStderr.trim()) {
			// Successful execution, no stdout, no stderr -> means no issues by Knip
			return { success: true, errorMessages: '', issueCount: 0 }
		}
		else if (!knipStdout.trim() && knipStderr.trim()) {
			// No stdout, but stderr had content. We've already added stderr to errorMessages.
			// Consider this a failure.
			return { success: false, errorMessages: errorMessages.trim(), issueCount: issueCount || 1 }
		}
		else if (cmdExecutionExitCode !== 0) {
			errorMessages += chalk.red('Knip command may have failed without producing JSON output, despite --no-exit-code.\n')
			return { success: false, errorMessages: errorMessages.trim(), issueCount: issueCount || 1 }
		}
	}
	catch (parseError) {
		errorMessages += chalk.red('Failed to parse Knip JSON output:\n')
		if (knipStdout.trim())
			errorMessages += 'Knip Stdout:\n' + `${knipStdout.trim()}\n`
		errorMessages += 'Parse Error:\n' + `${parseError.stack || parseError.message}\n`
		return { success: false, errorMessages: errorMessages.trim(), issueCount: issueCount || 1 }
	}

	const unreferencedFilesCount = knipReport.files.length
	const issuesByTypeGlobal = {}
	let totalOtherIssuesCount = 0

	knipReport.issues.forEach((issueInFile) => {
		const filePath = issueInFile.file
		Object.keys(issueInFile).forEach((categoryKey) => {
			if (categoryKey === 'file')
				return
			const itemsInCategory = issueInFile[categoryKey]
			if (Array.isArray(itemsInCategory) && itemsInCategory.length > 0) {
				if (!issuesByTypeGlobal[categoryKey])
					issuesByTypeGlobal[categoryKey] = []
				itemsInCategory.forEach((item) => {
					issuesByTypeGlobal[categoryKey].push({ ...item, filePath })
					totalOtherIssuesCount++
				})
			}
			else if (categoryKey === 'enumMembers' && typeof itemsInCategory === 'object' && itemsInCategory !== null && Object.keys(itemsInCategory).length > 0) {
				Object.entries(itemsInCategory).forEach(([enumName, unusedMembers]) => {
					if (Array.isArray(unusedMembers) && unusedMembers.length > 0) {
						const enumCategoryKey = `enumMembers_${enumName}`
						if (!issuesByTypeGlobal[enumCategoryKey])
							issuesByTypeGlobal[enumCategoryKey] = []
						unusedMembers.forEach((member) => {
							issuesByTypeGlobal[enumCategoryKey].push({ ...member, enumName, filePath })
							totalOtherIssuesCount++
						})
					}
				})
			}
		})
	})
    
	issueCount = unreferencedFilesCount + totalOtherIssuesCount

	if (issueCount > 0) {
		let detailOutput = ''
		let firstSectionPrinted = false

		if (unreferencedFilesCount > 0) {
			if (firstSectionPrinted)
				detailOutput += '\n'
			detailOutput += chalk.yellow(`Unreferenced files (${unreferencedFilesCount}):\n`)
			knipReport.files.forEach(file => detailOutput += `  - ${file}\n`)
			firstSectionPrinted = true
		}

		if (totalOtherIssuesCount > 0) {
			Object.entries(issuesByTypeGlobal).forEach(([categoryKey, items]) => {
				if (items.length > 0) {
					if (firstSectionPrinted)
						detailOutput += '\n'
					let title = knipCategoryTitles[categoryKey] || categoryKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
					if (categoryKey.startsWith('enumMembers_')) {
						const enumName = categoryKey.split('_')[1]
						title = `Unused Enum Members in "${enumName}"`
					}
					detailOutput += chalk.yellow(`${title} (${items.length}):\n`)
					items.forEach((itemDetail) => {
						const name = itemDetail.name || (typeof itemDetail === 'string' ? itemDetail : JSON.stringify(itemDetail))
						let locationString = itemDetail.filePath
						if (itemDetail.line)
							locationString += `:${itemDetail.line}`
						if (itemDetail.col)
							locationString += `:${itemDetail.col}`
						detailOutput += `  - ${name} ${chalk.dim(`(${locationString})`)}\n`
					})
					firstSectionPrinted = true
				}
			})
		}
		errorMessages += detailOutput
	}
	// No "Knip: Validation successful..." message here

	return {
		success: issueCount === 0,
		errorMessages: errorMessages.trim(),
		issueCount,
	}
} //<
