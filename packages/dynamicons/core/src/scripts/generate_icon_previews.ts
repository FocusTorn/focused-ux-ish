/* NOTES ------------->>

SCRIPT: generate_icon_previews.ts
PURPOSE:
  Generates HTML previews of SVG icons (converted to PNGs for the HTML)
  and then captures screenshots of these HTML pages to create PNG preview images.
  This is useful for documentation or marketplace assets.

USAGE (Standalone):
  npx ts-node --esm packages/dynamicons/core/src/scripts/generate_icon_previews.ts [all|file|folder]

ARGUMENTS (Standalone):
  [all|file|folder] (Optional): Specifies which set of previews to generate.
    - 'all' (default): Generates previews for file, folder, and folder-open icons.
    - 'file': Generates previews only for file icons.
    - 'folder': Generates previews for folder and folder-open icons.

PREQUISITES:
  1. Optimized SVG Icons: (Assumes optimize_icons.ts has run)
     - File Icons: 'packages/dynamicons/ext/assets/icons/file_icons/'
     - Folder Icons: 'packages/dynamicons/ext/assets/icons/folder_icons/'
  2. Dependencies: Puppeteer for headless browser, Sharp for image manipulation.

OUTPUT:
  - PNG preview images in 'packages/dynamicons/ext/assets/images/':
    - 'File_icons_preview.png'
    - 'Folder_icons_preview.png'
    - 'Folder_Open_icons_preview.png'
  - Temporary PNG icons and HTML files are created in 'packages/dynamicons/ext/dist/temp_previews/'
    and can be optionally deleted.

IMPORTANT:
  - Puppeteer will download a browser if it hasn't already.
*/
//------------------------------------------------------------------------------------------------<<
// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import fs, { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
//= MISC ======================================================================================================
import puppeteer from 'puppeteer'
import type { Page, Browser } from 'puppeteer'
import sharp from 'sharp'

//--------------------------------------------------------------------------------------------------------------<<

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MONOREPO_ROOT = path.resolve(__dirname, '../../../../../')
const EXT_PACKAGE_ROOT_ABS = path.join(MONOREPO_ROOT, 'packages/dynamicons/ext')
const EXT_ASSETS_DIR_ABS = path.join(EXT_PACKAGE_ROOT_ABS, 'assets')
const FILE_ICONS_SVG_DIR_ABS = path.join(EXT_ASSETS_DIR_ABS, 'icons/file_icons')
const FOLDER_ICONS_SVG_DIR_ABS = path.join(EXT_ASSETS_DIR_ABS, 'icons/folder_icons')
const PNG_TEMP_ROOT_DIR_ABS = path.join(EXT_PACKAGE_ROOT_ABS, 'dist/temp_previews') // Changed from 'packages/assets'
const FILE_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'file_icons_png')
const FOLDER_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'folder_icons_png')
const FOLDER_OPEN_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'folder_open_icons_png')
const HTML_OUTPUT_DIR_ABS = PNG_TEMP_ROOT_DIR_ABS
const FINAL_IMAGE_OUTPUT_DIR_ABS = path.join(EXT_ASSETS_DIR_ABS, 'images')

const ICON_SIZE_FOR_PNG_CONVERSION = 16
const HTML_COLUMNS = 5
const CLEANUP_TEMP_FILES = true // Set to true to remove temp files after script runs

const ansii = { //>
	none: '\x1B[0m',
	bold: '\x1B[1m',
	blueLight: '\x1B[38;5;153m',
	gold: '\x1B[38;5;179m',
	red: '\x1B[38;5;9m',
	yellow: '\x1B[38;5;226m',
	green: '\x1B[38;5;35m',
} //<

// --- Helper Functions ---

async function createDirectory(directoryPath: string, silent: boolean = false): Promise<void> { //>
	try {
		await fsPromises.mkdir(directoryPath, { recursive: true })
	}
	catch (err: any) {
		if (err.code !== 'EEXIST') {
			if (!silent)
				console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} creating directory ${path.relative(MONOREPO_ROOT, directoryPath)}:`, err)
			throw err
		}
	}
} //<

async function convertSvgToPng( //>
	size: number,
	svgFilePath: string,
	outputPngPath: string,
	silent: boolean = false,
): Promise<void> {
	try {
		await sharp(svgFilePath)
			.resize(size, size)
			.png()
			.toFile(outputPngPath)
	}
	catch (error) {
		if (!silent)
			console.error(`│     └─ ${ansii.red}ERROR:${ansii.none} converting ${path.basename(svgFilePath)} to PNG at ${path.relative(MONOREPO_ROOT, outputPngPath)}:`, error)
		throw error
	}
} //<

async function convertSvgsToPngs( //>
	size: number,
	svgIconsDirAbs: string,
	pngOutputDirAbs: string,
	filter: (filename: string) => boolean = () => true,
	isLastInSection: boolean = false,
	logPrefix: string = '│  ├─',
	silent: boolean = false,
): Promise<boolean> {
	const effectiveLogPrefix = isLastInSection ? logPrefix.replace('├', '└') : logPrefix

	if (!silent) {
		console.log(
			`${effectiveLogPrefix} Converting SVGs from ${path.relative(MONOREPO_ROOT, svgIconsDirAbs)} to PNGs in ${path.relative(MONOREPO_ROOT, pngOutputDirAbs)}...`,
		)
	}

	if (!fs.existsSync(svgIconsDirAbs)) {
		if (!silent) {
			console.log(
				`│     └─ ${ansii.yellow}WARN:${ansii.none} Source SVG directory not found: ${path.relative(MONOREPO_ROOT, svgIconsDirAbs)}. Skipping.`,
			)
		}
		return false
	}

	try {
		const iconFiles = fs.readdirSync(svgIconsDirAbs).filter(
			file => file.endsWith('.svg') && filter(file),
		)

		if (iconFiles.length === 0) {
			if (!silent) {
				console.log(
					`│     └─ ${ansii.yellow}No matching SVG files found in ${path.relative(MONOREPO_ROOT, svgIconsDirAbs)}.${ansii.none}`,
				)
			}
			return false
		}
		await createDirectory(pngOutputDirAbs, silent)

		const convertPromises = iconFiles.map(async (file) => {
			const svgFilePath = path.join(svgIconsDirAbs, file)
			const pngFileName = `${path.parse(file).name}.png`
			const outputPngPath = path.join(pngOutputDirAbs, pngFileName)

			await convertSvgToPng(size, svgFilePath, outputPngPath, silent)
		})

		await Promise.all(convertPromises)
		if (!silent) {
			console.log(
				`│     └─ ${ansii.green}Success:${ansii.none} Finished converting ${iconFiles.length} icons.`,
			)
		}
		return true
	}
	catch (error) {
		if (!silent) {
			console.error(
				`│     └─ ${ansii.red}ERROR:${ansii.none} during SVG to PNG conversion for ${path.relative(MONOREPO_ROOT, svgIconsDirAbs)}:`,
				error,
			)
		}
		return false
	}
} //<

function generateIconCellHtml( //>
	_pageTitleType: string,
	pngIconsDirAbsForCell: string,
	file: string,
): string {
	let iconName = path.parse(file).name

	iconName = iconName.replace(/-open$/, '').replace(/^folder-/, '')

	const absolutePngPath = path.join(pngIconsDirAbsForCell, file)
	const imgSrc = `file://${absolutePngPath.replace(/\\/g, '/')}`

	return `
      <td style="text-align: center; width: 40px;">
        <img src="${imgSrc}" alt="${iconName}" title="${iconName}">
      </td>
      <td style="text-align: left; vertical-align: middle; width: 100px;">${iconName}</td>
    `
} //<

function generateHtmlContent( //>
	pageTitleType: string,
	pngIconsDirAbs: string,
	silent: boolean = false,
): string {
	let files: string[] = []

	try {
		if (fs.existsSync(pngIconsDirAbs)) {
			files = fs.readdirSync(pngIconsDirAbs).filter(f => f.endsWith('.png'))
		}
		else if (!silent) {
			console.warn(
				`│     └─ ${ansii.yellow}WARN:${ansii.none} PNG directory not found for HTML generation: ${path.relative(MONOREPO_ROOT, pngIconsDirAbs)}`,
			)
		}
	}
	catch (error) {
		if (!silent) {
			console.error(
				`│     └─ ${ansii.red}ERROR:${ansii.none} reading PNG directory ${path.relative(MONOREPO_ROOT, pngIconsDirAbs)}:`,
				error,
			)
		}
	}

	const marPad = 10
	const columns = HTML_COLUMNS
	let htmlContent = `
    <!DOCTYPE html><html><head><title>${pageTitleType.replace('_', ' ')} Icons</title><style>
    @import url('https://fonts.googleapis.com/css2?family=Hind&display=swap');
    body { background-color: #090a0c; margin: 0px; padding: 0; }
    .container { background-color: #090a0c; text-align: center; margin: ${marPad}px; width: fit-content; display: inline-block; }
    h1 { background-color: #090a0c; color: #EEEEEE; text-align: center; margin: 0 auto; padding: 0 0 10px 0; font-family: "Hind", sans-serif; }
    table { background-color: #090a0c; color: #EEEEEE; margin: 0 auto; border-collapse: collapse; }
    th, td { font-family: "Hind", sans-serif; font-weight: 400; font-style: normal; }
    th { font-size: 15px; font-weight: 600; } td { font-size: 12px; }
    th:nth-child(odd), td:nth-child(odd) { text-align: center; width: 40px; }
    th:nth-child(even), td:nth-child(even) { text-align: left; vertical-align: middle; width: 100px; }
    </style></head><body><div class="container"><h1>${pageTitleType.replace('_', ' ')} Icons</h1>
    <table><thead><tr>`

	for (let i = 0; i < columns; i++) htmlContent += `<th>Icon</th><th>Name</th>`
	htmlContent += `</tr></thead><tbody>`
	if (files.length === 0) {
		htmlContent += `<tr><td colspan="${columns * 2}">No PNG icons found in ${path.relative(MONOREPO_ROOT, pngIconsDirAbs)}</td></tr>`
	}
	else {
		for (let i = 0; i < files.length; i += columns) {
			htmlContent += '<tr>'
			for (let j = 0; j < columns; j++) {
				if (i + j < files.length) {
					htmlContent += generateIconCellHtml(pageTitleType, pngIconsDirAbs, files[i + j])
				}
				else {
					htmlContent += '<td></td><td></td>'
				}
			}
			htmlContent += '</tr>'
		}
	}
	htmlContent += `</tbody></table></div></body></html>`
	return htmlContent
} //<

async function generateHtmlAndScreenshot( //>
	page: Page,
	pageTitleType: string,
	pngIconsDirAbs: string,
	htmlOutputDirAbs: string,
	finalImageOutputDirAbs: string,
	isLastInSection: boolean = false,
	logPrefix: string = '│  ├─',
	silent: boolean = false,
): Promise<boolean> {
	const htmlFilePath = path.join(htmlOutputDirAbs, `${pageTitleType}_icons.html`)
	const effectiveLogPrefix = isLastInSection ? logPrefix.replace('├', '└') : logPrefix

	try {
		if (!silent)
			console.log(`${effectiveLogPrefix} Generating HTML for ${pageTitleType} icons...`)

		const htmlContent = generateHtmlContent(pageTitleType, pngIconsDirAbs, silent)

		fs.writeFileSync(htmlFilePath, htmlContent)

		const pageUrl = `file://${htmlFilePath.replace(/\\/g, '/')}`

		if (!silent)
			console.log(`│  │  ├─ Navigating to HTML page: ${pageUrl}`)
		await page.goto(pageUrl, { waitUntil: 'load' })

		const containerElement = await page.$('.container')

		if (containerElement) {
			const outputPath = path.join(finalImageOutputDirAbs, `${pageTitleType}_icons_preview.png`)

			await containerElement.screenshot({ path: outputPath as `${string}.png` | `${string}.jpeg` | `${string}.webp` })
			if (!silent) {
				console.log(
					`│  │  └─ ${ansii.green}Success:${ansii.none} Screenshot saved: ${path.relative(MONOREPO_ROOT, outputPath)}`,
				)
			}
			return true
		}
		else {
			if (!silent) {
				console.warn(
					`│  │  └─ ${ansii.yellow}WARN:${ansii.none} Could not find .container for screenshot: ${pageTitleType}`,
				)
			}
			return false
		}
	}
	catch (error) {
		if (!silent) {
			console.error(
				`│  │  └─ ${ansii.red}ERROR:${ansii.none} in generateHtmlAndScreenshot for ${pageTitleType}:`,
				error,
			)
		}
		return false
	}
} //<

export async function main( //>
	previewType: 'all' | 'file' | 'folder' = 'all',
	silent: boolean = false,
): Promise<boolean> {
	if (!silent)
		console.log(`\nCREATE ICON PREVIEW IMAGES (${previewType.toUpperCase()})`)

	const tempDirs = [PNG_TEMP_ROOT_DIR_ABS, FILE_ICONS_PNG_DIR_ABS, FOLDER_ICONS_PNG_DIR_ABS, FOLDER_OPEN_ICONS_PNG_DIR_ABS]

	if (!silent)
		console.log(`├─ ${ansii.gold}Preparing Temporary Directories${ansii.none}`)
	try {
		for (const dir of tempDirs) {
			if (fs.existsSync(dir))
				await fsPromises.rm(dir, { recursive: true, force: true })
			await createDirectory(dir, silent)
		}
		await createDirectory(FINAL_IMAGE_OUTPUT_DIR_ABS, silent)
		if (!silent)
			console.log(`│  └─ ${ansii.green}Success:${ansii.none} Temporary directories prepared.`)
	}
	catch (error) {
		if (!silent)
			console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Preparing temporary directories:`, error)
		return false
	}

	if (!silent)
		console.log(`├─ ${ansii.gold}Converting SVGs to PNGs for Previews${ansii.none}`)

	let success = true
	let ranAnyConversion = false

	if (previewType === 'all' || previewType === 'file') {
		const fileConversionSuccess = await convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FILE_ICONS_SVG_DIR_ABS, FILE_ICONS_PNG_DIR_ABS, undefined, previewType === 'file', '│  ├─', silent)

		if (!fileConversionSuccess && fs.existsSync(FILE_ICONS_SVG_DIR_ABS))
			success = false // Only fail if source exists but conversion fails
		if (fs.existsSync(FILE_ICONS_SVG_DIR_ABS))
			ranAnyConversion = true
	}
	if (previewType === 'all' || previewType === 'folder') {
		const folderConversionSuccess = await convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FOLDER_ICONS_SVG_DIR_ABS, FOLDER_ICONS_PNG_DIR_ABS, file => !file.endsWith('-open.svg'), false, '│  ├─', silent)

		if (!folderConversionSuccess && fs.existsSync(FOLDER_ICONS_SVG_DIR_ABS))
			success = false
		if (fs.existsSync(FOLDER_ICONS_SVG_DIR_ABS))
			ranAnyConversion = true

		const folderOpenConversionSuccess = await convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FOLDER_ICONS_SVG_DIR_ABS, FOLDER_OPEN_ICONS_PNG_DIR_ABS, file => file.endsWith('-open.svg'), true, '│  ├─', silent)

		if (!folderOpenConversionSuccess && fs.existsSync(FOLDER_ICONS_SVG_DIR_ABS))
			success = false
		// ranAnyConversion already true if folder icons exist
	}
	if (!ranAnyConversion && !silent) {
		console.log(`│  └─ ${ansii.yellow}No relevant SVG icon source directories found to convert.${ansii.none}`)
	}

	if (!silent)
		console.log(`├─ ${ansii.gold}Generating HTML & Capturing Screenshots${ansii.none}`)

	let browser: Browser | null = null

	try {
		browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })

		const page = await browser.newPage()

		if (previewType === 'all' || previewType === 'file') {
			if (!await generateHtmlAndScreenshot(page, 'File', FILE_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS, previewType === 'file', '│  ├─', silent))
				success = false
		}
		if (previewType === 'all' || previewType === 'folder') {
			if (!await generateHtmlAndScreenshot(page, 'Folder', FOLDER_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS, false, '│  ├─', silent))
				success = false
			if (!await generateHtmlAndScreenshot(page, 'Folder_Open', FOLDER_OPEN_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS, true, '│  ├─', silent))
				success = false
		}
	}
	catch (error) {
		if (!silent)
			console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Puppeteer process failed:`, error)
		success = false
	}
	finally {
		if (browser)
			await browser.close()
	}

	if (CLEANUP_TEMP_FILES) {
		if (!silent)
			console.log(`├─ ${ansii.gold}Cleaning up temporary files...${ansii.none}`)
		try {
			await fsPromises.rm(PNG_TEMP_ROOT_DIR_ABS, { recursive: true, force: true })
			if (!silent)
				console.log(`│  └─ ${ansii.green}Success:${ansii.none} Temporary files cleaned up.`)
		}
		catch (error) {
			if (!silent)
				console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} cleaning temporary files:`, error)
			// Do not mark overall success as false for cleanup failure
		}
	}
	if (!silent)
		console.log(`└─ ICON PREVIEW GENERATION (${previewType.toUpperCase()}) ${success ? 'COMPLETE' : 'FAILED'}`)
	return success
} //<

// Standalone execution
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) { //>
	const previewTypeArg = (process.argv[2] as 'all' | 'file' | 'folder') || 'all'

	main(previewTypeArg, false).catch((error) => {
		console.error(`${ansii.red}FATAL ERROR in generate_icon_previews.ts (standalone):${ansii.none}`, error)
		process.exit(1)
	})
} //<
