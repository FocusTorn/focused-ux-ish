// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ConfigurationTarget, ExtensionContext, QuickPickItem, Uri as VsCodeUri } from 'vscode'
import { QuickPickItemKind, Uri as VsCodeUriUtil } from 'vscode'

//= NODE JS ===================================================================================================
import type { PathLike, Stats, Dirent } from 'node:fs'
import type * as nodePath from 'node:path'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IIconActionsService } from '../_interfaces/IIconActionsService.js'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'
import type {
	IWindow,
	ICommands,
	IWorkspace,
	IPathUtilsService,
	IQuickPickUtilsService,
	ICommonUtilsService,
} from '@focused-ux/shared-services'
import type { IIconThemeGeneratorService } from '../_interfaces/IIconThemeGeneratorService.js'

//--------------------------------------------------------------------------------------------------------------<<

interface IconQuickPickItemInternal extends QuickPickItem { //>
	iconNameInDefinitions: string
} //<

type IconAssociationType = 'file' | 'folder' | 'language'
type DataOrSeparator<T extends QuickPickItem> = | T | ( //>
    QuickPickItem & { kind: QuickPickItemKind.Separator }
) //<

@injectable()
export class IconActionsService implements IIconActionsService {

	private readonly EXTENSION_CONFIG_PREFIX = dynamiconsConstants.configPrefix
	private readonly CUSTOM_MAPPINGS_KEY = dynamiconsConstants.configKeys.customIconMappings
	private readonly HIDE_ARROWS_KEY = dynamiconsConstants.configKeys.hideExplorerArrows
	private readonly USER_ICONS_DIR_KEY = dynamiconsConstants.configKeys.userIconsDirectory
	private readonly ICON_THEME_ID_KEY = 'iconTheme'
	private readonly BUILT_IN_FILE_ICONS_REL_PATH = 'assets/icons/file_icons'
	private readonly BUILT_IN_FOLDER_ICONS_REL_PATH = 'assets/icons/folder_icons'

	constructor(
		@inject('ExtensionContext') private readonly extensionContext: ExtensionContext,
		@inject('IWindow') private readonly iWindow: IWindow,
		@inject('ICommands') private readonly iCommands: ICommands,
		@inject('IWorkspace') private readonly iWorkspace: IWorkspace,
		@inject('IPathUtilsService') private readonly iPathUtils: IPathUtilsService,
		@inject('IQuickPickUtilsService') private readonly iQuickPickUtils: IQuickPickUtilsService,
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject('IIconThemeGeneratorService') private readonly iconThemeGenerator: IIconThemeGeneratorService,
		@inject('iPathBasename') private readonly iPathBasename: typeof nodePath.basename,
		@inject('iPathParse') private readonly iPathParse: typeof nodePath.parse,
		@inject('iFspStat') private readonly iFspStat: (path: PathLike) => Promise<Stats>,
		@inject('vscodeConfigurationTarget') private readonly vscodeConfigTarget: typeof ConfigurationTarget,
		@inject('iFspReaddir') private readonly iFspReaddir: (path: PathLike, options?: { withFileTypes?: boolean }) => Promise<string[] | Dirent[]>,

	) {}

	private async getResourceName( //>
		resourceUri: VsCodeUri,
	): Promise<string | undefined> {
		try {
			const stat = await this.iFspStat(resourceUri.fsPath)

			if (stat.isDirectory()) {
				return this.iPathBasename(resourceUri.fsPath)
			} else if (stat.isFile()) {
				return this.iPathBasename(resourceUri.fsPath)
			}
		} catch (error) {
			this.iCommonUtils.errMsg(`Error getting resource stats for ${resourceUri.fsPath}`, error)
		}
		return undefined
	} //<

	private getAssociationKey( //>
		name: string,
		type: IconAssociationType,
	): string {
		const prefix = dynamiconsConstants.associationKeyPrefixes[type]

		return `${prefix}${name}`
	} //<

	private async updateCustomIconMappings( //>
		resourceUri: VsCodeUri | undefined, // Though typically undefined for global updates
		updateFn: (
			mappings: Record<string, string>,
			config: import('vscode').WorkspaceConfiguration // Use imported type
		) => Promise<boolean | Record<string, string>>,
	): Promise<void> {
		const config = this.iWorkspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX, resourceUri)
		const originalMappingsFromConfig = config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || {}

		// Create a mutable shallow copy to pass to updateFn.
		// updateFn will modify this copy.
		const mutableMappingsCopy = { ...originalMappingsFromConfig }

		console.log(`[Dynamicons Update Debug] updateCustomIconMappings called.`)
		console.log(`[Dynamicons Update Debug] Original mappings fetched from config.get:`, JSON.stringify(originalMappingsFromConfig, null, 2))
		console.log(`[Dynamicons Update Debug] Mutable copy created for updateFn:`, JSON.stringify(mutableMappingsCopy, null, 2))

		const newMappingsResult = await updateFn(mutableMappingsCopy, config) // updateFn modifies mutableMappingsCopy

		if (typeof newMappingsResult === 'boolean') {
			if (newMappingsResult) {
				// This path is typically for operations that don't return the full mappings object but signal a change.
				console.log(`[Dynamicons Update Debug] updateFn returned boolean 'true'. Assuming direct config update by updateFn or manual refresh needed.`)
				// this.iWindow.showInformationMessage('Configuration updated. Theme will refresh automatically.')
			} else {
				console.log(`[Dynamicons Update Debug] updateFn returned boolean 'false'. No changes to persist.`)
			}
		} else if (typeof newMappingsResult === 'object') {
			// This path is taken by revertIconAssignment.
			// newMappingsResult should be the `mutableMappingsCopy` object, now modified by updateFn.
			console.log(`[Dynamicons Update Debug] updateFn returned mappings object.`)
			console.log(`[Dynamicons Update Debug] Original mappings (before updateFn was called on its copy):`, JSON.stringify(originalMappingsFromConfig, null, 2))
			console.log(`[Dynamicons Update Debug] Mappings object after updateFn (this will be sent to config.update):`, JSON.stringify(newMappingsResult, null, 2))

			if (JSON.stringify(originalMappingsFromConfig) === JSON.stringify(newMappingsResult)) {
				console.warn(`[Dynamicons Update Debug] WARNING: Mappings object after updateFn is identical to original. No update will likely occur or is needed.`)
				// If no message was shown by updateFn (e.g. "No custom assignment found"), show a generic one.
				// This part might need refinement based on whether updateFn already showed a message.
			} else {
				console.log(`[Dynamicons Update Debug] Mappings object IS different. Proceeding with config.update.`)
			}

			try {
				console.log(`[Dynamicons Update Debug] Attempting to call config.update with key '${this.CUSTOM_MAPPINGS_KEY}' and target Global.`)
				await config.update(this.CUSTOM_MAPPINGS_KEY, newMappingsResult, this.vscodeConfigTarget.Global)
				console.log(`[Dynamicons Update Debug] config.update call completed for key: ${this.CUSTOM_MAPPINGS_KEY}. Check settings.json.`)
				// The success message like "Icon assignment reverted" is shown by the calling method (revertIconAssignment)
			} catch (error: any) {
				console.error(`[Dynamicons Update Debug] Error during config.update:`, error)
				this.iWindow.showErrorMessage(`Failed to update icon mappings: ${error.message || 'Unknown error'}`)
			}
		}
	} //<

	private async getIconOptionsFromDirectory( //>
		directoryUri: VsCodeUri,
		iconKind: 'file' | 'folder' | 'user',
		filter?: (filename: string) => boolean,
	): Promise<IconQuickPickItemInternal[]> {
		const iconOptions: IconQuickPickItemInternal[] = []

		try {
			const entries = await this.iFspReaddir(directoryUri.fsPath, { withFileTypes: true }) as Dirent[]

			for (const entry of entries) {
				if (entry.isFile() && entry.name.endsWith('.svg') && (!filter || filter(entry.name))) {
					const iconNameWithoutExt = this.iPathParse(entry.name).name
					let iconDefinitionKey: string

					if (iconKind === 'user') {
						// User-defined icons use the _user_ prefix
						iconDefinitionKey = `${dynamiconsConstants.defaults.userIconDefinitionPrefix}${iconNameWithoutExt}`
					} else if (iconKind === 'folder') {
						// Built-in folder icons (e.g., "folder-src.svg") should have definition keys like "_folder-src"
						// The iconNameWithoutExt here would be "folder-src" or "folder-basic"
						// Filter already ensures we don't process "-open.svg" variants here for base assignment
						iconDefinitionKey = `_${iconNameWithoutExt}`
					} else { // 'file'
						// Built-in file icons (e.g., "javascript.svg") should have definition keys like "_javascript"
						// The iconNameWithoutExt here would be "javascript"
						iconDefinitionKey = `_${iconNameWithoutExt}`
					}

					iconOptions.push({
						label: iconNameWithoutExt.replace(/^folder-/, '').replace(new RegExp(`${dynamiconsConstants.defaults.openFolderIconSuffix}$`), ''), // Clean label for display
						description: `(${iconKind}) ${entry.name}`,
						iconPath: VsCodeUriUtil.joinPath(directoryUri, entry.name), // For QuickPick preview
						iconNameInDefinitions: iconDefinitionKey,
					})
				}
			}
		} catch (error: any) {
			if (error.code !== 'ENOENT') { // Ignore if directory simply doesn't exist (e.g., user dir not set)
				this.iCommonUtils.errMsg(`Error reading icon directory ${directoryUri.fsPath}`, error)
			}
		}
		return iconOptions.sort((a, b) => a.label.localeCompare(b.label))
	} //<

	public async showAvailableIconsQuickPick( //>
		assignableToType?: 'file' | 'folder',
		currentFilter?: (iconName: string) => boolean,
	): Promise<string | undefined> {
		const builtInFileIconsDirUri = VsCodeUriUtil.joinPath(
			this.extensionContext.extensionUri,
			this.BUILT_IN_FILE_ICONS_REL_PATH,
		)
		const builtInFolderIconsDirUri = VsCodeUriUtil.joinPath(
			this.extensionContext.extensionUri,
			this.BUILT_IN_FOLDER_ICONS_REL_PATH,
		)

		const config = this.iWorkspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const userIconsDirSetting = config.get<string>(this.USER_ICONS_DIR_KEY)

		let fileIconOptions: IconQuickPickItemInternal[] = []
		let folderIconOptions: IconQuickPickItemInternal[] = []
		let userIconOptions: IconQuickPickItemInternal[] = []

		if (assignableToType === 'file' || !assignableToType) {
			fileIconOptions = await this.getIconOptionsFromDirectory(builtInFileIconsDirUri, 'file')
		}
		if (assignableToType === 'folder' || !assignableToType) {
			const folderFilter = (
				name: string,
			) => !name.endsWith(`${dynamiconsConstants.defaults.openFolderIconSuffix}.svg`)

			folderIconOptions = await this.getIconOptionsFromDirectory(
				builtInFolderIconsDirUri,
				'folder',
				folderFilter,
			)
		}

		if (userIconsDirSetting) {
			try {
				const userIconsDirUri = VsCodeUriUtil.file(userIconsDirSetting)

				await this.iFspStat(userIconsDirUri.fsPath) // Check if dir exists
				userIconOptions = await this.getIconOptionsFromDirectory(userIconsDirUri, 'user')
			} catch (error: any) {
				if (error.code === 'ENOENT') {
					this.iWindow.showWarningMessage(
						`User icons directory not found: ${userIconsDirSetting}. Please check the '${this.EXTENSION_CONFIG_PREFIX}.${this.USER_ICONS_DIR_KEY}' setting.`,
					)
				} else {
					this.iCommonUtils.errMsg(`Error accessing user icons directory: ${userIconsDirSetting}`, error)
				}
			}
		}

		// Apply the currentFilter if provided
		const filterFn = currentFilter || (() => true)

		fileIconOptions = fileIconOptions.filter(item => filterFn(item.iconNameInDefinitions))
		folderIconOptions = folderIconOptions.filter(item => filterFn(item.iconNameInDefinitions))
		userIconOptions = userIconOptions.filter(item => filterFn(item.iconNameInDefinitions))

		const combinedIconOptions: DataOrSeparator<IconQuickPickItemInternal>[] = []

		if (userIconOptions.length > 0) {
			combinedIconOptions.push({ label: 'User Icons', kind: QuickPickItemKind.Separator })
			combinedIconOptions.push(...userIconOptions)
		}
		if (fileIconOptions.length > 0 && (assignableToType === 'file' || !assignableToType)) {
			combinedIconOptions.push({ label: 'File Icons (Built-in)', kind: QuickPickItemKind.Separator })
			combinedIconOptions.push(...fileIconOptions)
		}
		if (folderIconOptions.length > 0 && (assignableToType === 'folder' || !assignableToType)) {
			combinedIconOptions.push({ label: 'Folder Icons (Built-in)', kind: QuickPickItemKind.Separator })
			combinedIconOptions.push(...folderIconOptions)
		}

		const dataItems = combinedIconOptions.filter(
			item => item.kind !== QuickPickItemKind.Separator,
		) as IconQuickPickItemInternal[]

		if (dataItems.length === 0) {
			this.iWindow.showInformationMessage('No available icons match the criteria.')
			return undefined
		}

		const selection = await this.iQuickPickUtils.showQuickPickSingle<IconQuickPickItemInternal, 'iconNameInDefinitions'>(
			dataItems,
			{
				placeHolder: 'Select an icon definition',
				matchOnDescription: true,
				matchOnDetail: true,
			},
			'iconNameInDefinitions',
		)

		return selection
	} //<

	public async assignIconToResource( //>
		resourceUri: VsCodeUri | undefined,
		iconTypeScope?: IconAssociationType,
	): Promise<void> {
		if (!resourceUri) {
			this.iWindow.showWarningMessage('No file or folder selected.')
			return
		}

		const resourceName = await this.getResourceName(resourceUri)

		if (!resourceName) {
			this.iWindow.showErrorMessage('Could not determine the name of the selected resource.')
			return
		}

		let typeToAssign = iconTypeScope

		if (!typeToAssign) {
			try {
				const stat = await this.iFspStat(resourceUri.fsPath)

				typeToAssign = stat.isDirectory() ? 'folder' : 'file'
			} catch (error) {
				this.iCommonUtils.errMsg(`Could not determine type of resource: ${resourceUri.fsPath}`, error)
				return
			}
		}
		if (typeToAssign === 'language') { // Language ID assignment not fully fleshed out here, focusing on file/folder
			this.iWindow.showWarningMessage(
				'Language icon assignment via this command is not yet fully supported.',
			)
			return
		}

		const iconNameKey = await this.showAvailableIconsQuickPick(typeToAssign)

		if (!iconNameKey) {
			return // User cancelled
		}

		await this.updateCustomIconMappings(undefined, async (mappings) => {
			const associationKey = this.getAssociationKey(resourceName, typeToAssign as IconAssociationType)

			mappings[associationKey] = iconNameKey
			return mappings // Return the modified mappings object
		})
		// this.iWindow.showInformationMessage(
		// 	`Icon '${iconNameKey.replace(dynamiconsConstants.defaults.iconThemeNamePrefix, '').replace(
		// 		dynamiconsConstants.defaults.userIconDefinitionPrefix,
		// 		'user:',
		// 	)}' assigned to ${typeToAssign} '${resourceName}'. Applying theme changes...`,
		// )
	} //<

	public async revertIconAssignment(resourceUri: VsCodeUri | undefined): Promise<void> { //>
		if (!resourceUri) {
			this.iWindow.showWarningMessage('No file or folder selected.')
			return
		}

		const resourceName = await this.getResourceName(resourceUri)

		if (!resourceName) {
			this.iWindow.showErrorMessage('Could not determine the name of the selected resource.')
			return
		}

		let changeMade = false

		await this.updateCustomIconMappings(undefined, async (mappings) => {
			let found = false
			let actualType: 'file' | 'folder' | undefined

			try {
				const stat = await this.iFspStat(resourceUri.fsPath)

				actualType = stat.isDirectory() ? 'folder' : 'file'

				// eslint-disable-next-line unused-imports/no-unused-vars
			} catch (_statError) {

			}

			const typesToTry: IconAssociationType[] = actualType
				? [actualType]
				: ['file', 'folder']

			for (const type of typesToTry) {
				const associationKey = this.getAssociationKey(resourceName, type)

				if (Object.prototype.hasOwnProperty.call(mappings, associationKey)) {
					delete mappings[associationKey]
					found = true
					break
				}
			}

			if (!found) {
				const langAssociationKey = this.getAssociationKey(resourceName, 'language')

				if (Object.prototype.hasOwnProperty.call(mappings, langAssociationKey)) {
					delete mappings[langAssociationKey]
					found = true
				}
			}

			if (found) {
				changeMade = true
				return mappings // Return the modified mappings to be persisted
			} else {
				this.iWindow.showInformationMessage(`No custom icon assignment found for '${resourceName}'.`)
				return false // Signal no changes to persist
			}
		})

		if (changeMade) {
			// this.iWindow.showInformationMessage(
			// 	`Custom icon assignment for '${resourceName}' reverted. Applying theme changes...`,
			// )
		}
	} //<

	public async toggleExplorerArrows(): Promise<void> { //>
		const config = this.iWorkspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const currentSetting = config.get<boolean | null>(this.HIDE_ARROWS_KEY)
		let newSetting: boolean

		if (currentSetting === null || currentSetting === undefined) {
			// If not explicitly set, default to hiding them first, then toggle
			newSetting = true // Default action is to hide if unset
		} else {
			newSetting = !currentSetting
		}
		await config.update(this.HIDE_ARROWS_KEY, newSetting, this.vscodeConfigTarget.Global)
		// this.iWindow.showInformationMessage(
		// 	`Explorer arrow visibility updated to '${newSetting ? 'hidden' : 'shown'}'. Applying theme changes...`,
		// )
	} //<

	public async showUserIconAssignments( //>
		type: 'file' | 'folder' | 'language',
	): Promise<void> {
		const config = this.iWorkspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const mappings = config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || {}
		const relevantMappings: string[] = []

		const typePrefix = dynamiconsConstants.associationKeyPrefixes[type]

		for (const key in mappings) {
			if (key.startsWith(typePrefix)) {
				const assignedIconKey = mappings[key]
				const cleanIconName = assignedIconKey
					.replace(dynamiconsConstants.defaults.iconThemeNamePrefix, '')
					.replace(dynamiconsConstants.defaults.userIconDefinitionPrefix, 'user:')

				relevantMappings.push(`- ${key.substring(typePrefix.length).trim()}: ${cleanIconName}`)
			}
		}

		if (relevantMappings.length === 0) {
			this.iWindow.showInformationMessage(`No custom ${type} icon assignments found.`)
			return
		}
		// For potentially long lists, a modal or document might be better, but info message is fine for now.
		this.iWindow.showInformationMessage(
			`Custom ${type} assignments:\n${relevantMappings.join('\n')}`,
			{ modal: relevantMappings.join('\n').length > 100 },
		)
	} //<

	public async refreshIconTheme(): Promise<void> { //>
		// This method is primarily for the user-invoked command "dynamicons.refreshIconTheme".
		// The actual logic for regeneration and application is now centralized in
		// `regenerateAndApplyTheme` within `extension.ts`, which is called by the
		// command registration for "dynamicons.refreshIconTheme".
		// Internal operations (assign, revert, toggle arrows) trigger this logic
		// via the `onDidChangeConfiguration` listener in `extension.ts`.
		// Thus, this service method itself doesn't need to duplicate that logic.
		// It can simply inform the user that the command has been received,
		// and the extension will handle the process.

		console.log('[IconActionsService] refreshIconTheme() called. Actual refresh handled by extension command/event.')
	} //<

}