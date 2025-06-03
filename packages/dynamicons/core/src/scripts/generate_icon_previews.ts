/*
SCRIPT: generate_icon_previews.ts
PURPOSE:
  Generates HTML previews of SVG icons (converted to PNGs for the HTML)
  and then captures screenshots of these HTML pages to create PNG preview images.
  This is useful for documentation or marketplace assets.

USAGE:
  Ensure you have ts-node, typescript, puppeteer, and sharp installed.
  (e.g., npm i -g ts-node typescript; npm i --save-dev puppeteer sharp @types/puppeteer @types/sharp)
  Run from the project root:
  npx ts-node --esm src/scripts/ts/generate_icon_previews.ts

PREQUISITES:
  1. SVG Icons:
     - Optimized SVG icons should be present in:
       - 'assets/icons/file_icons/'
       - 'assets/icons/folder_icons/'
     (These are typically the output of the 'optimize_icons.ts' script).
  2. Dependencies: Puppeteer for headless browser, Sharp for image manipulation.

OUTPUT:
  - PNG preview images in 'assets/images/':
    - 'File_icons_preview.png'
    - 'Folder_icons_preview.png'
    - 'Folder_Open_icons_preview.png'
  - Temporary PNG icons and HTML files are created in 'assets/icons/png_icons/' during execution
    and can be optionally deleted by uncommenting the cleanup line in `main()`.

IMPORTANT:
  - Ensure all paths are correctly configured.
  - Puppeteer will download a browser if it hasn't already.
*/

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

// --- Configuration ---
const PROJECT_ROOT = path.resolve(__dirname, '../../../')

const FILE_ICONS_SVG_DIR_ABS = path.join(PROJECT_ROOT, 'assets/icons/file_icons')
const FOLDER_ICONS_SVG_DIR_ABS = path.join(PROJECT_ROOT, 'assets/icons/folder_icons')

const PNG_TEMP_ROOT_DIR_ABS = path.join(PROJECT_ROOT, 'assets/icons/png_icons')
const FILE_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'file_icons_png')
const FOLDER_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'folder_icons_png')
const FOLDER_OPEN_ICONS_PNG_DIR_ABS = path.join(PNG_TEMP_ROOT_DIR_ABS, 'folder_open_icons_png')

const HTML_OUTPUT_DIR_ABS = PNG_TEMP_ROOT_DIR_ABS
const FINAL_IMAGE_OUTPUT_DIR_ABS = path.join(PROJECT_ROOT, 'assets/images')

const ICON_SIZE_FOR_PNG_CONVERSION = 16
const HTML_COLUMNS = 5

const ansii = {
	none: '\x1B[0m',
	bold: '\x1B[1m',
	blueLight: '\x1B[38;5;153m',
	gold: '\x1B[38;5;179m',
	red: '\x1B[38;5;9m',
	yellow: '\x1B[38;5;226m',
}

// --- Helper Functions ---

async function createDirectory(directoryPath: string): Promise<void> { //>
	try {
		await fsPromises.mkdir(directoryPath, { recursive: true })
	}
	catch (err: any) {
		if (err.code !== 'EEXIST') {
			console.error(`Error creating directory ${path.relative(PROJECT_ROOT, directoryPath)}:`, err)
			throw err
		}
	}
} //<

async function convertSvgToPng(size: number, svgFilePath: string, outputPngPath: string): Promise<void> { //>
	try {
		await sharp(svgFilePath)
			.resize(size, size)
			.png()
			.toFile(outputPngPath)
	}
	catch (error) {
		console.error(`Error converting ${path.basename(svgFilePath)} to PNG at ${outputPngPath}:`, error)
		throw error // Re-throw to be caught by caller
	}
} //<

async function convertSvgsToPngs( //>
	size: number,
	svgIconsDirAbs: string,
	pngOutputDirAbs: string,
	filter: (filename: string) => boolean = () => true,
): Promise<void> {
	console.log(`   ├─ Converting SVGs from ${path.basename(svgIconsDirAbs)} to PNGs in ${path.basename(pngOutputDirAbs)}...`)
	if (!fs.existsSync(svgIconsDirAbs)) {
		console.log(`   │   └─ ${ansii.yellow}WARN:${ansii.none} Source SVG directory not found: ${path.relative(PROJECT_ROOT, svgIconsDirAbs)}. Skipping conversion.`)
		return
	}
	try {
		const iconFiles = fs.readdirSync(svgIconsDirAbs).filter(file => file.endsWith('.svg') && filter(file))
		if (iconFiles.length === 0) {
			console.log(`   │   └─ No matching SVG files found in ${path.relative(PROJECT_ROOT, svgIconsDirAbs)}.`)
			return
		}
		await createDirectory(pngOutputDirAbs)

		const convertPromises = iconFiles.map(async (file) => {
			const svgFilePath = path.join(svgIconsDirAbs, file)
			const pngFileName = `${path.parse(file).name}.png`
			const outputPngPath = path.join(pngOutputDirAbs, pngFileName)
			await convertSvgToPng(size, svgFilePath, outputPngPath)
		})
		await Promise.all(convertPromises)
		console.log(`   │   └─ ${ansii.gold}Success:${ansii.none} Finished converting ${iconFiles.length} icons.`)
	}
	catch (error) {
		console.error(`   │   └─ ${ansii.red}ERROR:${ansii.none} during SVG to PNG conversion for directory ${path.basename(svgIconsDirAbs)}:`, error)
		// Decide if this should be fatal for the whole script
	}
} //<
      
function generateIconCellHtml( //>
	_pageTitleType: string,
	pngIconsDirAbsForCell: string, // Pass the absolute path to the specific PNG dir (e.g., FILE_ICONS_PNG_DIR_ABS)
	_pngIconsDirRelForHtml: string, // No longer needed for this approach
	file: string, // Just the filename, e.g., "my-icon.png"
): string {
	let iconName = path.parse(file).name
	iconName = iconName.replace(/-open$/, '').replace(/^folder-/, '')

	// Construct an absolute file URI for the image source
	const absolutePngPath = path.join(pngIconsDirAbsForCell, file)
	const imgSrc = `file://${absolutePngPath.replace(/\\/g, '/')}` // Ensure POSIX separators for URL

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
): string {
	let files: string[] = []
	try {
		if (fs.existsSync(pngIconsDirAbs)) {
			files = fs.readdirSync(pngIconsDirAbs).filter(f => f.endsWith('.png'))
		}
		else {
			console.warn(`   │   └─ ${ansii.yellow}WARN:${ansii.none} PNG directory not found for HTML generation: ${path.relative(PROJECT_ROOT, pngIconsDirAbs)}`)
		}
	}
	catch (error) {
		console.error(`   │   └─ ${ansii.red}ERROR:${ansii.none} reading PNG directory ${path.relative(PROJECT_ROOT, pngIconsDirAbs)}:`, error)
	}
	
	const marPad = 10
	const columns = HTML_COLUMNS
	const _pngIconsDirRelForHtml = path.posix.relative(HTML_OUTPUT_DIR_ABS, pngIconsDirAbs)

	let htmlContent = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>${pageTitleType.replace('_', ' ')} Icons</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Hind&display=swap');
                body { background-color: #090a0c; margin: 0px; padding: 0; }
                .container { background-color: #090a0c; text-align: center; margin: ${marPad}px; width: fit-content; display: inline-block; }
                h1 { background-color: #090a0c; color: #EEEEEE; text-align: center; margin: 0 auto; padding: 0 0 10px 0; font-family: "Hind", sans-serif; }
                table { background-color: #090a0c; color: #EEEEEE; margin: 0 auto; border-collapse: collapse; }
                th, td { font-family: "Hind", sans-serif; font-weight: 400; font-style: normal; }
                th { font-size: 15px; font-weight: 600; }
                td { font-size: 12px; }
                th:nth-child(odd), td:nth-child(odd) { text-align: center; width: 40px; } /* Icon */
                th:nth-child(even), td:nth-child(even) { text-align: left; vertical-align: middle; width: 100px; } /* Name */
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${pageTitleType.replace('_', ' ')} Icons</h1>
                <table><thead><tr>`
	for (let i = 0; i < columns; i++) { htmlContent += `<th>Icon</th><th>Name</th>` }
	htmlContent += `</tr></thead><tbody>`

	if (files.length === 0) {
		htmlContent += `<tr><td colspan="${columns * 2}">No PNG icons found in ${path.relative(PROJECT_ROOT, pngIconsDirAbs)}</td></tr>`
	}
	else {
		for (let i = 0; i < files.length; i += columns) {
			htmlContent += '<tr>'
			for (let j = 0; j < columns; j++) {
				if (i + j < files.length) {
					// Pass pngIconsDirAbs directly to generateIconCellHtml
					htmlContent += generateIconCellHtml(pageTitleType, pngIconsDirAbs, '', files[i + j])
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
	pngIconsDirAbs: string, // Absolute path to the directory containing PNGs for this type
	htmlOutputDirAbs: string, // Where to save the temporary HTML file
	finalImageOutputDirAbs: string, // Where to save the final screenshot
): Promise<void> {
	const htmlFilePath = path.join(htmlOutputDirAbs, `${pageTitleType}_icons.html`)
	try {
		console.log(`   │   ├─ Generating HTML for ${pageTitleType} icons...`)
		const htmlContent = generateHtmlContent(pageTitleType, pngIconsDirAbs)
		fs.writeFileSync(htmlFilePath, htmlContent)

		console.log(`   │   ├─ Navigating to HTML page: file://${htmlFilePath}`)
		await page.goto(`file://${htmlFilePath}`, { waitUntil: 'networkidle0' })
		
		console.log(`   │   ├─ Locating .container element for ${pageTitleType}...`)
		const containerElement = await page.$('.container')

		if (containerElement) {
			const outputPath = path.join(finalImageOutputDirAbs, `${pageTitleType}_icons_preview.png`)
			console.log(`   │   ├─ Capturing screenshot for ${pageTitleType} to ${path.relative(PROJECT_ROOT, outputPath)}...`)
			// Assert the type for the path property
			await containerElement.screenshot({
				path: outputPath as `${string}.png` | `${string}.jpeg` | `${string}.webp`,
			})
			console.log(`   │   └─ ${ansii.gold}Success:${ansii.none} Screenshot saved for ${pageTitleType}.`)
		}
		else {
			console.warn(`   │   └─ ${ansii.yellow}WARN:${ansii.none} Could not find .container element for screenshot: ${pageTitleType}`)
		}
	}
	catch (error) {
		console.error(`   │   └─ ${ansii.red}ERROR:${ansii.none} in generateHtmlAndScreenshot for ${pageTitleType} (HTML: ${htmlFilePath}):`, error)
	}
} //<

async function main(): Promise<void> { //>
	console.log(`\n┌─ ${ansii.bold}${ansii.blueLight}CREATE ICON PREVIEW IMAGES${ansii.none}`)

	const tempDirs = [PNG_TEMP_ROOT_DIR_ABS, FILE_ICONS_PNG_DIR_ABS, FOLDER_ICONS_PNG_DIR_ABS, FOLDER_OPEN_ICONS_PNG_DIR_ABS]
	console.log('├─── Preparing Temporary Directories')
	try {
		for (const dir of tempDirs) {
			if (fs.existsSync(dir)) {
				await fsPromises.rm(dir, { recursive: true, force: true })
			}
			await createDirectory(dir)
		}
		await createDirectory(FINAL_IMAGE_OUTPUT_DIR_ABS)
		console.log(`   └─ ${ansii.gold}Success:${ansii.none} Temporary directories prepared.`)
	}
	catch (error) {
		console.error(`   └─ ${ansii.red}ERROR:${ansii.none} Preparing temporary directories:`, error)
		process.exit(1)
	}

	console.log('├─── Converting SVGs to PNGs for Previews')
	try {
		await convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FILE_ICONS_SVG_DIR_ABS, FILE_ICONS_PNG_DIR_ABS)
		await convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FOLDER_ICONS_SVG_DIR_ABS, FOLDER_ICONS_PNG_DIR_ABS, file => !file.endsWith('-open.svg'))
		await convertSvgsToPngs(ICON_SIZE_FOR_PNG_CONVERSION, FOLDER_ICONS_SVG_DIR_ABS, FOLDER_OPEN_ICONS_PNG_DIR_ABS, file => file.endsWith('-open.svg'))
	}
	catch (error) {
		console.error(`   └─ ${ansii.red}ERROR:${ansii.none} During SVG to PNG conversion phase:`, error)
		// Decide if this is fatal
	}

	console.log('├─── Generating HTML & Capturing Screenshots')
	let browser: Browser | null = null
	try {
		console.log(`   ├─ Launching Puppeteer...`)
		browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }) // Added no-sandbox for CI environments
		const page = await browser.newPage()
		console.log(`   └─ ${ansii.gold}Success:${ansii.none} Puppeteer launched.`)

		await generateHtmlAndScreenshot(page, 'File', FILE_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS)
		await generateHtmlAndScreenshot(page, 'Folder', FOLDER_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS)
		await generateHtmlAndScreenshot(page, 'Folder_Open', FOLDER_OPEN_ICONS_PNG_DIR_ABS, HTML_OUTPUT_DIR_ABS, FINAL_IMAGE_OUTPUT_DIR_ABS)
	}
	catch (error) {
		console.error(`   └─ ${ansii.red}ERROR:${ansii.none} Puppeteer process failed:`, error)
	}
	finally {
		if (browser) {
			console.log('├─── Closing Puppeteer...')
			await browser.close()
			console.log(`   └─ ${ansii.gold}Success:${ansii.none} Puppeteer closed.`)
		}
	}
	
	// Optional: Clean up temporary PNGs and HTML files
	// console.log('├─── Cleaning up temporary files');
	// await fsPromises.rm(PNG_TEMP_ROOT_DIR_ABS, { recursive: true, force: true });

	console.log(`└─ ${ansii.bold}${ansii.blueLight}ICON PREVIEW GENERATION COMPLETE${ansii.none}\n`)
} //<

main().catch((error) => {
	console.error(`${ansii.red}FATAL ERROR in main execution:${ansii.none}`, error)
	process.exit(1)
})
