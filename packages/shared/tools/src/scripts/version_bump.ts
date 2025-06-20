// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

//--------------------------------------------------------------------------------------------------------------<<

// Define a basic type for the relevant parts of package.json
interface PackageJson {
	version: string
	// Add other properties if you need to interact with them
	[key: string]: any // Allow other properties
}

// The script determines the target package.json from its current working directory.
const packageJsonPath = path.join(process.cwd(), 'package.json')

try {
	const fileContent = readFileSync(packageJsonPath, 'utf-8')
	const packageJson: PackageJson = JSON.parse(fileContent)

	if (typeof packageJson.version !== 'string') {
		throw new TypeError('Version in package.json is not a string.')
	}

	const versionParts = packageJson.version.split('.').map(Number)
	if (versionParts.length !== 3 || versionParts.some(Number.isNaN)) {
		throw new Error(`Invalid version format: ${packageJson.version}`)
	}

	let [major, minor, patch] = versionParts

	patch++

	packageJson.version = `${major}.${minor}.${patch}`
	writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 4)}\n`)

	console.log(`Version updated to ${packageJson.version}`)
} catch (error) {
	console.error(`Error bumping version for ${packageJsonPath}:`, error instanceof Error ? error.message : String(error))
	process.exit(1)
}