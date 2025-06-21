// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import process from 'node:process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

//= IMPLEMENTATIONS ===========================================================================================
import type { OptimizationDetail, OptimizeIconsResult } from './generate_optimized_icons.js'
import { main as optimizeIconsMain } from './generate_optimized_icons.js'
import { main as generateManifestsMain } from './generate_icon_manifests.js'
import { main as generatePreviewsMain } from './generate_icon_previews.js'
import { TreeFormatterService, type TreeFormatterNode } from '@focused-ux/shared-services/node'

//--------------------------------------------------------------------------------------------------------------<<

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const EXTERNAL_ICONS_SOURCE_DIR = 'D:/_dev/!Projects/focused-ux/icons'
const INTERNAL_ICONS_DEST_DIR = path.resolve(__dirname, '../icons')

const ansii = { //>
	none: '\x1B[0m',
	bold: '\x1B[1m',
	blue: '\x1B[34m',
	blueLight: '\x1B[38;5;153m',
	gold: '\x1B[38;5;179m',
	green: '\x1B[32m',
	red: '\x1B[31m',
	dim: '\x1B[2m',
	yellow: '\x1B[33m',
	purple: '\x1B[38;5;141m',
} //<

async function localizeNewIcons(): Promise<boolean> { //>
	console.log(`\n${ansii.blueLight}[Step 1: Checking for New Icons...]${ansii.none}`)

	let sourceFiles

	try {
		sourceFiles = await fs.readdir(EXTERNAL_ICONS_SOURCE_DIR)
	}
	catch (error: any) {
		if (error.code === 'ENOENT') {
			console.log(`    ${ansii.dim}- External source directory not found, skipping localization: ${EXTERNAL_ICONS_SOURCE_DIR}${ansii.none}`)
			return true // Not a failure, just nothing to do. Allow build to continue with existing icons.
		}
		console.error(`    ${ansii.red}✗ Error reading external source directory: ${error.message}${ansii.none}`)
		return false // A real error occurred, fail the build.
	}

	const svgFilesToMove = sourceFiles.filter(file => file.toLowerCase().endsWith('.svg'))

	if (svgFilesToMove.length === 0) {
		console.log(`    ${ansii.green}✓ No new SVG icons found in external source.${ansii.none}`)
		return true // Nothing to move, but the rest of the build should proceed.
	}

	console.log(`    ${ansii.yellow}- Found ${svgFilesToMove.length} new SVG icon(s). Moving to internal source...${ansii.none}`)
	await fs.mkdir(INTERNAL_ICONS_DEST_DIR, { recursive: true })

	let movedCount = 0

	for (const file of svgFilesToMove) {
		const sourcePath = path.join(EXTERNAL_ICONS_SOURCE_DIR, file)
		const destPath = path.join(INTERNAL_ICONS_DEST_DIR, file)

		try {
			await fs.rename(sourcePath, destPath)
			movedCount++
		}
		catch (err) {
			console.error(`    ${ansii.red}✗ Failed to move ${file}: ${(err as Error).message}${ansii.none}`)
		}
	}

	console.log(`    ${ansii.green}✓ Successfully moved ${movedCount} of ${svgFilesToMove.length} icons.${ansii.none}`)
	return true
} //<

function formatOptimizationResults(result: OptimizeIconsResult, treeFormatter: TreeFormatterService): string { //>
	const rootNode: TreeFormatterNode = { label: 'Optimization Results' }
	const children: TreeFormatterNode[] = []

	const createDetailNode = (detail: OptimizationDetail, type: 'file' | 'folder'): TreeFormatterNode => {
		const statsPart = `( ${String(detail.originalSize).padStart(6)} -> ${String(detail.optimizedSize).padStart(6)} | ${String(detail.reduction).padStart(6)} | ${detail.percentage.padStart(5)}% )`

		return {
			label: `${type}: ${detail.fileName}`,
			details: statsPart,
		}
	}

	if (result.filesAttempted) {
		const fileNodes = result.fileOptimizationDetails.map(detail => createDetailNode(detail, 'file'))

		if (fileNodes.length > 0) {
			children.push({ label: 'Files', isDirectory: true, children: fileNodes })
		}
	}

	if (result.foldersAttempted) {
		const folderNodes = result.folderOptimizationDetails.map(detail => createDetailNode(detail, 'folder'))

		if (folderNodes.length > 0) {
			children.push({ label: 'Folders', isDirectory: true, children: folderNodes })
		}
	}

	rootNode.children = children

	if (children.length > 0) {
		return treeFormatter.formatTree(rootNode)
	}

	return ''
} //<

async function run(): Promise<void> { //>
	const arg = (process.argv[2] as 'all' | 'file' | 'folder' | undefined) || 'all'
	const treeFormatter = new TreeFormatterService()
	let overallSuccess = true
	let stepCounter = 1

	const canProceed = await localizeNewIcons()

	if (!canProceed) {
		process.exit(1) // Exit if localization had a critical error
	}
	stepCounter++

	// Check for any icons to process for optimization/previews
	let internalIcons

	try {
		internalIcons = await fs.readdir(INTERNAL_ICONS_DEST_DIR)
	}
	catch (_e) {
		internalIcons = []
	}

	const hasIconsToProcess = internalIcons.some(file => file.endsWith('.svg'))

	// --- Step 2: Optimize Icons & Generate Previews (if icons exist) ---
	if (hasIconsToProcess) {
		console.log(`\n${ansii.blueLight}[Step ${stepCounter++}: Optimizing Icons (${arg.toUpperCase()})...]${ansii.none}`)

		const optResult = await optimizeIconsMain(arg, true)

		if (optResult.artboardFilesRemoved > 0 || optResult.pngFilesRemoved > 0) {
			if (optResult.artboardFilesRemoved > 0)
				console.log(`    ${ansii.dim}- ${optResult.artboardFilesRemoved} Artboard SVG files removed from source.${ansii.none}`)
			if (optResult.pngFilesRemoved > 0)
				console.log(`    ${ansii.dim}- ${optResult.pngFilesRemoved} PNG files removed from source.${ansii.none}`)
		}
		else {
			console.log(`    ${ansii.dim}- No unwanted Artboard SVGs or PNGs found in source to remove.${ansii.none}`)
		}

		const formattedResults = formatOptimizationResults(optResult, treeFormatter)

		if (formattedResults) {
			console.log(formattedResults)
			console.log(`    ${ansii.green}✓ Icons optimized successfully.${ansii.none}`)
		}
		else {
			console.log(`    ${ansii.blueLight}✓ No icons processed for optimization based on argument '${arg}'.${ansii.none}`)
		}

		// --- Generate Icon Previews ---
		let previewTypeToRun: 'all' | 'file' | 'folder' | 'none' = 'none'

		if (arg === 'all' && (optResult.filesFoundForOptimization > 0 || optResult.foldersFoundForOptimization > 0)) {
			previewTypeToRun = 'all'
		}
		else if (arg === 'file' && optResult.filesFoundForOptimization > 0) {
			previewTypeToRun = 'file'
		}
		else if (arg === 'folder' && optResult.foldersFoundForOptimization > 0) {
			previewTypeToRun = 'folder'
		}

		if (previewTypeToRun !== 'none') {
			console.log(`\n${ansii.blueLight}[Step ${stepCounter++}: Generating Icon Previews (${previewTypeToRun.toUpperCase()})...]${ansii.none}`)

			const previewsSuccess = await generatePreviewsMain(previewTypeToRun, true)

			if (previewsSuccess) {
				console.log(`  ${ansii.green}✓ Icon previews generated successfully.${ansii.none}`)
			}
			else {
				console.error(`  ${ansii.red}✗ Error generating icon previews.${ansii.none}`)
				overallSuccess = false
			}
		}
	}

	// --- Step 3: Generate Icon Manifests (always run) ---
	console.log(`\n${ansii.blueLight}[Step ${stepCounter++}: Generating Icon Manifests...]${ansii.none}`)

	const manifestsSuccess = await generateManifestsMain(true)

	if (manifestsSuccess) {
		console.log(`  ${ansii.green}✓ Icon manifests generated successfully.${ansii.none}`)
	}
	else {
		console.error(`  ${ansii.red}✗ Error generating icon manifests.${ansii.none}`)
		overallSuccess = false
	}

	// Final summary (simple version, no banner)
	if (!overallSuccess) {
		console.log(`\n${ansii.red}${ansii.bold}DYNAMICONS ASSET BUILD COMPLETED WITH ERRORS. Review logs.${ansii.none}\n`)
		process.exit(1)
	}
	else {
		console.log(`\n${ansii.green}${ansii.bold}DYNAMICONS ASSET BUILD COMPLETED SUCCESSFULLY!${ansii.none}\n`)
	}
} //<

run().catch((error) => {
	console.error(`${ansii.red}Unhandled error in build_dynamicon_assets.ts:${ansii.none}`, error)
	process.exit(1)
})
