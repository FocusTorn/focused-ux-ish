// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { EventEmitter, FileType as VsCodeFileTypeEnum, TreeItemCheckboxState, Uri, TreeItemCollapsibleState } from 'vscode'
import type { Event, TreeItem, TreeItemLabel, FileSystemError, ConfigurationChangeEvent } from 'vscode'

//= NODE JS ===================================================================================================
import { Buffer } from 'node:buffer'

//= MISC ======================================================================================================
import micromatch from 'micromatch'
import * as yaml from 'js-yaml'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFileExplorerDataProvider } from '../_interfaces/IFileExplorerDataProvider.ts'
import { FileExplorerItem } from '../models/FileExplorerItem.js'
import { constants } from '../_config/constants.js' // Path to local constants

//= INJECTED TYPES ============================================================================================
import type { IWorkspace, IWindow } from '@focused-ux/shared-services' // Using shared services

//--------------------------------------------------------------------------------------------------------------<<

interface ProjectYamlConfig { //>
	ContextCherryPicker?: {
		ignore?: string[]
		projectTreeDisplay?: {
			alwaysHide?: string[]
			showIfSelected?: string[]
		}
		directoryContentDisplay?: {
			showDirHideContents?: string[]
			hideDirAndContents?: string[]
		}
	}
} //<

@injectable()
export class FileExplorerDataProvider implements IFileExplorerDataProvider { //>

	private _onDidChangeTreeData: EventEmitter<FileExplorerItem | undefined | null | void> = new EventEmitter<FileExplorerItem | undefined | null | void>()
	readonly onDidChangeTreeData: Event<FileExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event

	private checkboxStates: Map<string, TreeItemCheckboxState> = new Map()
	private coreIgnorePatterns: string[] = []
	private coreDirContentHideDirAndContentsGlobs: string[] = []
	private coreDirContentShowDirHideContentsGlobs: string[] = []
	private outputProjectTreeAlwaysHideGlobs: string[] = []
	private outputProjectTreeShowIfSelectedGlobs: string[] = []

	constructor(
		@inject('iWorkspace') private readonly workspaceAdapter: IWorkspace,
		@inject('iWindow') private readonly windowAdapter: IWindow,
	) {
		this.loadConfigurationPatterns()
		this.workspaceAdapter.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => { //>
			if (e.affectsConfiguration(constants.extension.configKey)) {
				await this.loadConfigurationPatterns()
			}
		}) //<
	}

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                     CONFIGURATION HANDLING                                       │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	private getPatternsFromSources( //>
		parsedYamlConfig: ProjectYamlConfig | undefined,
		yamlPath: string[],
		vscodeSettingKey: string,
		defaultValue: string[] = [],
	): string[] {
		let patterns: string[] | undefined

		if (parsedYamlConfig) {
			let currentLevel: any = parsedYamlConfig

			for (const key of yamlPath) {
				if (currentLevel && typeof currentLevel === 'object' && Object.prototype.hasOwnProperty.call(currentLevel, key)) {
					currentLevel = currentLevel[key]
				} else {
					currentLevel = undefined
					break
				}
			}
			if (Array.isArray(currentLevel)) {
				patterns = currentLevel as string[]
			}
		}

		if (patterns !== undefined) {
			return patterns
		} else {
			const vsCodePatterns = this.workspaceAdapter.getConfiguration(constants.extension.configKey).get<string[]>(vscodeSettingKey.substring(constants.extension.configKey.length + 1))

			return vsCodePatterns || defaultValue
		}
	} //<

	private async loadConfigurationPatterns(): Promise<void> { //>
		let parsedYamlConfig: ProjectYamlConfig | undefined
		const ccpSatelliteKey = constants.projectConfig.keys.contextCherryPicker

		if (this.workspaceAdapter.workspaceFolders && this.workspaceAdapter.workspaceFolders.length > 0) {
			const workspaceRoot = this.workspaceAdapter.workspaceFolders[0].uri
			const configFileUri = Uri.joinPath(workspaceRoot, constants.projectConfig.fileName)

			try {
				const fileContents = await this.workspaceAdapter.fs.readFile(configFileUri)
				const yamlContent = Buffer.from(fileContents).toString('utf-8')

				parsedYamlConfig = yaml.load(yamlContent) as ProjectYamlConfig
			} catch (_error: any) {
				const fsError = _error as FileSystemError

				if (fsError && typeof fsError.code === 'string' && fsError.code === 'FileNotFound') {
					// console.log(`[${constants.extension.name}] No '${constants.projectConfig.fileName}' found. Using VS Code settings for all patterns.`);
				} else {
					console.warn(`[${constants.extension.name}] Error reading or parsing '${constants.projectConfig.fileName}': ${(_error instanceof Error ? _error.message : String(_error))}. Falling back to VS Code settings.`)
				}
			}
		}

		const newCoreIgnorePatterns = this.getPatternsFromSources(
			parsedYamlConfig,
			[ccpSatelliteKey, constants.projectConfig.keys.ignore],
			constants.configKeys.CCP_IGNORE_PATTERNS,
			[],
		)
		const newCoreDirHideAndContents = this.getPatternsFromSources(
			parsedYamlConfig,
			[ccpSatelliteKey, constants.projectConfig.keys.directoryContentDisplay, constants.projectConfig.keys.hideDirAndContents],
			constants.configKeys.CCP_DIR_CONTENT_HIDE_DIR_AND_CONTENTS_GLOBS,
			[],
		)
		const newCoreDirShowHideContents = this.getPatternsFromSources(
			parsedYamlConfig,
			[ccpSatelliteKey, constants.projectConfig.keys.directoryContentDisplay, constants.projectConfig.keys.showDirHideContents],
			constants.configKeys.CCP_DIR_CONTENT_SHOW_DIR_HIDE_CONTENTS_GLOBS,
			[],
		)
		const newOutputAlwaysHide = this.getPatternsFromSources(
			parsedYamlConfig,
			[ccpSatelliteKey, constants.projectConfig.keys.projectTreeDisplay, constants.projectConfig.keys.alwaysHide],
			constants.configKeys.CCP_PROJECT_TREE_ALWAYS_HIDE_GLOBS,
			[],
		)
		const newOutputShowIfSelected = this.getPatternsFromSources(
			parsedYamlConfig,
			[ccpSatelliteKey, constants.projectConfig.keys.projectTreeDisplay, constants.projectConfig.keys.showIfSelected],
			constants.configKeys.CCP_PROJECT_TREE_SHOW_IF_SELECTED_GLOBS,
			[],
		)
		
		let changed = false

		if (JSON.stringify(this.coreIgnorePatterns) !== JSON.stringify(newCoreIgnorePatterns)) {
			this.coreIgnorePatterns = newCoreIgnorePatterns; changed = true
		}
		if (JSON.stringify(this.coreDirContentHideDirAndContentsGlobs) !== JSON.stringify(newCoreDirHideAndContents)) {
			this.coreDirContentHideDirAndContentsGlobs = newCoreDirHideAndContents; changed = true
		}
		if (JSON.stringify(this.coreDirContentShowDirHideContentsGlobs) !== JSON.stringify(newCoreDirShowHideContents)) {
			this.coreDirContentShowDirHideContentsGlobs = newCoreDirShowHideContents; changed = true
		}
		if (JSON.stringify(this.outputProjectTreeAlwaysHideGlobs) !== JSON.stringify(newOutputAlwaysHide)) {
			this.outputProjectTreeAlwaysHideGlobs = newOutputAlwaysHide; changed = true
		}
		if (JSON.stringify(this.outputProjectTreeShowIfSelectedGlobs) !== JSON.stringify(newOutputShowIfSelected)) {
			this.outputProjectTreeShowIfSelectedGlobs = newOutputShowIfSelected; changed = true
		}

		if (changed) {
			this._onDidChangeTreeData.fire()
		}
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                       PROVIDER INTERFACE                                         │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	private isUriHiddenForProviderUi(uri: Uri): boolean { //>
		const relativePath = this.workspaceAdapter.asRelativePath(uri, false).replace(/\\/g, '/')

		if (micromatch.isMatch(relativePath, this.coreIgnorePatterns))
			return true
		if (micromatch.isMatch(relativePath, this.coreDirContentHideDirAndContentsGlobs))
			return true
		return false
	} //<

	async getChildren(element?: FileExplorerItem): Promise<FileExplorerItem[]> { //>
		if (!this.workspaceAdapter.workspaceFolders || this.workspaceAdapter.workspaceFolders.length === 0)
			return []
		
		const children: FileExplorerItem[] = []
		const sourceUri = element ? element.uri : this.workspaceAdapter.workspaceFolders[0].uri

		if (element && element.type === 'directory') {
			const relativeElementPath = this.workspaceAdapter.asRelativePath(element.uri, false).replace(/\\/g, '/')

			if (micromatch.isMatch(relativeElementPath, this.coreDirContentShowDirHideContentsGlobs)) {
				return []
			}
		}
		
		try {
			const entries = await this.workspaceAdapter.fs.readDirectory(sourceUri)

			for (const [name, type] of entries) {
				const childUri = Uri.joinPath(sourceUri, name)

				if (this.isUriHiddenForProviderUi(childUri))
					continue

				let collapsibleStateOverride: TreeItemCollapsibleState | undefined
				const relativeChildPath = this.workspaceAdapter.asRelativePath(childUri, false).replace(/\\/g, '/')

				if (type === VsCodeFileTypeEnum.Directory && micromatch.isMatch(relativeChildPath, this.coreDirContentShowDirHideContentsGlobs)) {
					collapsibleStateOverride = TreeItemCollapsibleState.None // Directory shown, but not expandable
				}
				children.push(new FileExplorerItem(childUri, name, type, this.getCheckboxState(childUri) || TreeItemCheckboxState.Unchecked, undefined, collapsibleStateOverride))
			}
		} catch (_error: any) {
			console.error(`[${constants.extension.name}] Error reading directory ${sourceUri.fsPath}:`, _error)
			this.windowAdapter.showErrorMessage(`Error reading directory: ${(element?.label as TreeItemLabel)?.label || (element?.label as string) || sourceUri.fsPath}`)
		}
		
		children.sort((a, b) => { //>
			if (a.type === 'directory' && b.type === 'file')
				return -1
			if (a.type === 'file' && b.type === 'directory')
				return 1

			const labelA = typeof a.label === 'string' ? a.label : (a.label as TreeItemLabel)?.label || ''
			const labelB = typeof b.label === 'string' ? b.label : (b.label as TreeItemLabel)?.label || ''

			return labelA.localeCompare(labelB)
		}) //<
		
		return children
	} //<

	getTreeItem(element: FileExplorerItem): TreeItem { //>
		const currentState = this.getCheckboxState(element.uri)

		element.checkboxState = currentState === undefined ? TreeItemCheckboxState.Unchecked : currentState

		if (element.collapsibleState === undefined) {
			element.collapsibleState = element.type === 'directory' ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
		}
		return element
	} //<

	async refresh(): Promise<void> { //>
		await this.loadConfigurationPatterns() // This will fire _onDidChangeTreeData if patterns changed
		this._onDidChangeTreeData.fire() // Explicitly fire to ensure UI refresh even if patterns didn't change
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                        CHECKBOX STATE MGMT                                       │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	clearAllCheckboxes(): void { //>
		let itemsWereActuallyCleared = false

		this.checkboxStates.forEach((state, uriString) => {
			if (state === TreeItemCheckboxState.Checked) {
				this.checkboxStates.set(uriString, TreeItemCheckboxState.Unchecked)
				itemsWereActuallyCleared = true
			}
		})

		if (itemsWereActuallyCleared) {
			this._onDidChangeTreeData.fire()
		}
	} //<

	updateCheckboxState(uri: Uri, state: TreeItemCheckboxState): void { //>
		this.checkboxStates.set(uri.toString(), state)
		this._onDidChangeTreeData.fire() // Refresh the view to show checkbox state change
	} //<

	getCheckboxState(uri: Uri): TreeItemCheckboxState | undefined { //>
		return this.checkboxStates.get(uri.toString())
	} //<

	getAllCheckedItems(): Uri[] { //>
		const checkedUris: Uri[] = []

		this.checkboxStates.forEach((state, uriString) => {
			if (state === TreeItemCheckboxState.Checked) {
				try {
					const uri = Uri.parse(uriString)

					// Ensure items hidden from provider UI aren't included if they somehow got checked
					if (!this.isUriHiddenForProviderUi(uri)) {
						checkedUris.push(uri)
					}
				} catch (_error: any) {
					console.error(`[${constants.extension.name}] Error parsing URI string in getAllCheckedItems: ${uriString}`, _error)
				}
			}
		})
		return checkedUris
	} //<

	loadCheckedState(itemsToLoad: Array<{ uriString: string, checkboxState: number }>): void { //>
		this.checkboxStates.clear()
		for (const item of itemsToLoad) {
			this.checkboxStates.set(item.uriString, item.checkboxState as TreeItemCheckboxState)
		}
		this._onDidChangeTreeData.fire()
	} //<
	
	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                     NEW INTERFACE METHODS                                      │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘
	public getCoreScanIgnoreGlobs(): string[] { //>
		return this.coreIgnorePatterns
	} //<

	public getCoreScanDirHideAndContentsGlobs(): string[] { //>
		return this.coreDirContentHideDirAndContentsGlobs
	} //<

	public getCoreScanDirShowDirHideContentsGlobs(): string[] { //>
		return this.coreDirContentShowDirHideContentsGlobs
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                    EXISTING INTERFACE METHODS                                    │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘
	public getProjectTreeAlwaysHideGlobs(): string[] { //>
		return this.outputProjectTreeAlwaysHideGlobs
	} //<

	public getProjectTreeShowIfSelectedGlobs(): string[] { //>
		return this.outputProjectTreeShowIfSelectedGlobs
	} //<

}
