// ESLint & Imports -->>

import chalk from 'chalk'
import process from 'node:process'
import { validateTSC } from './helpers/tsc-validate.js'
import { validateESLint } from './helpers/eslint-validate.js'
import { validateKnip } from './helpers/knip-validate.js'

//--------------------------------------------------------------------------------------------------------------<<

const validationResults = []

function printTaskBanner(taskName, isErrorState = false, isSingleRun = false) { //>
	const titleText = isErrorState
		? `${taskName.toUpperCase()} ISSUES FOUND`
		: `RUNNING ${taskName.toUpperCase()}`

	const title = titleText.padEnd(100)
	const line = `║ ${title} ║`
	const border = '═'.repeat(line.length - 2)
	const color = isErrorState ? chalk.redBright.bold : chalk.cyanBright.bold

	if (!isSingleRun || isErrorState) { // Only print banner for single runs if there's an error
		console.log(color(`╔${border}╗`))
		console.log(color(line))
		console.log(color(`╚${border}╝`))
	}
} //<

async function runTask(taskDefinition, isSingleRun = false) { //>
	if (!isSingleRun) {
		// For multi-run, banner is printed before loop
	}
	const result = await taskDefinition.fn()
	validationResults.push({
		name: taskDefinition.displayName,
		success: result.success,
		issueCount: result.issueCount,
	})

	if (!result.success) {
		if (isSingleRun) { // Print banner only if errors for single run
			printTaskBanner(taskDefinition.name, true, true)
		} else if (validationResults.filter(r => !r.success).length === 1 && !isSingleRun) {
			// For multi-run, print error banner only for the first failing task in the sequence
			// This avoids printing multiple "ISSUES FOUND" banners if already in an error state.
			// However, the main loop already prints a banner for each task if it fails.
			// Let's simplify: the main loop's banner logic will handle this.
		}

		if (result.errorMessages) {
			console.log(result.errorMessages)
		}
		return false // Indicate failure
	} else if (isSingleRun) {
		console.log(chalk.green(`\n${taskDefinition.displayName} PASSED.\n`))
	}
	return true // Indicate success
} //<

async function main(taskToRunKey) { //>
	console.log('\x1Bc') // Clear console
	let overallSuccess = true
	let anyErrorsPrintedForTasks = false // Tracks if any task-specific error output has been printed

	const tasks = {
		tsc: { name: 'TSC Validation', fn: validateTSC, displayName: 'TypeScript Check' },
		lint: { name: 'ESLint Validation', fn: validateESLint, displayName: 'ESLint Check' },
		deps: { name: 'Knip Validation', fn: validateKnip, displayName: 'Knip Check (Dependencies)' },
	}

	if (taskToRunKey && tasks[taskToRunKey]) {
		const taskDefinition = tasks[taskToRunKey]
		printTaskBanner(taskDefinition.name, false, true) // Initial "RUNNING" banner for single task
		const success = await runTask(taskDefinition, true)
		if (!success) {
			process.exit(1)
		}
		process.exit(0)
	} else {
		// Run all tasks
		const tasksToExecute = [tasks.tsc, tasks.lint, tasks.deps]
		for (const task of tasksToExecute) {
			// Print "RUNNING" banner for each task in a full validation run
			if (anyErrorsPrintedForTasks)
				console.log('') // Add space if previous task printed errors
			printTaskBanner(task.name, false, false)

			const success = await runTask(task)
			if (!success) {
				overallSuccess = false
				anyErrorsPrintedForTasks = true // Mark that an error was printed for this task
			} else {
				// If successful and no errors were printed by previous tasks,
				// and it's not the last task, add a small confirmation.
				// Or, always print PASSED if no errors printed yet for this task.
				if (!anyErrorsPrintedForTasks) {
					console.log(chalk.green(`${task.displayName} PASSED.`))
				}
			}
		}

		// Overall Summary
		if (anyErrorsPrintedForTasks)
			console.log('') // Space before summary if errors occurred
		const summaryTitle = `OVERALL VALIDATION STATUS`.padEnd(100)
		const summaryLine = `║ ${summaryTitle} ║`
		const summaryBorder = '═'.repeat(summaryLine.length - 2)
		console.log(chalk.blueBright.bold(`╔${summaryBorder}╗`))
		console.log(chalk.blueBright.bold(summaryLine))
		console.log(chalk.blueBright.bold(`╚${summaryBorder}╝`))

		if (validationResults.length === 0) {
			console.log(chalk.yellow('No validation tasks were run or reported results.'))
		} else {
			validationResults.forEach((result) => {
				const statusText = result.success ? chalk.green('PASSED') : chalk.red('FAILED')
				let countText = ''
				if (!result.success && result.issueCount > 0) {
					countText = chalk.dim(` (${result.issueCount} issue${result.issueCount === 1 ? '' : 's'})`)
				}
				console.log(`${chalk.white(result.name.padEnd(30))} ${statusText}${countText}`)
			})
		}

		if (!overallSuccess) {
			console.log('')
			console.log(chalk.red.bold('One or more validation tasks failed.\n'))
			process.exit(1)
		} else {
			console.log('')
			console.log(chalk.green.bold('All validations passed successfully.\n'))
			process.exit(0)
		}
	}
} //<

// Get the task key from command line arguments
const taskKeyArg = process.argv[2]

main(taskKeyArg).catch((error) => {
	console.error(chalk.red.bold('\nUnhandled error in validation orchestrator:'))
	console.error(error)
	process.exit(1)
})

// // ESLint & Imports -->>

// import chalk from 'chalk'
// import process from 'node:process'
// import { validateTSC } from './helpers/tsc-validate.js'
// import { validateESLint } from './helpers/eslint-validate.js'
// import { validateKnip } from './helpers/knip-validate.js'

// //--------------------------------------------------------------------------------------------------------------<<

// const validationResults = []

// function printTaskBanner(taskName, isErrorState = false) { //>
// 	const titleText = isErrorState
// 		? `${taskName.toUpperCase()} ISSUES FOUND`
// 		: `RUNNING ${taskName.toUpperCase()}` // Default to RUNNING if not error
	
// 	const title = titleText.padEnd(100)
// 	const line = `║ ${title} ║`
// 	const border = '═'.repeat(line.length - 2)
// 	const color = isErrorState ? chalk.redBright.bold : chalk.cyanBright.bold // Use red for error banners

// 	console.log(color(`╔${border}╗`))
// 	console.log(color(line))
// 	console.log(color(`╚${border}╝`))

// 	// Still print execution command for Knip if it's an error state for Knip
// 	if (taskName.toUpperCase() === 'KNIP VALIDATION' && isErrorState) {
        
// 		// console.log(chalk.dim(`(Knip executed with: npx knip --reporter json --no-exit-code --no-progress)`));
        
// 	}
// } //<

// async function main() { //>
// 	console.log('\x1Bc') // Clear console
// 	let overallSuccess = true
// 	let anyErrorsPrintedForTasks = false

// 	const tasksToRun = [
// 		{ name: 'TSC Validation', fn: validateTSC, displayName: 'TypeScript Check' },
// 		{ name: 'ESLint Validation', fn: validateESLint, displayName: 'ESLint Check' },
// 		{ name: 'Knip Validation', fn: validateKnip, displayName: 'Knip Check' },
// 	]

// 	for (const task of tasksToRun) {
// 		const result = await task.fn()
        
// 		validationResults.push({
// 			name: task.displayName,
// 			success: result.success,
// 			issueCount: result.issueCount,
// 		})

// 		if (!result.success) {
// 			if (anyErrorsPrintedForTasks)
// 				console.log('')
// 			printTaskBanner(task.name, true) // Pass true for isErrorState
// 			if (result.errorMessages) {
// 				console.log(result.errorMessages)
// 			}
// 			overallSuccess = false
// 			anyErrorsPrintedForTasks = true
// 		}
// 	}
    
// 	// if (anyErrorsPrintedForTasks || tasksToRun.length === 0) {
// 	//     console.log('');
// 	// }
    
// 	//= Overall Summary ================================================================================ 
// 	const summaryTitle = `OVERALL VALIDATION STATUS`.padEnd(100)
// 	const summaryLine = `║ ${summaryTitle} ║`
// 	const summaryBorder = '═'.repeat(summaryLine.length - 2)
// 	console.log(chalk.blueBright.bold(`╔${summaryBorder}╗`))
// 	console.log(chalk.blueBright.bold(summaryLine))
// 	console.log(chalk.blueBright.bold(`╚${summaryBorder}╝`))

// 	if (validationResults.length === 0) {
// 		console.log(chalk.yellow('No validation tasks were run or reported results.'))
// 	}
// 	else {
// 		validationResults.forEach((result) => {
// 			const statusText = result.success ? chalk.green('PASSED') : chalk.red('FAILED')
// 			let countText = ''
// 			if (!result.success && result.issueCount > 0) {
// 				countText = chalk.dim(` (${result.issueCount} issue${result.issueCount === 1 ? '' : 's'})`)
// 			}
// 			console.log(`${chalk.white(result.name.padEnd(30))} ${statusText}${countText}`)
// 		})
// 	}
// 	// console.log('')
    
// 	if (!overallSuccess) {
// 		console.log('')
//         console.log(chalk.red.bold('One or more validation tasks failed.\n'))
// 		process.exit(1)
// 	}
// 	else {
//         console.log('')
// 		console.log(chalk.green.bold('All validations passed successfully.\n'))
// 		process.exit(0)
// 	}
// } //<

// main().catch((error) => {
// 	console.error(chalk.red.bold('\nUnhandled error in validation orchestrator:'))
// 	console.error(error)
// 	process.exit(1)
// })
