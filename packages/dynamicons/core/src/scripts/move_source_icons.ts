import * as fs from 'node:fs/promises'
import * as path from 'node:path'

// --- Configuration ---
const sourceDirectory = 'D:/_dev/!Projects/focused-ux/icons'
const destinationDirectory = 'D:/_dev/!Projects/focused-ux/focused-ux/packages/dynamicons/core/src/icons'
// ---------------------

async function manageIconFiles() {
	console.log(`Source directory: ${sourceDirectory}`)
	console.log(`Destination directory: ${destinationDirectory}`)

	// --- Step 1: Delete PNG files from the source directory ---
	console.log('\n--- Deleting PNG files ---')
	try {
		const filesInSource = await fs.readdir(sourceDirectory)
		let pngDeletedCount = 0

		for (const file of filesInSource) {
			if (file.toLowerCase().endsWith('.png')) {
				const filePath = path.join(sourceDirectory, file)

				try {
					await fs.unlink(filePath)
					console.log(`Deleted PNG: ${filePath}`)
					pngDeletedCount++
				}
				catch (err) {
					console.error(`Error deleting PNG file ${filePath}:`, err)
				}
			}
		}
		console.log(`${pngDeletedCount} PNG file(s) processed for deletion.`)
	}
	catch (err) {
		console.error(`Error reading source directory ${sourceDirectory} for PNG deletion:`, err)
		// If we can't read the source, we probably shouldn't proceed.
		return
	}

	// --- Step 2: Move SVG files from source to destination ---
	console.log('\n--- Moving SVG files ---')
	try {
		// Ensure destination directory exists
		try {
			await fs.mkdir(destinationDirectory, { recursive: true })
			console.log(`Ensured destination directory exists: ${destinationDirectory}`)
		}
		catch (mkdirErr) {
			console.error(`Error creating destination directory ${destinationDirectory}:`, mkdirErr)
			console.log('Cannot proceed with moving SVG files.')
			return
		}

		const filesInSourceAgain = await fs.readdir(sourceDirectory) // Re-read in case of any changes
		let svgMovedCount = 0

		for (const file of filesInSourceAgain) {
			if (file.toLowerCase().endsWith('.svg')) {
				const sourceFilePath = path.join(sourceDirectory, file)
				const destinationFilePath = path.join(destinationDirectory, file)

				try {
					await fs.rename(sourceFilePath, destinationFilePath)
					console.log(`Moved SVG: ${sourceFilePath} -> ${destinationFilePath}`)
					svgMovedCount++
				}
				catch (err) {
					console.error(`Error moving SVG file ${sourceFilePath} to ${destinationFilePath}:`, err)
					// Attempt to copy and then delete if rename fails (e.g., cross-device move, though unlikely here)
					// For simplicity, this example doesn't implement a copy-then-delete fallback for rename.
				}
			}
		}
		console.log(`${svgMovedCount} SVG file(s) moved.`)
	}
	catch (err) {
		console.error(`Error reading source directory ${sourceDirectory} for SVG moving:`, err)
	}

	console.log('\nScript finished.')
}

// Run the main function
manageIconFiles().catch((error) => {
	console.error('An unexpected error occurred in the script:', error)
})
