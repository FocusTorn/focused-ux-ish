/*
SCRIPT: optimize_icons.ts
PURPOSE:
  Optimizes SVG icons in specified source directories using SVGO (SVG Optimizer).
  It processes file icons and folder icons, removes unwanted artboard/PNG files
  from the source, and saves optimized SVGs to their respective destination directories.

USAGE:
  Ensure you have ts-node, typescript, and svgo installed (e.g., npm i -g ts-node typescript svgo).
  Run from the project root:
  npx ts-node --esm src/scripts/ts/optimize_icons.ts [all|file|folder]

ARGUMENTS:
  [all|file|folder] (Optional): Specifies which set of icons to optimize.
    - 'all' (default): Optimizes both file and folder icons.
    - 'file': Optimizes only file icons.
    - 'folder': Optimizes only folder icons.

PREQUISITES:
  1. SVGO: Must be installed globally or accessible in the system PATH.
     (npm install -g svgo)
  2. Source SVG Icons:
     - A directory containing the raw/unoptimized SVG icons. This script expects
       a specific naming convention to differentiate file vs. folder icons if
       they are mixed in the source directory (e.g., folder icons prefixed with '-folder-').
       (Default source: 'assets/Torn_Focus_UI/theme_icons/' relative to project root - configurable via `SOURCE_ICONS_DIR_NAME`)
  3. Output Directories:
     - 'assets/icons/file_icons/'
     - 'assets/icons/folder_icons/'
     These directories will be created if they don't exist, and optimized icons
     will be saved here.

OUTPUT:
  - Optimized SVG files in 'assets/icons/file_icons/' and 'assets/icons/folder_icons/'.
  - Console output detailing the optimization process, including file size reductions.

IMPORTANT:
  - By default, this script DELETES the original SVG files from the source directory
    after successful optimization if `KEEP_ORIGINAL_FILES` is false.
  - Ensure all paths are correctly configured within the script if defaults are not suitable.
*/

// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import { exec } from 'node:child_process'
import fs, { promises as fsPromises } from 'node:fs' // Combined fs imports
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

//--------------------------------------------------------------------------------------------------------------<<

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_ROOT = path.resolve(__dirname, '../../../') // Assumes script is in src/scripts/ts

const ICON_TYPE_ARG: 'all' | 'file' | 'folder' = (process.argv[2] as any) || 'all'
const KEEP_ORIGINAL_FILES = false // Set to true to keep original SVGs in sourceDir after optimization

// This was 'assets/.../theme_icons' in the JS version.
const SOURCE_ICONS_DIR_NAME = 'assets/_SOURCE_SVG_ICONS'
const SOURCE_ICONS_DIR_ABS = path.join(PROJECT_ROOT, SOURCE_ICONS_DIR_NAME)

const FILE_ICONS_OUTPUT_DIR_ABS = path.join(PROJECT_ROOT, 'assets/icons/file_icons')
const FOLDER_ICONS_OUTPUT_DIR_ABS = path.join(PROJECT_ROOT, 'assets/icons/folder_icons')

const ansii = { //>
	none: '\x1B[0m',
	bold: '\x1B[1m',
	blueLight: '\x1B[38;5;153m',
	gold: '\x1B[38;5;179m',
	red: '\x1B[38;5;9m',
	yellow: '\x1B[38;5;226m',
} //<

async function optimizeSvg(filePath: string, outputPath: string): Promise<void> { //>
	return new Promise((resolve, reject) => {
		// Ensure SVGO is installed globally or add path to local node_modules/.bin
		exec(`svgo -i "${filePath}" -o "${outputPath}"`, (error) => {
			if (error) {
				console.error(`Error optimizing ${path.basename(filePath)}:`, error)
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
): Promise<void> {
	try {
		if (!fs.existsSync(sourceDirAbs)) {
			console.log(`│    └── Source directory for ${type} icons not found: ${path.relative(PROJECT_ROOT, sourceDirAbs)}. Skipping.`)
			return
		}
		if (!fs.existsSync(outputDirAbs)) {
			fs.mkdirSync(outputDirAbs, { recursive: true })
		}

		const files = (await fsPromises.readdir(sourceDirAbs)).filter(
			file =>
				file.endsWith('.svg')
				&& (type === 'folder'
					? file.startsWith('folder-') // Assuming source folder icons are already named like 'folder-icon.svg'
					: !file.startsWith('folder-')), // Assuming source file icons are NOT named like 'folder-icon.svg'
		)
		const fileCount = files.length
		const singleSection = (ICON_TYPE_ARG === 'file' || ICON_TYPE_ARG === 'folder') ? ' ' : '│'

		if (fileCount === 0) {
			console.log(`${singleSection}    └── No ${type} SVG files to optimize in ${path.relative(PROJECT_ROOT, sourceDirAbs)}`)
			return
		}

		let completedCount = 0
		const longestFileName = files.reduce((longest, current) => (current.length > longest.length ? current : longest), '')
		const fileNamePadding = longestFileName.replace(/\.svg$/, '').replace(/^(folder-)/, '').length + `${type}: `.length

		const optimizationPromises = files.map(
			async (file) => {
				const filePath = path.join(sourceDirAbs, file)
				// Output filename should not have any special prefixes like '-' from the sourceDir if they were temporary
				const outputFileName = file.startsWith('-folder-') ? file.substring(1) : file // Example: if source was "-folder-icon.svg" -> "folder-icon.svg"
				const outputPath = path.join(outputDirAbs, outputFileName)

				await optimizeSvg(filePath, outputPath)

				const originalSize = (await fsPromises.stat(filePath)).size
				const optimizedSize = (await fsPromises.stat(outputPath)).size
				const sizeDifference = optimizedSize - originalSize
				const percentageChange = originalSize > 0 ? ((Math.abs(sizeDifference) / originalSize) * 100).toFixed(1) : 'N/A'

				completedCount++

				const cleanedFileName = outputFileName.replace(/\.svg$/, '').replace(/^(folder-)/, '')
				const itemPrefix = fileCount === completedCount ? `${singleSection}    └───` : `${singleSection}    ├───`
				const currentPadding = Math.max(0, fileNamePadding - cleanedFileName.length - `${type}: `.length)
				const statPadding = ' '.repeat(currentPadding + 2)

				const countStr = `${completedCount} of ${fileCount}`.padEnd(7)
				const item = `${itemPrefix} ${countStr} ${type}: ${cleanedFileName}`
				const optSizeP = ' '.repeat(Math.max(0, 6 - optimizedSize.toString().length))
				const optSize = `${optSizeP}${optimizedSize}`
				const origSizeP = ' '.repeat(Math.max(0, 6 - originalSize.toString().length))
				const origSize = `${origSizeP}${originalSize}`
				const reductionP = ' '.repeat(Math.max(0, 6 - sizeDifference.toString().length))
				const reductionAmt = `${reductionP}${sizeDifference}`
				const percChngP = ' '.repeat(percentageChange.toString().length < 4 && percentageChange !== 'N/A' ? 1 : 0)
				const percentChangeStr = percentageChange === 'N/A' ? 'N/A   ' : `${percChngP}${percentageChange}%`

				console.log(
					`${item}${statPadding}( ${origSize} -> ${optSize} | ${reductionAmt} | ${percentChangeStr} )`,
				)

				if (!keepOriginal) {
					try {
						await fsPromises.unlink(filePath)
					}
					catch (err) {
						console.error(`Error deleting original file ${filePath}:`, err)
					}
				}
			},
		)
		await Promise.all(optimizationPromises)
	}
	catch (err) {
		console.error(`Error optimizing ${type} icons in ${path.relative(PROJECT_ROOT, sourceDirAbs)}:`, err)
	}
} //<

async function removeUnwantedFilesFromSource(sourceDirAbs: string): Promise<{ artboardFilesRemoved: number, pngFilesRemoved: number }> { //>
	let artboardFilesRemoved = 0
	let pngFilesRemoved = 0

	try {
		if (!fs.existsSync(sourceDirAbs)) {
			console.log(`│    └── Source directory for cleanup not found: ${path.relative(PROJECT_ROOT, sourceDirAbs)}. Skipping cleanup.`)
			return { artboardFilesRemoved, pngFilesRemoved }
		}
		const files = fs.readdirSync(sourceDirAbs)
		for (const file of files) {
			const filePath = path.join(sourceDirAbs, file)
			if (file.startsWith('Artboard') && file.endsWith('.svg')) {
				try {
					await fsPromises.unlink(filePath)
					artboardFilesRemoved++
				}
				catch (err) { console.error(`Error removing ${file}:`, err) }
			}
			else if (file.endsWith('.png')) {
				try {
					await fsPromises.unlink(filePath)
					pngFilesRemoved++
				}
				catch (err) { console.error(`Error removing ${file}:`, err) }
			}
		}
	}
	catch (err) {
		console.error(`Error reading directory for cleanup: ${path.relative(PROJECT_ROOT, sourceDirAbs)}`, err)
	}
	return { artboardFilesRemoved, pngFilesRemoved }
} //<

async function displayRemovedFileCounts(sourceDirAbs: string): Promise<void> { //>
	const { artboardFilesRemoved, pngFilesRemoved } = await removeUnwantedFilesFromSource(sourceDirAbs)
	const totalRemoved = artboardFilesRemoved + pngFilesRemoved

	if (totalRemoved > 0) {
		if (artboardFilesRemoved > 0)
			console.log(`│    └── ${artboardFilesRemoved} Artboard SVG files removed from source.`)
		if (pngFilesRemoved > 0)
			console.log(`│    └── ${pngFilesRemoved} PNG files removed from source.`)
	}
	else {
		console.log(`│    └── No unwanted Artboard SVGs or PNGs found in source to remove.`)
	}
} //<

async function main(iconType: 'all' | 'file' | 'folder'): Promise<void> { //>
	console.log(`\n┌─ ${ansii.bold}${ansii.blueLight}OPTIMIZE ICONS${ansii.none}`)

	console.log(`├─── ${ansii.gold}Cleaning Source Directory (${path.relative(PROJECT_ROOT, SOURCE_ICONS_DIR_ABS)})${ansii.none}`)
	await displayRemovedFileCounts(SOURCE_ICONS_DIR_ABS)

	if (iconType === 'all' || iconType === 'file') {
		console.log(`├─── ${ansii.gold}Optimizing File Icons${ansii.none}`)
		await optimizeIconsInDirectory(SOURCE_ICONS_DIR_ABS, FILE_ICONS_OUTPUT_DIR_ABS, 'file', KEEP_ORIGINAL_FILES)
	}

	if (iconType === 'all' || iconType === 'folder') {
		const targetHeader = (iconType === 'all') ? `├───` : `└───`
		console.log(`${targetHeader} ${ansii.gold}Optimizing Folder Icons${ansii.none}`)
		await optimizeIconsInDirectory(SOURCE_ICONS_DIR_ABS, FOLDER_ICONS_OUTPUT_DIR_ABS, 'folder', KEEP_ORIGINAL_FILES)
	}
	console.log(`└─ ${ansii.bold}${ansii.blueLight}ICON OPTIMIZATION COMPLETE${ansii.none}\n`)
} //<

main(ICON_TYPE_ARG).catch((error) => {
	console.error('An unexpected error occurred in main:', error)
	process.exit(1)
})
