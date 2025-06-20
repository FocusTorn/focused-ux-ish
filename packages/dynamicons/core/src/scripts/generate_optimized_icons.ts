/* NOTES ------------->>

SCRIPT: optimize_icons.ts
PURPOSE:
  Optimizes SVG icons in specified source directories using SVGO (SVG Optimizer).
  It processes file icons and folder icons, removes unwanted artboard/PNG files
  from the source, and saves optimized SVGs to their respective destination directories.
  Can be run standalone or called as a module.

USAGE (Standalone):
  npx ts-node --esm packages/dynamicons/core/src/scripts/optimize_icons.ts [all|file|folder]

RETURNS (Module when silent=true):
  Promise<OptimizeIconsResult> (see interface below)

*/
//------------------------------------------------------------------------------------------------<<
// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import { exec } from 'node:child_process'
import fs, { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

//--------------------------------------------------------------------------------------------------------------<<

const KEEP_ORIGINAL_FILES = false

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MONOREPO_ROOT = path.resolve(__dirname, '../../../../../')
// const SOURCE_ROOT = path.resolve(MONOREPO_ROOT, '..')
const SOURCE_ROOT = path.resolve(MONOREPO_ROOT, 'packages/dynamicons/core/src')
const SOURCE_ICONS_DIR_NAME = 'icons'
const SOURCE_ICONS_DIR_ABS = path.join(SOURCE_ROOT, SOURCE_ICONS_DIR_NAME)

const ASSETS_DIR_ABS = path.join(MONOREPO_ROOT, 'packages/dynamicons/ext/assets')
const FILE_ICONS_OUTPUT_DIR_ABS = path.join(ASSETS_DIR_ABS, 'icons/file_icons')
const FOLDER_ICONS_OUTPUT_DIR_ABS = path.join(ASSETS_DIR_ABS, 'icons/folder_icons')

const ansii = { //>
	none: '\x1B[0m',
	bold: '\x1B[1m',
	blueLight: '\x1B[38;5;153m',
	gold: '\x1B[38;5;179m',
	red: '\x1B[38;5;9m',
	yellow: '\x1B[38;5;226m',
} //<

export interface OptimizationDetail { //>
	fileName: string
	originalSize: number
	optimizedSize: number
	reduction: number
	percentage: string
} //<

export interface OptimizeIconsResult { //>
	filesAttempted: boolean
	foldersAttempted: boolean
	fileOptimizationDetails: OptimizationDetail[]
	folderOptimizationDetails: OptimizationDetail[]
	artboardFilesRemoved: number
	pngFilesRemoved: number
	sourceIconDirRelative: string
	filesFoundForOptimization: number
	foldersFoundForOptimization: number
} //<

async function optimizeSvg(filePath: string, outputPath: string): Promise<void> { //>
	return new Promise((resolve, reject) => {
		exec(`svgo -i "${filePath}" -o "${outputPath}"`, (error) => {
			if (error) {
				reject(error)
			}
			else {
				resolve()
			}
		})
	})
} //<

async function optimizeIconsInDirectory( //>
	sourceDirAbs: string,
	outputDirAbs: string,
	type: 'file' | 'folder',
	keepOriginal: boolean = false,
	iconTypeArgForLogging: 'all' | 'file' | 'folder', // For standalone logging style
	silent: boolean = false,
): Promise<{ count: number, details: OptimizationDetail[], attempted: boolean, foundAnySvgs: boolean }> {
	const optimizationDetails: OptimizationDetail[] = []
	let filesOptimizedCount = 0
	const operationAttempted = true // We are attempting this type

	try {
		if (!fs.existsSync(sourceDirAbs)) {
			if (!silent) {
				console.log(
					`│    └── Source directory for ${type} icons not found: ${path.relative(
						MONOREPO_ROOT,
						sourceDirAbs,
					)}. Skipping.`,
				)
			}
			return { count: 0, details: [], attempted: operationAttempted, foundAnySvgs: false }
		}
		if (!fs.existsSync(outputDirAbs)) {
			fs.mkdirSync(outputDirAbs, { recursive: true })
		}

		const files = (await fsPromises.readdir(sourceDirAbs)).filter(
			(file: string) => {
				if (!file.endsWith('.svg'))
					return false

				const effectiveFileName = file.startsWith('-') ? file.substring(1) : file
				const isFolderIconCandidate = effectiveFileName.startsWith('folder-')

				return type === 'folder' ? isFolderIconCandidate : !isFolderIconCandidate
			},
		)
		const fileCount = files.length

		if (fileCount === 0) {
			if (!silent) {
				const singleSection = (iconTypeArgForLogging === 'file' || iconTypeArgForLogging === 'folder') ? ' ' : '│'

				console.log(
					`${singleSection}    └── No ${type} SVG files to optimize in ${path.relative(
						MONOREPO_ROOT,
						sourceDirAbs,
					)}`,
				)
			}
			return { count: 0, details: [], attempted: operationAttempted, foundAnySvgs: false }
		}

		filesOptimizedCount = fileCount

		let completedCount = 0

		const optimizationPromises = files.map(
			async (file) => {
				const filePath = path.join(sourceDirAbs, file)
				const outputFileName = file.startsWith('-folder-') ? file.substring(1) : file
				const outputPath = path.join(outputDirAbs, outputFileName)

				await optimizeSvg(filePath, outputPath)

				const originalSize = (await fsPromises.stat(filePath)).size
				const optimizedSize = (await fsPromises.stat(outputPath)).size
				const sizeDifference = optimizedSize - originalSize
				const percentageChange = originalSize > 0 ? ((Math.abs(sizeDifference) / originalSize) * 100).toFixed(1) : 'N/A'

				completedCount++

				const cleanedFileName = outputFileName.replace(/\.svg$/, '').replace(/^(folder-)/, '')

				optimizationDetails.push({
					fileName: cleanedFileName,
					originalSize,
					optimizedSize,
					reduction: sizeDifference,
					percentage: percentageChange,
				})

				if (!silent) {
					// Standalone logging
					const singleSection = (iconTypeArgForLogging === 'file' || iconTypeArgForLogging === 'folder') ? ' ' : '│'
					const longestFileNameForPadding = files.reduce((longest, current) => (current.length > longest.length ? current : longest), '')
					const fileNamePadding = longestFileNameForPadding.replace(/\.svg$/, '').replace(/^(folder-)/, '').length + `${type}: `.length
					const itemPrefix = fileCount === completedCount ? `${singleSection}    └───` : `${singleSection}    ├───`
					const currentPadding = Math.max(0, fileNamePadding - cleanedFileName.length - `${type}: `.length)
					const statPadding = ' '.repeat(currentPadding + 2)
					const countPart = String(completedCount).padStart(String(fileCount).length, ' ')
					const countStr = `${countPart} of ${fileCount}`
					const item = `${itemPrefix} ${countStr} ${type}: ${cleanedFileName}`
					const optSizeP = ' '.repeat(Math.max(0, 6 - optimizedSize.toString().length))
					const optSize = `${optSizeP}${optimizedSize}`
					const origSizeP = ' '.repeat(Math.max(0, 6 - originalSize.toString().length))
					const origSize = `${origSizeP}${originalSize}`
					const reductionP = ' '.repeat(Math.max(0, 6 - sizeDifference.toString().length))
					const reductionAmt = `${reductionP}${sizeDifference}`
					const percChngP = ' '.repeat(percentageChange.toString().length < 4 && percentageChange !== 'N/A' ? 1 : 0)
					const percentChangeStr = percentageChange === 'N/A' ? 'N/A   ' : `${percChngP}${percentageChange}%`

					console.log(`${item}${statPadding}( ${origSize} -> ${optSize} | ${reductionAmt} | ${percentChangeStr} )`)
				}

				if (!keepOriginal) {
					try {
						await fsPromises.unlink(filePath)
					}
					catch (err) {
						if (!silent)
							console.error(`Error deleting original file ${filePath}:`, err)
					}
				}
			},
		)

		await Promise.all(optimizationPromises)
	}
	catch (err) {
		if (!silent) {
			console.error(`Error optimizing ${type} icons in ${path.relative(MONOREPO_ROOT, sourceDirAbs)}:`, err)
		}
		return { count: filesOptimizedCount, details: optimizationDetails, attempted: operationAttempted, foundAnySvgs: filesOptimizedCount > 0 }
	}
	return { count: filesOptimizedCount, details: optimizationDetails, attempted: operationAttempted, foundAnySvgs: filesOptimizedCount > 0 }
} //<

async function removeUnwantedFilesFromSource( //>
	sourceDirAbs: string,
	silent: boolean = false,
): Promise<{ artboardFilesRemoved: number, pngFilesRemoved: number }> {
	let artboardFilesRemoved = 0
	let pngFilesRemoved = 0

	try {
		if (!fs.existsSync(sourceDirAbs)) {
			if (!silent) {
				console.log(
					`│    └── Source directory for cleanup not found: ${path.relative(
						MONOREPO_ROOT,
						sourceDirAbs,
					)}. Skipping cleanup.`,
				)
			}
			return { artboardFilesRemoved, pngFilesRemoved }
		}

		const files = fs.readdirSync(sourceDirAbs)

		for (const file of files) {
			const filePath = path.join(sourceDirAbs, file)

			if (file.startsWith('Artboard') && file.endsWith('.svg')) {
				try {
					await fsPromises.unlink(filePath); artboardFilesRemoved++
				}
				catch (err) {
					if (!silent)
						console.error(`Error removing ${file}:`, err)
				}
			}
			else if (file.endsWith('.png')) {
				try {
					await fsPromises.unlink(filePath); pngFilesRemoved++
				}
				catch (err) {
					if (!silent)
						console.error(`Error removing ${file}:`, err)
				}
			}
		}
	}
	catch (err) {
		if (!silent)
			console.error(`Error reading directory for cleanup: ${path.relative(MONOREPO_ROOT, sourceDirAbs)}`, err)
	}
	return { artboardFilesRemoved, pngFilesRemoved }
} //<

export async function main( //>
	iconType: 'all' | 'file' | 'folder' = 'all',
	silent: boolean = false,
): Promise<OptimizeIconsResult> { // Changed return type
	if (!silent) {
		console.log(`\n┌─ ${ansii.bold}${ansii.blueLight}OPTIMIZE ICONS (${iconType.toUpperCase()})${ansii.none}`)
		console.log(
			`├─── ${ansii.gold}Cleaning Source Directory (${path.relative(MONOREPO_ROOT, SOURCE_ICONS_DIR_ABS)})${ansii.none}`,
		)
	}

	const removedCounts = await removeUnwantedFilesFromSource(SOURCE_ICONS_DIR_ABS, silent)

	if (!silent) {
		const totalRemoved = removedCounts.artboardFilesRemoved + removedCounts.pngFilesRemoved

		if (totalRemoved > 0) {
			if (removedCounts.artboardFilesRemoved > 0)
				console.log(`│    └── ${removedCounts.artboardFilesRemoved} Artboard SVG files removed from source.`)
			if (removedCounts.pngFilesRemoved > 0)
				console.log(`│    └── ${removedCounts.pngFilesRemoved} PNG files removed from source.`)
		}
		else {
			console.log(`│    └── No unwanted Artboard SVGs or PNGs found in source to remove.`)
		}
	}

	// Explicitly type the 'details' property
	let fileResults: { count: number, details: OptimizationDetail[], attempted: boolean, foundAnySvgs: boolean } = {
		count: 0,
		details: [], // Explicitly OptimizationDetail[] due to initialization
		attempted: false,
		foundAnySvgs: false,
	}
	let folderResults: { count: number, details: OptimizationDetail[], attempted: boolean, foundAnySvgs: boolean } = {
		count: 0,
		details: [], // Explicitly OptimizationDetail[] due to initialization
		attempted: false,
		foundAnySvgs: false,
	}

	if (iconType === 'all' || iconType === 'file') {
		if (!silent)
			console.log(`├─── ${ansii.gold}Optimizing File Icons${ansii.none}`)
		fileResults = await optimizeIconsInDirectory(SOURCE_ICONS_DIR_ABS, FILE_ICONS_OUTPUT_DIR_ABS, 'file', KEEP_ORIGINAL_FILES, iconType, silent)
	}

	if (iconType === 'all' || iconType === 'folder') {
		if (!silent) {
			const targetHeader = (iconType === 'all') ? `├───` : `└───`

			console.log(`${targetHeader} ${ansii.gold}Optimizing Folder Icons${ansii.none}`)
		}
		folderResults = await optimizeIconsInDirectory(SOURCE_ICONS_DIR_ABS, FOLDER_ICONS_OUTPUT_DIR_ABS, 'folder', KEEP_ORIGINAL_FILES, iconType, silent)
	}

	if (!silent) {
		console.log(`└─ ${ansii.bold}${ansii.blueLight}ICON OPTIMIZATION (${iconType.toUpperCase()}) COMPLETE${ansii.none}\n`)
	}

	return {
		filesAttempted: fileResults.attempted,
		foldersAttempted: folderResults.attempted,
		fileOptimizationDetails: fileResults.details,
		folderOptimizationDetails: folderResults.details,
		artboardFilesRemoved: removedCounts.artboardFilesRemoved,
		pngFilesRemoved: removedCounts.pngFilesRemoved,
		sourceIconDirRelative: path.relative(MONOREPO_ROOT, SOURCE_ICONS_DIR_ABS),
		filesFoundForOptimization: fileResults.count, // Use count from results
		foldersFoundForOptimization: folderResults.count, // Use count from results
	}
} //<

// Standalone execution
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) { //>
	const iconTypeArg = (process.argv[2] as 'all' | 'file' | 'folder') || 'all'

	main(iconTypeArg, false)
		.catch((error) => {
			console.error('An unexpected error occurred in optimize_icons.ts (standalone):', error)
			process.exit(1)
		})
} //<
