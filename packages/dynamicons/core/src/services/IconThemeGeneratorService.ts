// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= NODE JS ===================================================================================================
import type { PathLike, Dirent } from 'node:fs'
import { constants as fsConstants } from 'node:fs'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IIconThemeGeneratorService } from '../_interfaces/IIconThemeGeneratorService.ts'
import { dynamiconsConstants } from '../../../_config/dynamicons.constants.ts' // Updated import path
import type { IFileUtilsService, IPathUtilsService, ICommonUtilsService } from '@focused-ui/utilities-core'

//--------------------------------------------------------------------------------------------------------------<<

interface IconDefinition { iconPath: string }

interface ThemeManifest {
	iconDefinitions: Record<string, IconDefinition>
	folderNames?: Record<string, string>
	folderNamesExpanded?: Record<string, string>
	fileExtensions?: Record<string, string>
	fileNames?: Record<string, string>
	languageIds?: Record<string, string>
	file?: string
	folder?: string
	folderExpanded?: string
	rootFolder?: string
	rootFolderExpanded?: string
	hidesExplorerArrows?: boolean
	[key: string]: any
}

@injectable()
export class IconThemeGeneratorService implements IIconThemeGeneratorService { //>

	constructor(
		@inject('IFileUtilsService') private readonly iFileUtils: IFileUtilsService,
		@inject('IPathUtilsService') private readonly iPathUtils: IPathUtilsService,
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject('iFspReaddir') private readonly iFspReaddir: (path: PathLike, options?: { encoding?: BufferEncoding | null, withFileTypes?: boolean } | BufferEncoding | undefined | null) => Promise<string[] | Dirent[]>,
		@inject('iFspAccess') private readonly iFspAccess: (path: PathLike, mode?: number) => Promise<void>,
	) {}

	public async generateIconThemeManifest( //>
		baseManifestPath: string,
		userIconsDirectory?: string,
		customMappings?: Record<string, string>,
		hideExplorerArrows?: boolean | null,
	): Promise<Record<string, any> | undefined> {
		const manifest = this.iFileUtils.readJsonFileSync<ThemeManifest>(baseManifestPath)
		if (!manifest) {
			this.iCommonUtils.errMsg(`[IconThemeGeneratorService] Base manifest not found or failed to parse at: ${baseManifestPath}`)
			return undefined
		}

		manifest.iconDefinitions = manifest.iconDefinitions || {}

		if (userIconsDirectory) {
			const userIconsPath = this.iPathUtils.santizePath(userIconsDirectory)
			try {
				await this.iFspAccess(userIconsPath, fsConstants.R_OK)
				const files = await this.iFspReaddir(userIconsPath, { withFileTypes: true }) as Dirent[]
				for (const file of files) {
					if (file.isFile() && file.name.endsWith('.svg')) {
						const iconName = file.name.replace(/\.svg$/, '')
						const definitionKey = `${dynamiconsConstants.defaults.userIconDefinitionPrefix}${iconName}`
						manifest.iconDefinitions[definitionKey] = {
							iconPath: this.iPathUtils.santizePath(this.iPathUtils.iPathJoin(userIconsPath, file.name)),
						}
					}
				}
			}
			catch (error) {
				this.iCommonUtils.errMsg(`[IconThemeGeneratorService] Error accessing user icons directory '${userIconsPath}':`, error)
			}
		}

		if (customMappings) {
			for (const key in customMappings) {
				const value = customMappings[key]
				if (key.startsWith(dynamiconsConstants.associationKeyPrefixes.file)) {
					const fileNameOrExt = key.substring(dynamiconsConstants.associationKeyPrefixes.file.length).trim()
					if (fileNameOrExt.includes('.')) {
						manifest.fileNames = manifest.fileNames || {}
						manifest.fileNames[fileNameOrExt] = value
					}
					else {
						manifest.fileExtensions = manifest.fileExtensions || {}
						manifest.fileExtensions[fileNameOrExt] = value
					}
				}
				else if (key.startsWith(dynamiconsConstants.associationKeyPrefixes.folder)) {
					const folderName = key.substring(dynamiconsConstants.associationKeyPrefixes.folder.length).trim()
					manifest.folderNames = manifest.folderNames || {}
					manifest.folderNamesExpanded = manifest.folderNamesExpanded || {}
					manifest.folderNames[folderName] = value

					let openDefinitionKey = value
					if (value.startsWith(dynamiconsConstants.defaults.iconThemeNamePrefix)) {
						const baseName = value.substring(dynamiconsConstants.defaults.iconThemeNamePrefix.length)
						openDefinitionKey = `${dynamiconsConstants.defaults.iconThemeNamePrefix}${baseName}${dynamiconsConstants.defaults.openFolderIconSuffix}`
					}
					else if (value.startsWith(dynamiconsConstants.defaults.userIconDefinitionPrefix)) {
						const baseName = value.substring(dynamiconsConstants.defaults.userIconDefinitionPrefix.length)
						openDefinitionKey = `${dynamiconsConstants.defaults.userIconDefinitionPrefix}${baseName}${dynamiconsConstants.defaults.openFolderIconSuffix}`
					}
					else {
						openDefinitionKey = `${value}${dynamiconsConstants.defaults.openFolderIconSuffix}`
					}

					if (manifest.iconDefinitions[openDefinitionKey]) {
						manifest.folderNamesExpanded[folderName] = openDefinitionKey
					}
					else {
						manifest.folderNamesExpanded[folderName] = value
					}
				}
				else if (key.startsWith(dynamiconsConstants.associationKeyPrefixes.language)) {
					const langId = key.substring(dynamiconsConstants.associationKeyPrefixes.language.length).trim()
					manifest.languageIds = manifest.languageIds || {}
					manifest.languageIds[langId] = value
				}
			}
		}

		if (hideExplorerArrows !== null && hideExplorerArrows !== undefined) {
			manifest.hidesExplorerArrows = hideExplorerArrows
		}
		else {
			delete manifest.hidesExplorerArrows
		}

		return manifest
	} //<

	public async writeIconThemeFile(manifest: Record<string, any>, outputPath: string): Promise<void> { //>
		try {
			const manifestJsonString = JSON.stringify(manifest, null, 2)
			await this.iFileUtils.iFspWriteFile(outputPath, manifestJsonString, 'utf-8')
		}
		catch (error) {
			this.iCommonUtils.errMsg(`[IconThemeGeneratorService] Failed to write icon theme manifest to ${outputPath}:`, error)
			throw error
		}
	} //<

} // <
