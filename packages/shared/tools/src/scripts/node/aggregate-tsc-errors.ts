// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import readline from 'node:readline'
import process from 'node:process'
import { spawn } from 'node:child_process'

//= MISC ======================================================================================================
import chalk from 'chalk'

//--------------------------------------------------------------------------------------------------------------<<

interface AggregatedError { //>
	packageName: string // Shortened name for internal logic if needed
	fullPackageNameForDisplay: string // Full name for display and width calculation
	filePath: string
	firstLineNumber: string
	errorCountInFile: number
} //<

const aggregatedErrors: AggregatedError[] = []
const packagesReportedByTurboAsFailing = new Set<string>()
let activePackageContext: string | null = null // Stores the full package name from turbo
let activeShortenedPackageContext: string | null = null // Stores the shortened package name

const packagePrefixRegex = /^(?<fullPkgName>[^:]+):check-types:\s*(?<restOfLine>.*)/
const tscIndividualErrorRegex = /^(?!Found\s+\d+\s+error)(.+?)\((\d+),(\d+)\):\s*error\s*TS\d+:\s*(.*)/
const tscErrorSummaryRegex = /^Found\s\d+\serror/
const turboPackageErrorRegex = /ERROR: command finished with error/

function shortenPackageName(fullPackageName: string): string { //>
	if (fullPackageName.startsWith('@focused-ux/')) {
		return fullPackageName.substring('@focused-ux/'.length)
	}
	return fullPackageName
} //<

function cleanFilePath(filePath: string, fullPkgNameFromTurboLine: string | null): string { //>
	let cleaned = filePath.trim()

	if (fullPkgNameFromTurboLine) {
		const prefixesToRemove = [
			`${fullPkgNameFromTurboLine}:build: `,
			`${fullPkgNameFromTurboLine}:check-types: `,
			`${fullPkgNameFromTurboLine}: `,
		]

		for (const prefix of prefixesToRemove) {
			if (cleaned.startsWith(prefix)) {
				cleaned = cleaned.substring(prefix.length)
				break
			}
		}
	}

	const genericBuildPrefixMatch = cleaned.match(/^[^:]+:(?:build|check-types):\s*(.*)/)

	if (genericBuildPrefixMatch && genericBuildPrefixMatch[1]) {
		cleaned = genericBuildPrefixMatch[1]
	}
	return cleaned.trim()
} //<

function processLine(line: string): void { //>
	const trimmedLine = line.trim()
	let contentToParse = trimmedLine
	let currentFullPkgNameFromTurbo: string | null = null

	const packagePrefixMatch = trimmedLine.match(packagePrefixRegex)

	if (packagePrefixMatch?.groups?.fullPkgName) {
		currentFullPkgNameFromTurbo = packagePrefixMatch.groups.fullPkgName
		activePackageContext = currentFullPkgNameFromTurbo
		activeShortenedPackageContext = shortenPackageName(currentFullPkgNameFromTurbo)
		contentToParse = (packagePrefixMatch.groups.restOfLine ?? '').trim()
	}

	const currentPkgForError = activeShortenedPackageContext
	const fullPkgNameForCleaning = activePackageContext

	if (!currentPkgForError) {
		return
	}

	if (turboPackageErrorRegex.test(trimmedLine)) {
		packagesReportedByTurboAsFailing.add(currentPkgForError)
		return
	}

	const individualErrorMatch = contentToParse.match(tscIndividualErrorRegex)

	if (individualErrorMatch) {
		const rawFilePath = individualErrorMatch[1]
		const lineNumber = individualErrorMatch[2]
		const contextNameToCleanPathWith = currentFullPkgNameFromTurbo || fullPkgNameForCleaning
		const finalCleanFilePath = cleanFilePath(rawFilePath, contextNameToCleanPathWith)

		const existingErrorEntry = aggregatedErrors.find(
			e => e.packageName === currentPkgForError && e.filePath === finalCleanFilePath,
		)

		if (existingErrorEntry) {
			existingErrorEntry.errorCountInFile++
		} else {
			aggregatedErrors.push({
				packageName: currentPkgForError,
				fullPackageNameForDisplay: currentFullPkgNameFromTurbo || fullPkgNameForCleaning || currentPkgForError,
				filePath: finalCleanFilePath,
				firstLineNumber: lineNumber.trim(),
				errorCountInFile: 1,
			})
		}
		packagesReportedByTurboAsFailing.delete(currentPkgForError)
		return
	}

	if (tscErrorSummaryRegex.test(contentToParse)) {
		const summaryErrorCountMatch = contentToParse.match(/^Found (\d+) error/)

		if (summaryErrorCountMatch && Number.parseInt(summaryErrorCountMatch[1], 10) > 0) {
			if (!aggregatedErrors.some(err => err.packageName === currentPkgForError)) {
				packagesReportedByTurboAsFailing.add(currentPkgForError)
			}
		}
	}
} //<

function reportResults(): void { //>
	packagesReportedByTurboAsFailing.forEach((pkgName) => {
		if (!aggregatedErrors.some(err => err.packageName === pkgName)) {
			aggregatedErrors.push({
				packageName: pkgName, // This is the shortened name
				fullPackageNameForDisplay: pkgName, // Fallback if no full name was captured
				filePath: 'Type errors found (check package logs for details)',
				firstLineNumber: '',
				errorCountInFile: 1,
			})
		}
	})

	if (aggregatedErrors.length === 0) {
		console.log(
			chalk.green(
				'\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗',
			),
		)
		console.log(chalk.green(`║ ${'TSC VALIDATION PASSED'.padEnd(100)} ║`))
		console.log(
			chalk.green(
				'╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝',
			),
		)
		console.log(chalk.green('No TypeScript errors found across packages.\n'))
		process.exit(0)
	}

	console.log(
		chalk.redBright.bold(
			'\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗',
		),
	)
	console.log(chalk.redBright.bold(`║ ${'TSC VALIDATION ISSUES FOUND'.padEnd(100)} ║`))
	console.log(
		chalk.redBright.bold(
			'╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝',
		),
	)
    
	// packages/tools/scripts/node/aggregate-tsc-errors.ts
	// pnpm run eslint packages/tools/scripts/node/aggregate-tsc-errors.ts
    
	// const errorsHeaderTitle = 'Errors'
	const packageHeaderTitle = 'Package'
	// const fileHeaderTitle = 'File'
	const columnSeparator = '  '

	// --- Column Width Calculations ---
	// Width for the "Errors" column content (e.g., " Errors" or "      1")
	const errorsColumnContentWidth = 4

	// Determine the maximum width needed for the "Package" column content
	let maxPackageNameActualLength = 0

	aggregatedErrors.forEach((err) => {
		if (err.fullPackageNameForDisplay.length > maxPackageNameActualLength) {
			maxPackageNameActualLength = err.fullPackageNameForDisplay.length
		}
	})

	// The display width for the package column is the max of its title or the longest data
	const packageColumnContentWidth = Math.max(packageHeaderTitle.length, maxPackageNameActualLength)

	// // Header Construction ----------------------------------->>

	// const errorsHeaderString = ` ${errorsHeaderTitle}` // Results in " Errors" (length 7)
	// const packageTitleString = packageHeaderTitle     // "Package" (length 7)
	// // Calculate the padding spaces needed *after* the "Package" title to fill the package column
	// const paddingForPackageHeader = ' '.repeat(packageColumnContentWidth - packageTitleString.length)

	// const headerLine =
	// 	chalk.yellow(errorsHeaderString) +
	// 	columnSeparator +
	// 	chalk.yellow(packageTitleString) +
	// 	chalk.yellow(paddingForPackageHeader) + // Apply chalk to padding for consistent coloring
	// 	columnSeparator +
	// 	chalk.yellow(fileHeaderTitle)
	// console.log(headerLine)

	// //---------------------------------------------------------------------------<<

	// --- Data Rows ---
	aggregatedErrors.sort((a, b) => {
		if (a.packageName !== b.packageName)
			return a.packageName.localeCompare(b.packageName)
		if (a.filePath !== b.filePath)
			return a.filePath.localeCompare(b.filePath)

		const lineNumA = a.firstLineNumber ? Number.parseInt(a.firstLineNumber, 10) : -1
		const lineNumB = b.firstLineNumber ? Number.parseInt(b.firstLineNumber, 10) : -1

		return lineNumA - lineNumB
	})

	aggregatedErrors.forEach((err) => {
		const errorCountDisplayString = String(err.errorCountInFile).padStart(errorsColumnContentWidth)
		const packageNameDisplayString = err.fullPackageNameForDisplay.padEnd(packageColumnContentWidth)
		const fileLocationPart = err.firstLineNumber
			? `${err.filePath}:${err.firstLineNumber}`
			: err.filePath

		const dataRow
			= errorCountDisplayString
			  + columnSeparator
			  + packageNameDisplayString
			  + columnSeparator
			  + fileLocationPart

		console.log(chalk.white(dataRow))
	})
	console.log('')
	process.exit(1)
} //<

// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                        Main execution                                        │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘

const turboArgs = ['run', 'check-types', '--continue']
const turboProcess = spawn('pnpm', ['exec', 'turbo', ...turboArgs], {
	shell: true,
	env: {
		...process.env,
		NODE_NO_WARNINGS: '1',
		FORCE_COLOR: '1',
	},
})

const rl = readline.createInterface({ //>
	input: turboProcess.stdout,
	terminal: false,
}) //<

turboProcess.stderr.on('data', (_data) => { //>
}) //<

rl.on('line', processLine)
rl.on('close', reportResults)

turboProcess.on('error', (err) => { //>
	console.error(chalk.redBright.bold('Failed to start turbo process.'), err)
	process.exit(1)
}) //<

turboProcess.on('close', (code) => { //>
	if (code !== 0 && aggregatedErrors.length === 0 && packagesReportedByTurboAsFailing.size === 0) {
		console.error(
			chalk.redBright.bold(
				`\nTurbo process exited with code ${code}, and no specific TSC errors were aggregated.`,
			),
		)
		console.error(
			chalk.redBright.bold(
				'This might indicate an issue with the turbo command or workspace configuration.',
			),
		)
		if (aggregatedErrors.length === 0)
			process.exit(code || 1)
	}
}) //<
