// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import readline from 'node:readline'
import process from 'node:process'
import { spawn } from 'node:child_process'
import path from 'node:path'

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
const packageRootPathMap = new Map<string, string>()

let activeFullPackageContext: string | null = null
let activeShortenedPackageContext: string | null = null

const packagePrefixRegex = /^(?<fullPkgName>[^:]+):check-types:(\s*(?<restOfLine>.*))?$/
const packageCwdRegex = /^>\s*(?<pkgNameVer>[@\w/-]+(?:@[\w.-]+)?)\s+[\w:]+\s+(?<cwdPath>.+)$/
const tscIndividualErrorRegex = /^(?!Found\s+\d+\s+errors?)(?<filePath>.*?):(?<line>\d+):(?<column>\d+)\s+-\s+(?<errorType>error|warning)\s+(?<errorCode>TS\d+):\s+(?<message>.*)/i
const tscErrorSummaryRegex = /^Found\s\d+\serrors?/
const turboPackageErrorRegex = /ERROR: command finished with error/

function stripAnsiCodes(str: string): string { //>
	if (!str)
		return ''

	const ansiRegexPattern = `[${String.fromCharCode(0x1B)}${String.fromCharCode(0x9B)}]\\[[()#;?]?[0-9]{1,4}(?:;[0-9]{0,4})*[0-9A-ORZcf-nqry=><]`
	const ansiRegex = new RegExp(ansiRegexPattern, 'g')

	return str.replace(ansiRegex, '')
} //<

function shortenPackageName(fullPackageName: string): string { //>
	if (fullPackageName.startsWith('@focused-ux/')) {
		return fullPackageName.substring('@focused-ux/'.length)
	}
	return fullPackageName
} //<

function cleanFilePath(absolutePathFromTool: string, monorepoRoot: string): string { //>
	const normalizedPath = path.normalize(absolutePathFromTool).replace(/\\/g, '/')
	const normalizedMonorepoPackagesPath = path.normalize(path.join(monorepoRoot, 'packages')).replace(/\\/g, '/')

	if (normalizedPath.startsWith(`${normalizedMonorepoPackagesPath}/`)) {
		return normalizedPath.substring((`${normalizedMonorepoPackagesPath}/`).length)
	}

	const normalizedMonorepoRoot = path.normalize(monorepoRoot).replace(/\\/g, '/')

	if (normalizedPath.startsWith(`${normalizedMonorepoRoot}/`)) {
		return normalizedPath.substring((`${normalizedMonorepoRoot}/`).length)
	}
	return absolutePathFromTool
} //<

function processLine(line: string): void { //>
	const originalLineForDebug = line
	const lineCleanedOfAnsi = stripAnsiCodes(originalLineForDebug)
	const baseTrimmedLine = lineCleanedOfAnsi.trim()

	let contentToParse = baseTrimmedLine
	let lineHadPackagePrefix = false

	const packagePrefixMatch = baseTrimmedLine.match(packagePrefixRegex)

	if (packagePrefixMatch?.groups?.fullPkgName) {
		lineHadPackagePrefix = true

		const newFullPkgName = packagePrefixMatch.groups.fullPkgName

		activeFullPackageContext = newFullPkgName
		activeShortenedPackageContext = shortenPackageName(activeFullPackageContext)
		contentToParse = (packagePrefixMatch.groups.restOfLine ?? '').trim()
	}

	const currentPkgFullNameKey = activeFullPackageContext
	const currentPkgShortNameForError = activeShortenedPackageContext
	const monorepoRoot = process.cwd()

	const cwdMatch = baseTrimmedLine.match(packageCwdRegex)

	if (cwdMatch) {
		const pkgNameWithVersion = cwdMatch.groups?.pkgNameVer?.trim()
		const capturedCwd = cwdMatch.groups?.cwdPath?.trim()

		if (pkgNameWithVersion && capturedCwd) {
			const normalizedPkgNameKeyForMap = pkgNameWithVersion.replace(/@[\w.-]+$/, '')

			packageRootPathMap.set(normalizedPkgNameKeyForMap, capturedCwd)
			return
		}
	}

	if (!currentPkgFullNameKey || !currentPkgShortNameForError) {
		return
	}

	if (lineHadPackagePrefix && contentToParse === '') {
		return
	}

	if (turboPackageErrorRegex.test(baseTrimmedLine)) {
		packagesReportedByTurboAsFailing.add(currentPkgShortNameForError)
		return
	}

	const individualErrorMatch = contentToParse.match(tscIndividualErrorRegex)

	if (individualErrorMatch?.groups) {
		const { filePath: tscPathReportedByTool, line: lineNumber } = individualErrorMatch.groups
		const pkgRootAbs = packageRootPathMap.get(currentPkgFullNameKey)
		let canonicalFilePath: string

		if (pkgRootAbs) {
			const absoluteTscErrorPath = path.resolve(pkgRootAbs, tscPathReportedByTool.trim())

			canonicalFilePath = cleanFilePath(absoluteTscErrorPath, monorepoRoot)
		}
		else {
			canonicalFilePath = `[CWD_MISSING]/${tscPathReportedByTool.trim().replace(/\\/g, '/')}`
		}

		const existingErrorEntry = aggregatedErrors.find(
			e => e.packageName === currentPkgShortNameForError && e.filePath === canonicalFilePath,
		)

		if (existingErrorEntry) {
			existingErrorEntry.errorCountInFile++
		}
		else {
			aggregatedErrors.push({
				packageName: currentPkgShortNameForError,
				fullPackageNameForDisplay: currentPkgFullNameKey,
				filePath: canonicalFilePath,
				firstLineNumber: lineNumber.trim(),
				errorCountInFile: 1,
			})
		}
		packagesReportedByTurboAsFailing.delete(currentPkgShortNameForError)
		return
	}

	if (tscErrorSummaryRegex.test(contentToParse)) {
		const summaryErrorCountMatch = contentToParse.match(/^Found (\d+) errors?/)

		if (summaryErrorCountMatch && Number.parseInt(summaryErrorCountMatch[1], 10) > 0) {
			if (!aggregatedErrors.some(err => err.packageName === currentPkgShortNameForError)) {
				packagesReportedByTurboAsFailing.add(currentPkgShortNameForError)
			}
		}
	}
} //<

function reportResults(): void { //>
	packagesReportedByTurboAsFailing.forEach((pkgName) => {
		if (!aggregatedErrors.some(err => err.packageName === pkgName)) {
			const existingEntry = aggregatedErrors.find(e => e.packageName === pkgName)
			const fullPkgNameToDisplay = existingEntry ? existingEntry.fullPackageNameForDisplay : pkgName

			aggregatedErrors.push({
				packageName: pkgName,
				fullPackageNameForDisplay: fullPkgNameToDisplay,
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

	const packageHeaderTitle = 'Package'
	const columnSeparator = '  '
	const errorsColumnContentWidth = 4
	let maxPackageNameActualLength = 0

	aggregatedErrors.forEach((err) => {
		if (err.fullPackageNameForDisplay.length > maxPackageNameActualLength) {
			maxPackageNameActualLength = err.fullPackageNameForDisplay.length
		}
	})

	const packageColumnContentWidth = Math.max(packageHeaderTitle.length, maxPackageNameActualLength)

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

const turboArgs = ['run', 'check-types', '--continue', '--no-cache', '--force']
const turboProcess = spawn('pnpm', ['exec', 'turbo', ...turboArgs], {
	shell: true,
	env: {
		...process.env,
		NODE_NO_WARNINGS: '1',
		FORCE_COLOR: '1',
	},
})

const rlStdout = readline.createInterface({
	input: turboProcess.stdout,
	terminal: false,
})

const rlStderr = readline.createInterface({
	input: turboProcess.stderr,
	terminal: false,
})

rlStdout.on('line', processLine)
rlStderr.on('line', processLine)

let stdoutClosed = false
let stderrClosed = false

function checkAndReport() {
	if (stdoutClosed && stderrClosed) {
		reportResults()
	}
}

rlStdout.on('close', () => {
	stdoutClosed = true
	checkAndReport()
})

rlStderr.on('close', () => {
	stderrClosed = true
	checkAndReport()
})

turboProcess.on('error', (err) => { //>
	console.error(chalk.redBright.bold('Failed to start turbo process.'), err)
	process.exit(1)
}) //<

turboProcess.on('close', (code) => { //>
	if (!stdoutClosed) {
		stdoutClosed = true
	}
	if (!stderrClosed) {
		stderrClosed = true
	}
	checkAndReport()

	if (code !== 0 && aggregatedErrors.length === 0 && packagesReportedByTurboAsFailing.size === 0) {
		console.error(
			chalk.redBright.bold(
				`\nTurbo process exited with code ${code}, and no specific TSC errors were aggregated.`,
			),
		)
		if (process.exitCode === undefined) {
			process.exit(code || 1)
		}
	}
}) //<
