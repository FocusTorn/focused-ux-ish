// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { ConfigurationTarget } from 'vscode'
import type { Uri, WorkspaceConfiguration } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IIconActionsService } from '../_interfaces/IIconActionsService.ts'
import { dynamiconsConstants } from '../../../_config/dynamicons.constants.ts'
import type { IWindow, ICommands, IWorkspace, IPathUtilsService, IQuickPickUtilsService, ICommonUtilsService } from '@focused-ui/utilities-core'

//--------------------------------------------------------------------------------------------------------------<<

// Helper type for this service
type IconAssociationType = 'file' | 'folder' | 'language'

@injectable()
export class IconActionsService implements IIconActionsService {

	private readonly EXTENSION_CONFIG_PREFIX = dynamiconsConstants.configPrefix
	private readonly CUSTOM_MAPPINGS_KEY = dynamiconsConstants.configKeys.customIconMappings
	private readonly HIDE_ARROWS_KEY = dynamiconsConstants.configKeys.hideExplorerArrows
	private readonly ICON_THEME_ID_KEY = 'iconTheme' // Standard VS Code key for workbench config

	constructor(
		@inject('iWindow') private readonly iWindow: IWindow,
		@inject('iCommands') private readonly iCommands: ICommands,
		@inject('iWorkspace') private readonly iWorkspace: IWorkspace,
		@inject('IPathUtilsService') private readonly iPathUtils: IPathUtilsService,
		@inject('IQuickPickUtilsService') private readonly iQuickPickUtils: IQuickPickUtilsService,
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject('iPathBasename') private readonly iPathBasename: (p: string, ext?: string) => string,
		@inject('iFspStat') private readonly iFspStat: (path: import('node:fs').PathLike) => Promise<import('node:fs').Stats>,

	) {}

	private async getResourceName( //>
		resourceUri: Uri,
	): Promise<string | undefined> {
		try {
			const stat = await this.iFspStat(resourceUri.fsPath)
			if (stat.isDirectory()) {
				return this.iPathBasename(resourceUri.fsPath)
			}
			else if (stat.isFile()) {
				return this.iPathBasename(resourceUri.fsPath)
			}
		}
		catch (error) {
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
		resourceUri: Uri | undefined,
		updateFn: (mappings: Record<string, string>, config: WorkspaceConfiguration) => Promise<boolean | Record<string, string>>,
	): Promise<void> {
		const config = this.iWorkspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX, resourceUri)
		const currentMappings = config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || {}
		const newMappingsResult = await updateFn(currentMappings, config)

		if (typeof newMappingsResult === 'boolean') {
			if (newMappingsResult)
				await this.refreshIconTheme()
		}
		else if (typeof newMappingsResult === 'object') {
			await config.update(this.CUSTOM_MAPPINGS_KEY, newMappingsResult, ConfigurationTarget.Global)
			await this.refreshIconTheme()
		}
	} //<

	public async assignIconToResource( //>
		resourceUri: Uri | undefined,
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
			const stat = await this.iFspStat(resourceUri.fsPath)
			typeToAssign = stat.isDirectory() ? 'folder' : 'file'
		}

		const iconNameKey = await this.showAvailableIconsQuickPick(
			name => !name.startsWith(dynamiconsConstants.defaults.userIconDefinitionPrefix),
		)

		if (!iconNameKey)
			return

		await this.updateCustomIconMappings(undefined, async (mappings) => {
			const associationKey = this.getAssociationKey(resourceName, typeToAssign as IconAssociationType)
			mappings[associationKey] = iconNameKey
			return mappings
		})
		this.iWindow.showInformationMessage(`Icon '${iconNameKey}' assigned to ${typeToAssign} '${resourceName}'. Refresh theme to see changes.`)
	} //<

	public async revertIconAssignment( //>
		resourceUri: Uri | undefined,
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

		await this.updateCustomIconMappings(undefined, async (mappings) => {
			let found = false
			const typesToTry: IconAssociationType[] = ['file', 'folder', 'language']
			for (const type of typesToTry) {
				const associationKey = this.getAssociationKey(resourceName, type)
				if (mappings[associationKey]) {
					delete mappings[associationKey]
					found = true
					this.iWindow.showInformationMessage(`Icon assignment for ${type} '${resourceName}' reverted.`)
				}
			}
			if (!found) {
				this.iWindow.showInformationMessage(`No custom icon assignment found for '${resourceName}'.`)
				return false
			}
			return mappings
		})
	} //<

	public async showAvailableIconsQuickPick( //>
		iconFilter?: (iconName: string) => boolean,
	): Promise<string | undefined> {
		const placeholderIcons = {
			_file: { iconPath: '...' },
			_folder: { iconPath: '...' },
			_ts: { iconPath: '...' },
			_js: { iconPath: '...' },
		}
		const iconItems = Object.keys(placeholderIcons)
			.filter(key => iconFilter ? iconFilter(key) : true)
			.map(key => ({ label: key, description: `Path: ${(placeholderIcons as any)[key].iconPath.substring(0, 30)}...` }))

		if (iconItems.length === 0) {
			this.iWindow.showInformationMessage('No available icons match the filter or no icons defined.')
			return undefined
		}

		const selection = await this.iQuickPickUtils.showQuickPickSingle(iconItems, { placeHolder: 'Select an icon definition' }, 'label')
		return selection ? String(selection) : undefined
	} //<

	public async toggleExplorerArrows(): Promise<void> { //>
		const config = this.iWorkspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const currentSetting = config.get<boolean | null>(this.HIDE_ARROWS_KEY)
		let newSetting: boolean

		if (currentSetting === null || currentSetting === undefined) {
			newSetting = true
		}
		else {
			newSetting = !currentSetting
		}
		await config.update(this.HIDE_ARROWS_KEY, newSetting, ConfigurationTarget.Global)
		this.iWindow.showInformationMessage(`Explorer arrows will be ${newSetting ? 'hidden' : 'shown'} after next theme refresh/reload.`)
		await this.refreshIconTheme()
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
				relevantMappings.push(`- ${key.substring(typePrefix.length).trim()}: ${mappings[key]}`)
			}
		}

		if (relevantMappings.length === 0) {
			this.iWindow.showInformationMessage(`No custom ${type} icon assignments found.`)
			return
		}
		this.iWindow.showInformationMessage(`Custom ${type} assignments:\n${relevantMappings.join('\n')}`)
	} //<

	public async refreshIconTheme(): Promise<void> { //>
		const workbenchConfig = this.iWorkspace.getConfiguration('workbench')
		const currentIconTheme = workbenchConfig.get<string>(this.ICON_THEME_ID_KEY)

		if (!currentIconTheme || !currentIconTheme.includes(dynamiconsConstants.iconThemeId)) {
			return
		}

		try {
			await this.iCommands.executeCommand('workbench.action.setIconTheme', currentIconTheme)
			this.iWindow.showInformationMessage('Icon theme refresh triggered.')
		}
		catch (error) {
			this.iCommonUtils.errMsg('Failed to refresh icon theme. A window reload might be required.', error)
		}
	} //<

}
