// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

//= MISC ======================================================================================================
import stripJsonComments from 'strip-json-comments'

//= IMPLEMENTATION TYPES ======================================================================================
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'

//--------------------------------------------------------------------------------------------------------------<<

/**
 * SCRIPT: generate_icon_manifests.ts
 * PURPOSE:
 *   Generates the 'base.theme.json' and a copy (e.g., 'dynamicons.theme.json')
 *   for the VS Code icon theme. This script reads icon definitions and associations
 *   from '.model.json' files and combines them with SVG icons found in specified asset directories.
 *   The output 'base.theme.json' serves as the foundational manifest that the
 *   extension's runtime IconThemeGeneratorService will use to dynamically build the
 *   final theme by incorporating user-specific customizations.
 * 
 * USAGE (Standalone):
 *   npx ts-node --esm packages/dynamicons/core/src/scripts/generate_icon_manifests.ts
 * 
 * PREQUISITES:
 *   1. Optimized SVG Icons: (Assumes optimize_icons.ts has run)
 *      - File Icons: 'packages/dynamicons/ext/assets/icons/file_icons/'
 *      - Folder Icons: 'packages/dynamicons/ext/assets/icons/folder_icons/'
 *   2. Model Files:
 *      - '../models/file_icons.model.json'
 *      - '../models/folder_icons.model.json'
 *   3. Helper Function: readJsonFileSync (local version included).
 * 
 * OUTPUT (relative to project root):
 *   - 'packages/dynamicons/ext/assets/themes/base.theme.json'
 *   - 'packages/dynamicons/ext/assets/themes/dynamicons.theme.json'
 * 
 * IMPORTANT:
 *   - This script DELETES and RECREATES the output theme files on each run.
 */

const ansii = { //>
	none: '\x1B[0m',
	bold: '\x1B[1m',
	blueLight: '\x1B[38;5;153m',
	gold: '\x1B[38;5;179m',
	red: '\x1B[38;5;9m',
	yellow: '\x1B[38;5;226m',
} //<

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MONOREPO_ROOT = path.resolve(__dirname, '../../../../../')
const FILE_ICONS_MODEL_PATH = path.resolve(__dirname, '../models/file_icons.model.json')
const FOLDER_ICONS_MODEL_PATH = path.resolve(__dirname, '../models/folder_icons.model.json')
const EXT_ASSETS_DIR_ABS = path.join(MONOREPO_ROOT, 'packages/dynamicons/ext/assets')
const OPTIMIZED_ICONS_ROOT_DIR_ABS_POSIX = path.join(EXT_ASSETS_DIR_ABS, 'icons').replace(/\\/g, '/')
const OPTIMIZED_FILE_ICONS_DIR_ABS_POSIX = path.join(OPTIMIZED_ICONS_ROOT_DIR_ABS_POSIX, 'file_icons').replace(/\\/g, '/')
const OPTIMIZED_FOLDER_ICONS_DIR_ABS_POSIX = path.join(OPTIMIZED_ICONS_ROOT_DIR_ABS_POSIX, 'folder_icons').replace(/\\/g, '/')
const THEMES_OUTPUT_DIR_ABS_POSIX = path.join(EXT_ASSETS_DIR_ABS, 'themes').replace(/\\/g, '/')

const BASE_THEME_FILENAME = dynamiconsConstants.defaults.baseThemeFilenameDefault
const OUTPUT_THEME_FILENAME = dynamiconsConstants.defaults.generatedThemeFilenameDefault
const BASE_THEME_FILE_ABS = path.join(THEMES_OUTPUT_DIR_ABS_POSIX, BASE_THEME_FILENAME)
const OUTPUT_THEME_FILE_ABS = path.join(THEMES_OUTPUT_DIR_ABS_POSIX, OUTPUT_THEME_FILENAME)

const FILE_ICON_REL_PATH = path.posix.relative(THEMES_OUTPUT_DIR_ABS_POSIX, OPTIMIZED_FILE_ICONS_DIR_ABS_POSIX)
const FOLDER_ICON_REL_PATH = path.posix.relative(THEMES_OUTPUT_DIR_ABS_POSIX, OPTIMIZED_FOLDER_ICONS_DIR_ABS_POSIX)

interface IconDefinition { //>
	iconPath: string
} //<
interface FileIconsModel { //>
	file: { name: string }
	icons: IconEntry[]
} //<
interface FolderIconsModel { //>
	folder: { name: string }
	rootFolder: { name: string }
	icons: IconEntry[]
} //<
interface IconEntry { //>
	name: string
	fileExtensions?: string[]
	fileNames?: string[]
	folderNames?: string[]
} //<
interface ThemeManifest { //>
	iconDefinitions: Record<string, IconDefinition>
	folderNames: Record<string, string>
	folderNamesExpanded: Record<string, string>
	fileExtensions: Record<string, string>
	fileNames: Record<string, string>
	file: string
	folder: string
	folderExpanded: string
	rootFolder: string
	rootFolderExpanded: string
	languageIds: Record<string, string>
	hidesExplorerArrows?: boolean
	highContrast?: { fileExtensions?: Record<string, string>, fileNames?: Record<string, string> }
} //<

function readJsonFileSync<T = any>(filePath: string, encoding: BufferEncoding = 'utf-8'): T { //>
	const absolutePath = path.resolve(filePath)
	const fileContent = fs.readFileSync(absolutePath, encoding)
	const contentWithoutComments = stripJsonComments(fileContent.toString())

	return JSON.parse(contentWithoutComments) as T
} //<

function generateMetadata( //>
	iconsDirAbsPosix: string,
	themesDirAbsPosix: string,
	silent: boolean = false,
): Record<string, IconDefinition> {
	const iconsData: Record<string, IconDefinition> = {}

	try {
		if (!fs.existsSync(iconsDirAbsPosix.replace(/\//g, path.sep))) {
			if (!silent) {
				console.warn(
					`│  ├─ ${ansii.yellow}WARN:${ansii.none} Source icons directory does not exist: ${path.relative(
						MONOREPO_ROOT,
						iconsDirAbsPosix,
					)}. Skipping metadata.`,
				)
			}
			return iconsData
		}

		const files = fs.readdirSync(iconsDirAbsPosix.replace(/\//g, path.sep))
		const relativePathFromOutputThemesToOutputIcons = path.posix.relative(themesDirAbsPosix, OPTIMIZED_ICONS_ROOT_DIR_ABS_POSIX)

		for (const file of files) {
			if (path.extname(file).toLowerCase() === '.svg') {
				const name = `_${path.parse(file).name}`
				const iconPath = path.posix.join(relativePathFromOutputThemesToOutputIcons, path.basename(iconsDirAbsPosix), file)

				iconsData[name] = { iconPath }
			}
		}
	}
	catch (error) {
		if (!silent) {
			console.warn(
				`│  ├─ ${ansii.yellow}WARN:${ansii.none} Could not read directory ${path.relative(
					MONOREPO_ROOT,
					iconsDirAbsPosix,
				)}. Error: ${(error as Error).message}`,
			)
		}
	}
	return iconsData
} //<

function addIconDefinitionToResult( //>
	result: ThemeManifest,
	iconModelName: string,
	type: 'file' | 'folder',
	isOpenVariant: boolean = false,
	silent: boolean = false,
): void {
	let iconFileNameInAssets = iconModelName

	if (type === 'folder')
		iconFileNameInAssets = `folder-${iconModelName}`
	if (isOpenVariant)
		iconFileNameInAssets += dynamiconsConstants.defaults.openFolderIconSuffix

	let baseNameForDefinitionKey = iconModelName

	if (type === 'folder') {
		baseNameForDefinitionKey = `folder-${iconModelName}`
	}

	const themeIconKey = `_${isOpenVariant ? `${baseNameForDefinitionKey}${dynamiconsConstants.defaults.openFolderIconSuffix}` : baseNameForDefinitionKey}`

	const iconDirRelPath = type === 'file' ? FILE_ICON_REL_PATH : FOLDER_ICON_REL_PATH

	if (!result.iconDefinitions[themeIconKey]) {
		const optimizedIconsDirAbsPosix = type === 'file' ? OPTIMIZED_FILE_ICONS_DIR_ABS_POSIX : OPTIMIZED_FOLDER_ICONS_DIR_ABS_POSIX
		const fullIconPathInOptimizedPosix = path.posix.join(optimizedIconsDirAbsPosix, `${iconFileNameInAssets}.svg`)

		if (fs.existsSync(fullIconPathInOptimizedPosix.replace(/\//g, path.sep))) {
			result.iconDefinitions[themeIconKey] = {
				iconPath: path.posix.join(iconDirRelPath, `${iconFileNameInAssets}.svg`),
			}
		}
		else if (!silent) {
			const warningPath = path.relative(MONOREPO_ROOT, fullIconPathInOptimizedPosix.replace(/\//g, path.sep))

			console.warn(
				`│  ├─ ${ansii.yellow}WARN:${ansii.none} SVG file not found for definition '${themeIconKey}': ${warningPath}`,
			)
		}
	}
} //<

function processIconAssociations( //>
	result: ThemeManifest,
	iconEntry: IconEntry,
	type: 'file' | 'folder',
	silent: boolean = false,
): void {
	const iconModelName = iconEntry.name

	if (!iconModelName)
		return

	const associationKeys = type === 'file' ? (['fileExtensions', 'fileNames'] as const) : (['folderNames'] as const)

	for (const associationKey of associationKeys) {
		for (const itemName of iconEntry[associationKey] || []) {
			if (!itemName)
				continue

			let definitionKeyForAssociation: string

			if (type === 'folder') {
				definitionKeyForAssociation = `_folder-${iconModelName}`
			}
			else {
				definitionKeyForAssociation = `_${iconModelName}`
			}

			result[associationKey][itemName] = definitionKeyForAssociation
			addIconDefinitionToResult(result, iconModelName, type, false, silent)

			if (associationKey === 'folderNames') { // This implies type === 'folder'
				const expandedDefinitionKeyForAssociation = `${definitionKeyForAssociation}${dynamiconsConstants.defaults.openFolderIconSuffix}`

				result.folderNamesExpanded[itemName] = expandedDefinitionKeyForAssociation
				addIconDefinitionToResult(result, iconModelName, type, true, silent)
			}
		}
	}
} //<

function transformIcons( //>
	fileIconsModel: FileIconsModel,
	folderIconsModel: FolderIconsModel,
	silent: boolean = false,
): ThemeManifest {
	const result: ThemeManifest = {
		iconDefinitions: {},
		folderNames: {},
		folderNamesExpanded: {},
		fileExtensions: {},
		fileNames: {},
		file: `_${fileIconsModel.file.name}`,
		folder: `_folder-${folderIconsModel.folder.name}`,
		folderExpanded: `_folder-${folderIconsModel.folder.name}${dynamiconsConstants.defaults.openFolderIconSuffix}`,
		rootFolder: `_folder-${folderIconsModel.rootFolder.name}`,
		rootFolderExpanded: `_folder-${folderIconsModel.rootFolder.name}${dynamiconsConstants.defaults.openFolderIconSuffix}`,
		languageIds: {},
		hidesExplorerArrows: true,
		highContrast: { fileExtensions: {}, fileNames: {} },
	}

	addIconDefinitionToResult(result, fileIconsModel.file.name, 'file', false, silent)
	addIconDefinitionToResult(result, folderIconsModel.folder.name, 'folder', false, silent)
	addIconDefinitionToResult(result, folderIconsModel.folder.name, 'folder', true, silent)
	addIconDefinitionToResult(result, folderIconsModel.rootFolder.name, 'folder', false, silent)
	addIconDefinitionToResult(result, folderIconsModel.rootFolder.name, 'folder', true, silent)

	Object.assign(result.iconDefinitions, generateMetadata(OPTIMIZED_FILE_ICONS_DIR_ABS_POSIX, THEMES_OUTPUT_DIR_ABS_POSIX, silent))
	Object.assign(result.iconDefinitions, generateMetadata(OPTIMIZED_FOLDER_ICONS_DIR_ABS_POSIX, THEMES_OUTPUT_DIR_ABS_POSIX, silent))

	const processedFileIconNames = new Set<string>()
	const duplicateFileIconNames = new Set<string>()
	const processedFolderIconNames = new Set<string>()
	const duplicateFolderIconNames = new Set<string>()

	for (const iconEntry of fileIconsModel.icons) {
		if (!iconEntry.name)
			continue
		if (processedFileIconNames.has(iconEntry.name)) {
			duplicateFileIconNames.add(iconEntry.name)
			continue
		}
		processedFileIconNames.add(iconEntry.name)
		processIconAssociations(result, iconEntry, 'file', silent)
	}

	for (const iconEntry of folderIconsModel.icons) {
		if (!iconEntry.name)
			continue
		if (processedFolderIconNames.has(iconEntry.name)) {
			duplicateFolderIconNames.add(iconEntry.name)
			continue
		}
		processedFolderIconNames.add(iconEntry.name)
		processIconAssociations(result, iconEntry, 'folder', silent)
	}

	if (!silent) {
		let reportedAnyDuplicates = false

		if (duplicateFileIconNames.size > 0) {
			console.log(`│  ├─ ${ansii.red}WARNING:${ansii.none} Duplicated File icon model names (skipped after first):`)
			Array.from(duplicateFileIconNames).forEach((name, index, array) => {
				console.log(`${index === array.length - 1 ? '│  │  └─ ' : '│  │  ├─ '}${name}`)
			})
			reportedAnyDuplicates = true
		}
		if (duplicateFolderIconNames.size > 0) {
			const headerPrefix = reportedAnyDuplicates ? '│  └─ ' : '│  ├─ '

			console.log(`${headerPrefix}${ansii.red}WARNING:${ansii.none} Duplicated Folder icon model names (skipped after first):`)
			Array.from(duplicateFolderIconNames).forEach((name, index, array) => {
				const listPrefix = reportedAnyDuplicates ? '│     ' : '│  │  '

				console.log(`${listPrefix}${index === array.length - 1 ? '└─ ' : '├─ '}${name}`)
			})
			reportedAnyDuplicates = true
		}
		if (reportedAnyDuplicates)
			console.log('│')
	}

	return result
} //<

function checkForOrphanedIcons( //>
	fileIconsModel: FileIconsModel,
	folderIconsModel: FolderIconsModel,
	silent: boolean,
) {
	// 1. Compile all valid icon names from models
	const modelIconNames = new Set<string>()

	fileIconsModel.icons.forEach((icon) => {
		if (icon.name)
			modelIconNames.add(icon.name)
	})
	folderIconsModel.icons.forEach((icon) => {
		if (icon.name)
			modelIconNames.add(icon.name)
	})
	// Also add the default file/folder/rootFolder icons
	if (fileIconsModel.file.name)
		modelIconNames.add(fileIconsModel.file.name)
	if (folderIconsModel.folder.name)
		modelIconNames.add(folderIconsModel.folder.name)
	if (folderIconsModel.rootFolder.name)
		modelIconNames.add(folderIconsModel.rootFolder.name)

	const orphanedIcons: string[] = []
	const iconDirs = [
		{ path: OPTIMIZED_FILE_ICONS_DIR_ABS_POSIX, type: 'file' as const },
		{ path: OPTIMIZED_FOLDER_ICONS_DIR_ABS_POSIX, type: 'folder' as const },
	]

	for (const dirInfo of iconDirs) {
		if (!fs.existsSync(dirInfo.path.replace(/\//g, path.sep))) {
			continue
		}

		const assetFiles = fs.readdirSync(dirInfo.path.replace(/\//g, path.sep))

		for (const assetFile of assetFiles) {
			if (!assetFile.endsWith('.svg'))
				continue
			if (assetFile.endsWith('-alt.svg'))
				continue // Ignore alternate icons

			let baseName = assetFile.replace(/\.svg$/, '')

			if (dirInfo.type === 'folder') {
				baseName = baseName.replace(/^folder-/, '').replace(/-open$/, '')
			}

			if (!modelIconNames.has(baseName)) {
				orphanedIcons.push(path.join(path.basename(dirInfo.path), assetFile))
			}
		}
	}

	if (orphanedIcons.length > 0 && !silent) {
		console.log(`│  ├─ ${ansii.red}WARNING:${ansii.none} Found ${orphanedIcons.length} orphaned icon(s) in assets not defined in any model:`)
		orphanedIcons.forEach((orphan, index, array) => {
			console.log(`${index === array.length - 1 ? '│  │  └─ ' : '│  │  ├─ '}${orphan}`)
		})
		console.log('│')
	}
} //<

export async function main(silent: boolean = false): Promise<boolean> { //>
	if (!silent) {
		console.log(
			`\n┌─ ${ansii.bold}${ansii.blueLight}GENERATING ICON MANIFESTS FOR ${dynamiconsConstants.featureName.toUpperCase()}${ansii.none}`,
		)
	}

	if (!fs.existsSync(THEMES_OUTPUT_DIR_ABS_POSIX.replace(/\//g, path.sep))) {
		if (!silent) {
			console.log(
				`│  ├─ ${ansii.yellow}NOTE:${ansii.none} Themes output directory '${path.relative(
					MONOREPO_ROOT,
					THEMES_OUTPUT_DIR_ABS_POSIX,
				)}' does not exist. Creating it.`,
			)
		}
		try {
			fs.mkdirSync(THEMES_OUTPUT_DIR_ABS_POSIX.replace(/\//g, path.sep), { recursive: true })
		}
		catch (e) {
			if (!silent) {
				console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Could not create themes directory: ${(e as Error).message}`)
			}
			return false
		}
	}

	for (const file of [BASE_THEME_FILE_ABS, OUTPUT_THEME_FILE_ABS]) {
		const platformSpecificFile = file.replace(/\//g, path.sep)

		if (fs.existsSync(platformSpecificFile)) {
			try {
				fs.unlinkSync(platformSpecificFile)
			}
			catch (e) {
				if (!silent) {
					console.warn(
						`│  ├─ ${ansii.yellow}WARN:${ansii.none} Could not delete existing file '${path.basename(
							platformSpecificFile,
						)}'. Error: ${(e as Error).message}`,
					)
				}
			}
		}
	}

	let fileIconsData: FileIconsModel
	let folderIconsData: FolderIconsModel

	try {
		fileIconsData = readJsonFileSync<FileIconsModel>(FILE_ICONS_MODEL_PATH)
		folderIconsData = readJsonFileSync<FolderIconsModel>(FOLDER_ICONS_MODEL_PATH)
	}
	catch (e) {
		if (!silent) {
			console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Could not read model files: ${(e as Error).message}`)
		}
		return false
	}

	checkForOrphanedIcons(fileIconsData, folderIconsData, silent)

	const combinedIconsData = transformIcons(fileIconsData, folderIconsData, silent)

	try {
		fs.writeFileSync(BASE_THEME_FILE_ABS.replace(/\//g, path.sep), JSON.stringify(combinedIconsData, null, 2))
		if (!silent) {
			console.log(
				`│  ├─ ${ansii.gold}Generated Manifest:${ansii.none} ${path.relative(MONOREPO_ROOT, BASE_THEME_FILE_ABS)}`,
			)
		}
	}
	catch (e) {
		if (!silent) {
			console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Could not write ${path.basename(BASE_THEME_FILE_ABS)}: ${(e as Error).message}`)
		}
		return false
	}

	try {
		fs.writeFileSync(OUTPUT_THEME_FILE_ABS.replace(/\//g, path.sep), JSON.stringify(combinedIconsData, null, 2))
		if (!silent) {
			console.log(
				`│  └─ ${ansii.gold}Generated Manifest:${ansii.none} ${path.relative(MONOREPO_ROOT, OUTPUT_THEME_FILE_ABS)}`,
			)
		}
	}
	catch (e) {
		if (!silent) {
			console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Could not write ${path.basename(OUTPUT_THEME_FILE_ABS)}: ${(e as Error).message}`)
		}
		return false
	}

	if (!silent) {
		console.log(`└─ ${ansii.bold}${ansii.blueLight}MANIFEST GENERATION COMPLETE${ansii.none}\n`)
	}
	return true
} //<

// Standalone execution
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) { //>
	main(false).catch((error) => {
		console.error('An unexpected error occurred in generate_icon_manifests.ts (standalone):', error)
		process.exit(1)
	})
} //<
