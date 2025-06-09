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
	packageName: string
	fullPackageNameForDisplay: string
	filePath: string
	firstErrorLineNumber: string
	firstErrorColumnNumber: string
	eslintErrorCount: number
	tscErrorCount: number
} //<

const aggregatedErrors: AggregatedError[] = []
const packagesReportedByTurboAsFailing = new Set<string>()
const packageRootPathMap = new Map<string, string>()

let activeFullPackageContext: string | null = null
let activeShortenedPackageContext: string | null = null
let currentFileForEslintError: string | null = null

// Regex to capture package name and task from Turbo's prefixed lines
const packagePrefixRegex = /^(?<fullPkgName>[^:]+):(?<taskName>[a-zA-Z0-9_-]+(?:[:][a-zA-Z0-9_-]+)*):(\s*(?<restOfLine>.*))?$/
// Regex to capture CWD from lines like: `> @scope/pkg@version task /abs/path/to/pkg/root`
const packageCwdRegex = /^>\s*(?<pkgNameVer>[@\w/-]+(?:@[\w.-]+)?)\s+[\w:]+\s+(?<cwdPath>[A-Za-z]:\\(?:[^<>:"/\\|?*]+\\)*[^<>:"/\\|?*]*|\/(?:[^<>:"/\\|?*]+\/)*[^<>:"/\\|?*]*)$/
// Regex for ESLint error lines
const eslintErrorRegex = /^\s*(?<line>\d+):(?<column>\d+)\s+(?<severity>error|warning)\s+(?<message>.+?)(?:\s+(?<ruleId>\S+))?\s*$/
// Regex for TSC error lines (filePath is relative to its package CWD)
const tscErrorRegex = /^(?<filePath>[^(]+)\s*\((?<line>\d+)[,:]\s*(?<column>\d+)\)\s*:\s*(?<errorType>error|warning)\s+(?<errorCode>TS\d+):\s+(?<message>.+)$/i
// Regex to identify lines that are likely ESLint-reported file paths (usually absolute)
const eslintFilePathRegex = /(\\|\/|[A-Za-z]:\\).*\.(ts|js|tsx|jsx|json|md)$/i
// Regex for ESLint summary lines
const eslintSummaryRegex = /✖ \d+ problems? \(\d+ errors?, \d+ warnings?\)/
// Regex for generic Turbo error messages for a package
const turboPackageErrorRegex = /ERROR: command finished with error/

function stripAnsiCodes(str: string): string { //>
	if (!str)
		return ''

	const ansiRegexPattern = `[${String.fromCharCode(0x1B)}${String.fromCharCode(0x9B)}]\\[[()#;?]?[0-9]{1,4}(?:;[0-9]{0,4})*[0-9A-ORZcf-nqry=><]`
	const ansiRegex = new RegExp(ansiRegexPattern, 'g')

	return str.replace(ansiRegex, '')
} //<

function shortenPackageName(fullPackageName: string): string { //>
	// Expects fullPackageName to be already stripped of version
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

	// Fallback for paths that might be directly relative to monorepo root (e.g. top-level files not in packages/)
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
	// let taskNameFromPrefix: string | null = null;

	const packagePrefixMatch = baseTrimmedLine.match(packagePrefixRegex)
	let lineHadPackagePrefix = false

	if (packagePrefixMatch?.groups?.fullPkgName) {
		lineHadPackagePrefix = true

		const newFullPkgName = packagePrefixMatch.groups.fullPkgName
		// taskNameFromPrefix = packagePrefixMatch.groups.taskName;

		if (activeFullPackageContext !== newFullPkgName) {
			currentFileForEslintError = null
		}
		activeFullPackageContext = newFullPkgName // This is the @scope/name (no version)
		activeShortenedPackageContext = shortenPackageName(activeFullPackageContext)
		contentToParse = (packagePrefixMatch.groups.restOfLine ?? '').trim()
	}

	const currentPkgFullNameKey = activeFullPackageContext // Key for CWD map
	const currentPkgShortNameForError = activeShortenedPackageContext // For AggregatedError.packageName
	const monorepoRoot = process.cwd()

	// Capture CWD for packages. Test against baseTrimmedLine.
	const cwdMatch = baseTrimmedLine.match(packageCwdRegex)

	if (cwdMatch) {
		const pkgNameWithVersion = cwdMatch.groups?.pkgNameVer?.trim() // e.g., @scope/name@1.0.0 or name@1.0.0
		const capturedCwd = cwdMatch.groups?.cwdPath?.trim()

		if (pkgNameWithVersion && capturedCwd) {
			// Normalize the package name from CWD line to use as key (remove version)
			const normalizedPkgNameKeyForMap = pkgNameWithVersion.replace(/@[\w.-]+$/, '')

			packageRootPathMap.set(normalizedPkgNameKeyForMap, capturedCwd)
			// console.log(chalk.blueBright(`[CWD CAPTURE] Set for '${normalizedPkgNameKeyForMap}': ${capturedCwd}. From line: "${baseTrimmedLine}"`));
			return // This line is processed
		}
	}

	if (!currentPkgFullNameKey || !currentPkgShortNameForError) {
		// console.log(`[DEBUG SKIP NO CTX] Line: "${baseTrimmedLine}"`)
		return
	}

	if (lineHadPackagePrefix && contentToParse === '') {
		return
	}

	if (turboPackageErrorRegex.test(baseTrimmedLine)) {
		packagesReportedByTurboAsFailing.add(currentPkgShortNameForError)
		currentFileForEslintError = null
		return
	}

	const tscMatch = contentToParse.match(tscErrorRegex)

	if (tscMatch?.groups) {
		const { filePath: tscPathReportedByTool, line: lineNumber, column: columnNumber = '0' } = tscMatch.groups
		const pkgRootAbs = packageRootPathMap.get(currentPkgFullNameKey) // Use the active full package name as key
		let canonicalFilePath: string

		if (pkgRootAbs) {
			const absoluteTscErrorPath = path.resolve(pkgRootAbs, tscPathReportedByTool.trim())

			canonicalFilePath = cleanFilePath(absoluteTscErrorPath, monorepoRoot)
			// console.log(chalk.cyan(`[TSC PATH] Pkg: ${currentPkgFullNameKey}, Rel: ${tscPathReportedByTool}, CWD: ${pkgRootAbs}, AbsFile: ${absoluteTscErrorPath}, Canonical: ${canonicalFilePath}`));
		} else {
			console.warn(chalk.magenta(`[WARN CWD MISSING] TSC CWD not found for package '${currentPkgFullNameKey}' when processing error in '${tscPathReportedByTool}'. Path canonicalization will be incomplete. Line: "${originalLineForDebug}"`))
			canonicalFilePath = `[CWD_MISSING_FOR_TSC_IN_PKG:${currentPkgFullNameKey}]/${tscPathReportedByTool.trim().replace(/\\/g, '/')}`
		}

		let existingError = aggregatedErrors.find(
			e => e.packageName === currentPkgShortNameForError && e.filePath === canonicalFilePath,
		)

		if (existingError) {
			existingError.tscErrorCount++
		} else {
			existingError = {
				packageName: currentPkgShortNameForError,
				fullPackageNameForDisplay: currentPkgFullNameKey,
				filePath: canonicalFilePath,
				firstErrorLineNumber: lineNumber.trim(),
				firstErrorColumnNumber: columnNumber.trim(),
				eslintErrorCount: 0,
				tscErrorCount: 1,
			}
			aggregatedErrors.push(existingError)
		}
		packagesReportedByTurboAsFailing.delete(currentPkgShortNameForError)
		currentFileForEslintError = null
		return
	}

	const isEslintFilePathLine
		= eslintFilePathRegex.test(contentToParse)
		  && !contentToParse.includes(': error')
		  && !contentToParse.includes(': warning')
		  && !eslintErrorRegex.test(contentToParse)
		  && !eslintSummaryRegex.test(contentToParse)

	if (isEslintFilePathLine) {
		currentFileForEslintError = cleanFilePath(contentToParse.trim(), monorepoRoot)
		// console.log(chalk.greenBright(`[ESLINT PATH] File context set to: ${currentFileForEslintError} from: ${contentToParse.trim()}`));
		return
	}

	if (currentFileForEslintError) {
		const eslintMatch = contentToParse.match(eslintErrorRegex)

		if (eslintMatch?.groups) {
			const { line: lineNumber, column: columnNumber } = eslintMatch.groups

			let existingError = aggregatedErrors.find(
				e => e.packageName === currentPkgShortNameForError && e.filePath === currentFileForEslintError,
			)

			if (existingError) {
				existingError.eslintErrorCount++
			} else {
				existingError = {
					packageName: currentPkgShortNameForError,
					fullPackageNameForDisplay: currentPkgFullNameKey,
					filePath: currentFileForEslintError,
					firstErrorLineNumber: lineNumber.trim(),
					firstErrorColumnNumber: columnNumber.trim(),
					eslintErrorCount: 1,
					tscErrorCount: 0,
				}
				aggregatedErrors.push(existingError)
			}
			packagesReportedByTurboAsFailing.delete(currentPkgShortNameForError)
			return
		}
	}

	if (eslintSummaryRegex.test(contentToParse)) {
		if (!aggregatedErrors.some(err => err.packageName === currentPkgShortNameForError && (err.eslintErrorCount > 0 || err.tscErrorCount > 0))) {
			const summaryProblemMatch = contentToParse.match(/✖ (\d+) problems?/)

			if (summaryProblemMatch && Number.parseInt(summaryProblemMatch[1], 10) > 0) {
				packagesReportedByTurboAsFailing.add(currentPkgShortNameForError)
			}
		}
		currentFileForEslintError = null
	}
} //<

function reportResults(): void { //>
	packagesReportedByTurboAsFailing.forEach((pkgName) => {
		const existingEntry = aggregatedErrors.find(e => e.packageName === pkgName)
		const fullPkgNameToDisplay = existingEntry ? existingEntry.fullPackageNameForDisplay : pkgName

		if (!aggregatedErrors.some(err => err.packageName === pkgName)) {
			aggregatedErrors.push({
				packageName: pkgName,
				fullPackageNameForDisplay: fullPkgNameToDisplay,
				filePath: 'Build/Lint issues found (check logs)',
				firstErrorLineNumber: '',
				firstErrorColumnNumber: '',
				eslintErrorCount: 0,
				tscErrorCount: 0,
			})
		}
	})

	if (aggregatedErrors.length === 0) {
		console.log(
			chalk.green(
				'\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗',
			),
		)
		console.log(chalk.green(`║ ${'VALIDATION PASSED'.padEnd(100)} ║`))
		console.log(
			chalk.green(
				'╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝',
			),
		)
		console.log(chalk.green('No ESLint or TSC issues found across packages.\n'))
		process.exit(0)
	}

	console.log(
		chalk.redBright.bold(
			'\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗',
		),
	)
	console.log(chalk.redBright.bold(`║ ${'VALIDATION ISSUES FOUND'.padEnd(100)} ║`))
	console.log(
		chalk.redBright.bold(
			'╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝',
		),
	)

	const issuesHeaderTitle = 'Issues'
	const packageHeaderTitle = 'Package'
	const fileHeaderTitle = 'File'
	const columnSeparator = '  '

	const maxIssueDisplayLength = aggregatedErrors.reduce((max, err) => {
		let currentLength = 0

		if (err.eslintErrorCount > 0 && err.tscErrorCount > 0) {
			currentLength = (`E:${err.eslintErrorCount} T:${err.tscErrorCount}`).length
		} else if (err.eslintErrorCount > 0) {
			currentLength = (`E:${err.eslintErrorCount}`).length
		} else if (err.tscErrorCount > 0) {
			currentLength = (`T:${err.tscErrorCount}`).length
		} else if (err.filePath.startsWith('Build/Lint issues found')) {
			currentLength = (`E:? T:?`).length
		}
		return Math.max(max, currentLength)
	}, issuesHeaderTitle.length)
	const problemsColumnDisplayWidth = Math.max(maxIssueDisplayLength, issuesHeaderTitle.length)

	let maxPackageNameActualLength = packageHeaderTitle.length

	aggregatedErrors.forEach((err) => {
		if (err.fullPackageNameForDisplay.length > maxPackageNameActualLength) {
			maxPackageNameActualLength = err.fullPackageNameForDisplay.length
		}
	})

	const packageColumnDisplayWidth = maxPackageNameActualLength

	let maxFileLocationLength = fileHeaderTitle.length

	aggregatedErrors.forEach((err) => {
		const loc = err.firstErrorLineNumber && err.firstErrorColumnNumber
			? `${err.filePath}:${err.firstErrorLineNumber}:${err.firstErrorColumnNumber}`
			: err.filePath

		if (loc.length > maxFileLocationLength) {
			maxFileLocationLength = loc.length
		}
	})

	const fileColumnDisplayWidth = maxFileLocationLength

	const problemsHeaderPart = issuesHeaderTitle.padEnd(problemsColumnDisplayWidth)
	const packageHeaderPart = packageHeaderTitle.padEnd(packageColumnDisplayWidth)
	const fileHeaderPart = fileHeaderTitle.padEnd(fileColumnDisplayWidth)

	const headerLine
		= chalk.whiteBright.bold(problemsHeaderPart)
		  + columnSeparator
		  + chalk.whiteBright.bold(packageHeaderPart)
		  + columnSeparator
		  + chalk.whiteBright.bold(fileHeaderPart)

	console.log(headerLine)

	aggregatedErrors.sort((a, b) => {
		if (a.fullPackageNameForDisplay !== b.fullPackageNameForDisplay)
			return a.fullPackageNameForDisplay.localeCompare(b.fullPackageNameForDisplay)
		return a.filePath.localeCompare(b.filePath)
	})

	aggregatedErrors.forEach((err) => {
		let issuesDisplay = ''

		if (err.eslintErrorCount > 0 && err.tscErrorCount > 0) {
			issuesDisplay = `E:${err.eslintErrorCount} T:${err.tscErrorCount}`
		} else if (err.eslintErrorCount > 0) {
			issuesDisplay = `E:${err.eslintErrorCount}`
		} else if (err.tscErrorCount > 0) {
			issuesDisplay = `T:${err.tscErrorCount}`
		} else if (err.filePath.startsWith('Build/Lint issues found')) {
			issuesDisplay = `E:? T:?`
		}

		const problemCountDisplayPart = issuesDisplay.padEnd(problemsColumnDisplayWidth)
		const packageNameDisplayPart = err.fullPackageNameForDisplay.padEnd(packageColumnDisplayWidth)
		const fileLocationPart = (
			err.firstErrorLineNumber && err.firstErrorColumnNumber
				? `${err.filePath}:${err.firstErrorLineNumber}:${err.firstErrorColumnNumber}`
				: err.filePath
		).padEnd(fileColumnDisplayWidth)

		let rowColor = chalk.white

		if (err.tscErrorCount > 0) {
			rowColor = chalk.red
		} else if (err.eslintErrorCount > 0) {
			rowColor = chalk.yellow
		}

		const dataRow
			= problemCountDisplayPart
			  + columnSeparator
			  + packageNameDisplayPart
			  + columnSeparator
			  + fileLocationPart

		console.log(rowColor(dataRow))
	})
	console.log('')
	process.exit(1)
} //<

// ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                        Main execution                                        │
// └──────────────────────────────────────────────────────────────────────────────────────────────┘

const turboArgs = [
	'run',
	'lint', // Assuming 'lint' in turbo.json depends on 'build' or 'check-types' if necessary
	'--continue',
	'--no-cache',
	'--force',
]
const turboProcess = spawn('pnpm', ['exec', 'turbo', ...turboArgs], {
	shell: true,
	env: {
		...process.env,
		NODE_NO_WARNINGS: '1',
		FORCE_COLOR: '1',
	},
})

const rlStdout = readline.createInterface({ //>
	input: turboProcess.stdout,
	terminal: false,
}) //<

const rlStderr = readline.createInterface({ //>
	input: turboProcess.stderr,
	terminal: false,
}) //<

rlStdout.on('line', (line) => { //>
	processLine(line)
}) //<

rlStderr.on('line', (line) => { //>
	processLine(line)
}) //<

let stdoutClosed = false
let stderrClosed = false

function checkAndReport() { //>
	if (stdoutClosed && stderrClosed) {
		reportResults()
	}
} //<

rlStdout.on('close', () => { //>
	stdoutClosed = true
	checkAndReport()
}) //<

rlStderr.on('close', () => { //>
	stderrClosed = true
	checkAndReport()
}) //<

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
				`\nTurbo process exited with code ${code}, and no specific issues were aggregated.`,
			),
		)
		if (process.exitCode === undefined) {
			process.exit(code || 1)
		}
	}
}) //<
