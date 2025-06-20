// packages/context-cherry-picker-ext/package-vsix.js
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { rimrafSync } from 'rimraf'

const vsixOutputDir = path.resolve(process.cwd(), '..', '..', '..', 'vsix_packages')
const stagingDir = path.join(process.cwd(), 'vsce_stage')
const packageSourceDir = path.join(stagingDir, 'package')
const packageJsonPath = path.join(process.cwd(), 'package.json')

async function main() { //>
	try {
		// 1. Clean and create staging directory
		console.log(`INFO: Cleaning and creating staging directory: ${packageSourceDir}`)
		if (fs.existsSync(stagingDir)) {
			rimrafSync(stagingDir)
		}
		fs.mkdirSync(packageSourceDir, { recursive: true })

		// 2. Copy necessary files to staging directory
		console.log('INFO: Copying production files to staging directory...')

		const filesToCopy = [
			'dist',
			'assets',
			'node_modules',
			'package.json',
			'LICENSE.txt',
			'.vscodeignore', // Re-add this line
		]

		for (const file of filesToCopy) {
			const sourcePath = path.join(process.cwd(), file)
			const destPath = path.join(packageSourceDir, file)

			if (fs.existsSync(sourcePath)) {
				fs.cpSync(sourcePath, destPath, { recursive: true })
				console.log(` -> Copied ${file}`)
			}
			else {
				console.warn(`WARN: Source file/directory not found, skipping copy: ${sourcePath}`)
			}
		}
		console.log('INFO: File copying complete.')

		// 3. Get package version for naming the .vsix file
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
		const vsixFileName = `${packageJson.name}-${packageJson.version}.vsix`
		const absoluteVsixOutputPath = path.join(vsixOutputDir, vsixFileName)

		// 4. Run vsce package command from within the staged directory
		const vsceCommand = `vsce package --no-dependencies --out "${absoluteVsixOutputPath}"`

		console.log(`INFO: Changing directory to: ${packageSourceDir}`)
		console.log(`INFO: Executing from within staging: ${vsceCommand}`)

		execSync(vsceCommand, { cwd: packageSourceDir, stdio: 'inherit' })
		console.log(`VSIX packaged successfully to: ${absoluteVsixOutputPath}`)
	}
	catch (error) {
		console.error('Error during VSIX packaging:', error.message)
		if (error.stdout)
			console.error('Stdout:', error.stdout.toString())
		if (error.stderr)
			console.error('Stderr:', error.stderr.toString())
		process.exit(1)
	}
	finally {
		// 5. Clean up staging directory
		if (fs.existsSync(stagingDir)) {
			console.log(`INFO: Cleaning up staging directory: ${stagingDir}`)
			// rimrafSync(stagingDir);
		}
	}
} //<

main().catch((error) => { //>
	console.error('Unhandled error in package-vsix.js:', error)
	process.exit(1)
}) //<
