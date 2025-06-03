/* //>
SCRIPT: generate_icon_manifests.ts
PURPOSE:
  Generates the 'base.theme.json' and a copy (e.g., 'dynamicons.theme.json')
  for the VS Code icon theme. This script reads icon definitions and associations
  from '.model.json' files and combines them with SVG icons found in specified asset directories.
  The output 'base.theme.json' serves as the foundational manifest that the
  extension's runtime IconThemeGeneratorService will use to dynamically build the
  final theme by incorporating user-specific customizations.

USAGE:
  Ensure you have ts-node and typescript installed (e.g., npm install -g ts-node typescript).
  Run from the project root:
  npx ts-node --esm packages/dynamicons/core/src/scripts/generate_icon_manifests.ts

PREQUISITES:
  1. SVG Icons:
     - Optimized SVG icons should be present in the following directories relative to the project root:
       - File Icons: 'assets/icons/file_icons/'
       - Folder Icons: 'assets/icons/folder_icons/'
     - Naming Conventions for SVGs (expected by this script and the models):
       - File Icons: e.g., 'my-icon.svg', 'javascript.svg', 'file.svg' (for default)
       - Folder Icons (Closed State): e.g., 'folder-my-icon.svg', 'folder-src.svg', 'folder-basic.svg' (for default)
       - Folder Icons (Open State): e.g., 'folder-my-icon-open.svg', 'folder-src-open.svg', 'folder-basic-open.svg' (for default)
         (The '-open' suffix is automatically handled for folderNamesExpanded).
     - It's recommended to run an SVG optimization script first.

  2. Model Files:
     - The script expects the following JSON model files to define icon associations, relative to this script's directory:
       - '../assets/file_icons.model.json'
       - '../assets/folder_icons.model.json'

  3. Helper Function:
     - A 'readJsonFileSync' helper is expected. For this script, a simplified local version is included.

OUTPUT (relative to project root):
  - 'assets/themes/base.theme.json': The primary output.
  - 'assets/themes/dynamicons.theme.json': A direct copy of base.theme.json.

IMPORTANT:
  - This script DELETES and RECREATES the output theme files on each run.
  - Ensure all paths are correct relative to the project root.
*/ //<

// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

//= MISC ======================================================================================================
import stripJsonComments from 'strip-json-comments'

//= IMPLEMENTATION TYPES ======================================================================================
import { dynamiconsConstants } from '../../../_config/dynamicons.constants.ts' // Updated import path

//--------------------------------------------------------------------------------------------------------------<<

export function readJsonFileSync<T = any>(filePath: string, encoding: BufferEncoding = 'utf-8'): T { //>
	const absolutePath = path.resolve(filePath)
	const fileContent = fs.readFileSync(absolutePath, encoding)
	const contentWithoutComments = stripJsonComments(fileContent.toString())
	return JSON.parse(contentWithoutComments) as T
} //<

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_ROOT = path.resolve(__dirname, '../../../../') // Adjusted path to project root

const FILE_ICONS_MODEL_PATH = path.resolve(__dirname, '../assets/file_icons.model.json')
const FOLDER_ICONS_MODEL_PATH = path.resolve(__dirname, '../assets/folder_icons.model.json')

const THEMES_DIR_ABS_POSIX = path.join(PROJECT_ROOT, dynamiconsConstants.assets.themesPath).replace(/\\/g, '/')
const ICONS_DIR_ROOT_ABS_POSIX = path.join(PROJECT_ROOT, 'assets/icons').replace(/\\/g, '/') // Assuming 'assets/icons' is standard

const FILE_ICONS_DIR_ABS_POSIX = path.join(ICONS_DIR_ROOT_ABS_POSIX, 'file_icons').replace(/\\/g, '/')
const FOLDER_ICONS_DIR_ABS_POSIX = path.join(ICONS_DIR_ROOT_ABS_POSIX, 'folder_icons').replace(/\\/g, '/')

const BASE_THEME_FILENAME = dynamiconsConstants.defaults.baseThemeFilenameDefault
const OUTPUT_THEME_FILENAME = dynamiconsConstants.defaults.generatedThemeFilenameDefault

const BASE_THEME_FILE_ABS = path.join(THEMES_DIR_ABS_POSIX, BASE_THEME_FILENAME)
const OUTPUT_THEME_FILE_ABS = path.join(THEMES_DIR_ABS_POSIX, OUTPUT_THEME_FILENAME)

const FILE_ICON_REL_PATH = path.posix.relative(THEMES_DIR_ABS_POSIX, FILE_ICONS_DIR_ABS_POSIX)
const FOLDER_ICON_REL_PATH = path.posix.relative(THEMES_DIR_ABS_POSIX, FOLDER_ICONS_DIR_ABS_POSIX)

interface IconDefinition { iconPath: string }
interface IconEntry {
	name: string
	fileExtensions?: string[]
	fileNames?: string[]
	folderNames?: string[]
}
interface FileIconsModel { file: { name: string }, icons: IconEntry[] }
interface FolderIconsModel { folder: { name: string }, rootFolder: { name: string }, icons: IconEntry[] }
interface ThemeManifest {
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
}

const ansii = {
	none: '\x1B[0m',
	bold: '\x1B[1m',
	blueLight: '\x1B[38;5;153m',
	gold: '\x1B[38;5;179m',
	red: '\x1B[38;5;9m',
	yellow: '\x1B[38;5;226m',
}

function generateMetadata(iconsDirAbsPosix: string, themesDirAbsPosix: string): Record<string, IconDefinition> { //>
	const iconsData: Record<string, IconDefinition> = {}
	try {
		if (!fs.existsSync(iconsDirAbsPosix.replace(/\//g, path.sep))) {
			console.warn(`│  ├─ ${ansii.yellow}WARN:${ansii.none} Icons directory does not exist: ${path.relative(PROJECT_ROOT, iconsDirAbsPosix)}. Skipping metadata generation for it.`)
			return iconsData
		}
		const files = fs.readdirSync(iconsDirAbsPosix.replace(/\//g, path.sep))
		const relativePathFromThemesToIcons = path.posix.relative(themesDirAbsPosix, iconsDirAbsPosix)

		for (const file of files) {
			const ext = path.extname(file).toLowerCase()
			if (ext === '.svg') {
				const name = `_${path.parse(file).name}`
				const iconPath = path.posix.join(relativePathFromThemesToIcons, file)
				iconsData[name] = { iconPath }
			}
		}
	}
	catch (error) {
		console.warn(`│  ├─ ${ansii.yellow}WARN:${ansii.none} Could not read directory ${path.relative(PROJECT_ROOT, iconsDirAbsPosix)}. Error: ${(error as Error).message}`)
	}
	return iconsData
} //<

function addIconDefinitionToResult( //>
	result: ThemeManifest,
	iconModelName: string,
	type: 'file' | 'folder',
	isOpenVariant: boolean = false,
): void {
	let iconFileNameInAssets = iconModelName
	if (type === 'folder') {
		iconFileNameInAssets = `folder-${iconModelName}`
	}

	if (isOpenVariant) {
		iconFileNameInAssets += dynamiconsConstants.defaults.openFolderIconSuffix
	}

	const themeIconKey = `_${isOpenVariant ? `${iconModelName}${dynamiconsConstants.defaults.openFolderIconSuffix}` : iconModelName}`
	const iconDirRelPath = type === 'file' ? FILE_ICON_REL_PATH : FOLDER_ICON_REL_PATH

	if (!result.iconDefinitions[themeIconKey]) {
		const iconsDirAbsPosix = type === 'file' ? FILE_ICONS_DIR_ABS_POSIX : FOLDER_ICONS_DIR_ABS_POSIX
		const fullIconPathInAssetsPosix = path.posix.join(iconsDirAbsPosix, `${iconFileNameInAssets}.svg`)
		
		if (fs.existsSync(fullIconPathInAssetsPosix.replace(/\//g, path.sep))) {
			result.iconDefinitions[themeIconKey] = {
				iconPath: path.posix.join(iconDirRelPath, `${iconFileNameInAssets}.svg`),
			}
		}
		else {
			const warningPath = path.relative(PROJECT_ROOT, fullIconPathInAssetsPosix.replace(/\//g, path.sep))
			console.warn(`│  ├─ ${ansii.yellow}WARN:${ansii.none} SVG file not found for definition '${themeIconKey}': ${warningPath}`)
		}
	}
} //<

function processIconAssociations( //>
	result: ThemeManifest,
	iconEntry: IconEntry,
	type: 'file' | 'folder',
): void {
	const iconModelName = iconEntry.name
	if (!iconModelName)
		return

	const associationKeys = type === 'file'
		? (['fileExtensions', 'fileNames'] as const)
		: (['folderNames'] as const)

	for (const associationKey of associationKeys) {
		for (const itemName of iconEntry[associationKey] || []) {
			if (!itemName)
				continue

			const themeIconNameKey = `_${iconModelName}`
			result[associationKey][itemName] = themeIconNameKey
			addIconDefinitionToResult(result, iconModelName, type)

			if (associationKey === 'folderNames') {
				const expandedThemeIconNameKey = `_${iconModelName}${dynamiconsConstants.defaults.openFolderIconSuffix}`
				result.folderNamesExpanded[itemName] = expandedThemeIconNameKey
				addIconDefinitionToResult(result, iconModelName, type, true)
			}
		}
	}
} //<

function transformIcons( //>
	fileIconsModel: FileIconsModel,
	folderIconsModel: FolderIconsModel,
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

	addIconDefinitionToResult(result, fileIconsModel.file.name, 'file')
	addIconDefinitionToResult(result, folderIconsModel.folder.name, 'folder')
	addIconDefinitionToResult(result, folderIconsModel.folder.name, 'folder', true)
	addIconDefinitionToResult(result, folderIconsModel.rootFolder.name, 'folder')
	addIconDefinitionToResult(result, folderIconsModel.rootFolder.name, 'folder', true)

	Object.assign(result.iconDefinitions, generateMetadata(FILE_ICONS_DIR_ABS_POSIX, THEMES_DIR_ABS_POSIX))
	Object.assign(result.iconDefinitions, generateMetadata(FOLDER_ICONS_DIR_ABS_POSIX, THEMES_DIR_ABS_POSIX))

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
		processIconAssociations(result, iconEntry, 'file')
	}

	for (const iconEntry of folderIconsModel.icons) {
		if (!iconEntry.name)
			continue
		if (processedFolderIconNames.has(iconEntry.name)) {
			duplicateFolderIconNames.add(iconEntry.name)
			continue
		}
		processedFolderIconNames.add(iconEntry.name)
		processIconAssociations(result, iconEntry, 'folder')
	}

	let reportedAnyDuplicates = false
	if (duplicateFileIconNames.size > 0) {
		console.log(`│  ├─ ${ansii.red}WARNING:${ansii.none} Duplicated File icon model names (associations skipped after first):`)
		Array.from(duplicateFileIconNames).forEach((name, index, array) => {
			const prefix = index === array.length - 1 ? '│  │  └─ ' : '│  │  ├─ '
			console.log(`${prefix}${name}`)
		})
		reportedAnyDuplicates = true
	}

	if (duplicateFolderIconNames.size > 0) {
		const headerPrefix = reportedAnyDuplicates ? '│  └─ ' : '│  ├─ '
		console.log(`${headerPrefix}${ansii.red}WARNING:${ansii.none} Duplicated Folder icon model names (associations skipped after first):`)
		Array.from(duplicateFolderIconNames).forEach((name, index, array) => {
			const listPrefix = reportedAnyDuplicates ? '│     ' : '│  │  '
			const itemPrefix = index === array.length - 1 ? '└─ ' : '├─ '
			console.log(`${listPrefix}${itemPrefix}${name}`)
		})
		reportedAnyDuplicates = true
	}

	if (reportedAnyDuplicates) {
		console.log('│')
	}

	return result
} //<

async function main(): Promise<void> { //>
	console.log(`\n┌─ ${ansii.bold}${ansii.blueLight}GENERATING ICON MANIFESTS FOR ${dynamiconsConstants.featureName.toUpperCase()}${ansii.none}`)

	if (!fs.existsSync(THEMES_DIR_ABS_POSIX.replace(/\//g, path.sep))) {
		console.log(`│  ├─ ${ansii.yellow}NOTE:${ansii.none} Themes directory '${path.relative(PROJECT_ROOT, THEMES_DIR_ABS_POSIX)}' does not exist. Creating it.`)
		try {
			fs.mkdirSync(THEMES_DIR_ABS_POSIX.replace(/\//g, path.sep), { recursive: true })
		}
		catch (e) {
			console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Could not create themes directory: ${(e as Error).message}`)
			process.exit(1)
		}
	}

	for (const file of [BASE_THEME_FILE_ABS, OUTPUT_THEME_FILE_ABS]) {
		const platformSpecificFile = file.replace(/\//g, path.sep)
		if (fs.existsSync(platformSpecificFile)) {
			try {
				fs.unlinkSync(platformSpecificFile)
			}
			catch (e) {
				console.warn(`│  ├─ ${ansii.yellow}WARN:${ansii.none} Could not delete existing file '${path.basename(platformSpecificFile)}'. It might be in use. Error: ${(e as Error).message}`)
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
		console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Could not read model files: ${(e as Error).message}`)
		process.exit(1)
	}

	const combinedIconsData = transformIcons(fileIconsData, folderIconsData)

	try {
		fs.writeFileSync(BASE_THEME_FILE_ABS.replace(/\//g, path.sep), JSON.stringify(combinedIconsData, null, 2))
		console.log(`│  ├─ ${ansii.gold}Generated Manifest:${ansii.none} ${path.relative(PROJECT_ROOT, BASE_THEME_FILE_ABS)}`)
	}
	catch (e) {
		console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Could not write ${path.basename(BASE_THEME_FILE_ABS)}: ${(e as Error).message}`)
	}

	try {
		fs.writeFileSync(OUTPUT_THEME_FILE_ABS.replace(/\//g, path.sep), JSON.stringify(combinedIconsData, null, 2))
		console.log(`│  └─ ${ansii.gold}Generated Manifest:${ansii.none} ${path.relative(PROJECT_ROOT, OUTPUT_THEME_FILE_ABS)}`)
	}
	catch (e) {
		console.error(`│  └─ ${ansii.red}ERROR:${ansii.none} Could not write ${path.basename(OUTPUT_THEME_FILE_ABS)}: ${(e as Error).message}`)
	}

	console.log(`└─ ${ansii.bold}${ansii.blueLight}MANIFEST GENERATION COMPLETE${ansii.none}\n`)
} //<

main().catch((error) => {
	console.error('An unexpected error occurred in main:', error)
	process.exit(1)
})
