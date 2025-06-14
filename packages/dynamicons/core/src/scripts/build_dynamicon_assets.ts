// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import process from 'node:process'
// Import path for relative path calculation if needed

//= IMPLEMENTATIONS ===========================================================================================
import type { OptimizationDetail, OptimizeIconsResult } from './generate_optimized_icons.js'
import { main as optimizeIconsMain } from './generate_optimized_icons.js'
import { main as generateManifestsMain } from './generate_icon_manifests.js'
import { main as generatePreviewsMain } from './generate_icon_previews.js'

//--------------------------------------------------------------------------------------------------------------<<

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
} //<

function formatOptimizationDetailLine( //>
	detail: OptimizationDetail,
	type: 'file' | 'folder',
	currentCount: number,
	totalCount: number,
	maxPrefixAndNameLength: number,
): string {
	const countStr = `${String(currentCount).padStart(String(totalCount).length, ' ')} of ${totalCount}`
	const descriptionPrefix = `        ${countStr} ${type}: `
	const descriptionText = `${detail.fileName}`
	const currentPrefixAndNameLength = descriptionPrefix.length + descriptionText.length
	
	const statsPart = `( ${String(detail.originalSize).padStart(6)} -> ${String(detail.optimizedSize).padStart(6)} | ${String(detail.reduction).padStart(6)} | ${detail.percentage.padStart(5)}% )`

	const paddingNeeded = Math.max(1, (maxPrefixAndNameLength - currentPrefixAndNameLength) + 2)
	
	return `${descriptionPrefix}${descriptionText}${' '.repeat(paddingNeeded)}${statsPart}`
} //<

async function run(): Promise<void> { //>
	const arg = (process.argv[2] as 'all' | 'file' | 'folder' | undefined) || 'all'
	let overallSuccess = true
	let stepCounter = 1

	// --- Step 1: Optimize Icons ---
	console.log(`\n${ansii.blueLight}[Step ${stepCounter++}: Optimizing Icons (${arg.toUpperCase()})...]${ansii.none}`)

	const optResult: OptimizeIconsResult = await optimizeIconsMain(arg, true)

	if (optResult.artboardFilesRemoved > 0 || optResult.pngFilesRemoved > 0) {
		if (optResult.artboardFilesRemoved > 0)
			console.log(`    ${ansii.dim}- ${optResult.artboardFilesRemoved} Artboard SVG files removed from source.${ansii.none}`)
		if (optResult.pngFilesRemoved > 0)
			console.log(`    ${ansii.dim}- ${optResult.pngFilesRemoved} PNG files removed from source.${ansii.none}`)
	} else {
		console.log(`    ${ansii.dim}- No unwanted Artboard SVGs or PNGs found in source to remove.${ansii.none}`)
	}

	let anyIconsOptimizedThisStep = false

	if (optResult.filesAttempted) {
		console.log(`    ${ansii.gold}Files:${ansii.none}`)
		if (optResult.fileOptimizationDetails.length > 0) {
			let maxFilePrefixAndNameLength = 0

			optResult.fileOptimizationDetails.forEach((detail, index) => {
				const countStr = `${String(index + 1).padStart(String(optResult.fileOptimizationDetails.length).length, ' ')} of ${optResult.fileOptimizationDetails.length}`
				const prefix = `        ${countStr} file: `

				maxFilePrefixAndNameLength = Math.max(maxFilePrefixAndNameLength, prefix.length + detail.fileName.length)
			})

			optResult.fileOptimizationDetails.forEach((detail, index) => {
				console.log(formatOptimizationDetailLine(detail, 'file', index + 1, optResult.fileOptimizationDetails.length, maxFilePrefixAndNameLength))
			})
			anyIconsOptimizedThisStep = true
		} else {
			console.log(`        No file SVG files to optimize in ${optResult.sourceIconDirRelative}`)
		}
	}

	if (optResult.foldersAttempted) {
		console.log(`    ${ansii.gold}Folders:${ansii.none}`)
		if (optResult.folderOptimizationDetails.length > 0) {
			let maxFolderPrefixAndNameLength = 0

			optResult.folderOptimizationDetails.forEach((detail, index) => {
				const countStr = `${String(index + 1).padStart(String(optResult.folderOptimizationDetails.length).length, ' ')} of ${optResult.folderOptimizationDetails.length}`
				const prefix = `        ${countStr} folder: `

				maxFolderPrefixAndNameLength = Math.max(maxFolderPrefixAndNameLength, prefix.length + detail.fileName.length)
			})

			optResult.folderOptimizationDetails.forEach((detail, index) => {
				console.log(formatOptimizationDetailLine(detail, 'folder', index + 1, optResult.folderOptimizationDetails.length, maxFolderPrefixAndNameLength))
			})
			anyIconsOptimizedThisStep = true
		} else {
			console.log(`        No folder SVG files to optimize in ${optResult.sourceIconDirRelative}`)
		}
	}

	if (anyIconsOptimizedThisStep) {
		console.log(`    ${ansii.green}✓ Icons optimized successfully.${ansii.none}`)
	} else {
		console.log(`    ${ansii.blueLight}✓ No icons processed for optimization based on argument '${arg}'.${ansii.none}`)
	}

	// --- Step 2: Generate Icon Manifests ---
	const shouldGenerateManifests = optResult.filesAttempted || optResult.foldersAttempted

	if (shouldGenerateManifests) {
		console.log(`\n${ansii.blueLight}[Step ${stepCounter++}: Generating Icon Manifests...]${ansii.none}`)

		const manifestsSuccess = await generateManifestsMain(true)

		if (manifestsSuccess) {
			console.log(`  ${ansii.green}✓ Icon manifests generated successfully.${ansii.none}`)
		} else {
			console.error(`  ${ansii.red}✗ Error generating icon manifests.${ansii.none}`)
			overallSuccess = false
		}
	} else {
		console.log(`\n${ansii.blueLight}[Step ${stepCounter++}: Generating Icon Manifests (Skipped - No relevant icon types processed)]${ansii.none}`)
	}

	// --- Step 3: Generate Icon Previews ---
	let previewTypeToRun: 'all' | 'file' | 'folder' | 'none' = 'none'

	if (arg === 'all' && (optResult.filesFoundForOptimization > 0 || optResult.foldersFoundForOptimization > 0)) {
		previewTypeToRun = 'all'
	} else if (arg === 'file' && optResult.filesFoundForOptimization > 0) {
		previewTypeToRun = 'file'
	} else if (arg === 'folder' && optResult.foldersFoundForOptimization > 0) {
		previewTypeToRun = 'folder'
	}

	if (previewTypeToRun !== 'none') {
		console.log(`\n${ansii.blueLight}[Step ${stepCounter++}: Generating Icon Previews (${previewTypeToRun.toUpperCase()})...]${ansii.none}`)

		const previewsSuccess = await generatePreviewsMain(previewTypeToRun, true)

		if (previewsSuccess) {
			console.log(`  ${ansii.green}✓ Icon previews generated successfully.${ansii.none}`)
		} else {
			console.error(`  ${ansii.red}✗ Error generating icon previews.${ansii.none}`)
			overallSuccess = false
		}
	} else {
		console.log(`\n${ansii.blueLight}[Step ${stepCounter++}: Generating Icon Previews (Skipped - No relevant icons found/optimized for '${arg}')]${ansii.none}`)
	}

	// Final summary (simple version, no banner)
	if (!overallSuccess) {
		console.log(`\n${ansii.red}${ansii.bold}DYNAMICONS ASSET BUILD COMPLETED WITH ERRORS. Review logs.${ansii.none}\n`)
		process.exit(1)
	} else {
		console.log(`\n${ansii.green}${ansii.bold}DYNAMICONS ASSET BUILD COMPLETED SUCCESSFULLY!${ansii.none}\n`)
	}
} //<

run().catch((error) => {
	console.error(`${ansii.red}Unhandled error in build_dynamicon_assets.ts:${ansii.none}`, error)
	process.exit(1)
})
