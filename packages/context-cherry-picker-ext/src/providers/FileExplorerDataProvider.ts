// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { EventEmitter, FileType as VsCodeFileTypeEnum, TreeItemCheckboxState, Uri, TreeItemCollapsibleState, ThemeIcon } from 'vscode'
import type { Event, TreeItemLabel, FileSystemError, ConfigurationChangeEvent, FileSystemWatcher, Disposable } from 'vscode'
import { TreeItem } from 'vscode'

//= NODE JS ===================================================================================================
import { Buffer } from 'node:buffer'

//= MISC ======================================================================================================
import micromatch from 'micromatch'
import * as yaml from 'js-yaml'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFileExplorerDataProvider } from '../_interfaces/IFileExplorerDataProvider.ts'
import { FileExplorerItem } from '../models/FileExplorerItem.js'
import { constants } from '../_config/constants.js'
import type { FileGroupsConfig } from '../_interfaces/ccp.types.ts'

//= INJECTED TYPES ============================================================================================
import type { IWorkspace, IWindow } from '@focused-ux/shared-services'
import type { IQuickSettingsDataProvider } from '../_interfaces/IQuickSettingsDataProvider.ts'

//--------------------------------------------------------------------------------------------------------------<<

interface ProjectYamlConfig { //>
	ContextCherryPicker?: {
		file_groups?: FileGroupsConfig
		ignore?: string[]
		project_tree?: {
			always_show?: string[]
			always_hide?: string[]
			show_if_selected?: string[]
		}
		context_explorer?: {
			ignore?: string[]
			hide_children?: string[]
		}
	}
} //<

@injectable()
export class FileExplorerDataProvider implements IFileExplorerDataProvider, Disposable { //>

	private _onDidChangeTreeData: EventEmitter<FileExplorerItem | undefined | null | void> = new EventEmitter<FileExplorerItem | undefined | null | void>()
	readonly onDidChangeTreeData: Event<FileExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event

	private checkboxStates: Map<string, TreeItemCheckboxState> = new Map()
	private fileWatcher: FileSystemWatcher | undefined
	private isInitialized = false
	private configChangeListener: Disposable | undefined

	// Configuration properties
	private fileGroupsConfig: FileGroupsConfig | undefined
	private globalIgnoreGlobs: string[] = []
	private contextExplorerIgnoreGlobs: string[] = []
	private contextExplorerHideChildrenGlobs: string[] = []
	private projectTreeAlwaysShowGlobs: string[] = []
	private projectTreeAlwaysHideGlobs: string[] = []
	private projectTreeShowIfSelectedGlobs: string[] = []

	constructor(
		@inject('IWorkspace') private readonly workspaceAdapter: IWorkspace,
		@inject('IWindow') private readonly windowAdapter: IWindow,
		@inject('IQuickSettingsDataProvider') private readonly quickSettingsProvider: IQuickSettingsDataProvider,
	) { //>
		this.configChangeListener = this.workspaceAdapter.onDidChangeConfiguration(this._onVsCodeConfigChange)

		if (this.workspaceAdapter.workspaceFolders && this.workspaceAdapter.workspaceFolders.length > 0) {
			const workspaceRoot = this.workspaceAdapter.workspaceFolders[0].uri
			const globPattern = Uri.joinPath(workspaceRoot, constants.projectConfig.fileName).fsPath

			this.fileWatcher = this.workspaceAdapter.createFileSystemWatcher(globPattern)

			this.fileWatcher.onDidChange(this._onFocusedUxConfigChange)
			this.fileWatcher.onDidCreate(this._onFocusedUxConfigChange)
			this.fileWatcher.onDidDelete(this._onFocusedUxConfigChange)
		}
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                          EVENT HANDLERS                                          │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	private _onVsCodeConfigChange = async (e: ConfigurationChangeEvent): Promise<void> => { //>
		if (e.affectsConfiguration(constants.extension.configKey)) {
			console.log(`[${constants.extension.name}] VS Code settings changed. Refreshing explorer view.`)
			await this.refresh()
		}
	} //<

	private _onFocusedUxConfigChange = async (): Promise<void> => { //>
		console.log(`[${constants.extension.name}] '.FocusedUX' file configuration changed. Refreshing explorer view.`)
		await this.refresh()
	} //<

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
				}
				else {
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
		}
		else {
			const vsCodePatterns = this.workspaceAdapter.getConfiguration(constants.extension.configKey).get<string[]>(vscodeSettingKey.substring(constants.extension.configKey.length + 1))

			return vsCodePatterns || defaultValue
		}
	} //<

	private async loadConfigurationPatterns(): Promise<void> { //>
		let parsedYamlConfig: ProjectYamlConfig | undefined
		const ccpKey = constants.projectConfig.keys.contextCherryPicker

		if (this.workspaceAdapter.workspaceFolders && this.workspaceAdapter.workspaceFolders.length > 0) {
			const workspaceRoot = this.workspaceAdapter.workspaceFolders[0].uri
			const configFileUri = Uri.joinPath(workspaceRoot, constants.projectConfig.fileName)

			try {
				const fileContents = await this.workspaceAdapter.fs.readFile(configFileUri)
				const yamlContent = Buffer.from(fileContents).toString('utf-8')
				parsedYamlConfig = yaml.load(yamlContent) as ProjectYamlConfig
			}
			catch (_error: any) {
				const fsError = _error as FileSystemError
				if (fsError && typeof fsError.code === 'string' && fsError.code === 'FileNotFound') {
					// This is fine, we'll just use VS Code settings.
				}
				else {
					console.warn(`[${constants.extension.name}] Error reading or parsing '${constants.projectConfig.fileName}': ${(_error instanceof Error ? _error.message : String(_error))}.`)
				}
			}
		}

		const keys = constants.projectConfig.keys
		const cfg = constants.configKeys

		this.fileGroupsConfig = parsedYamlConfig?.ContextCherryPicker?.file_groups

		const newGlobalIgnore = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.ignore], cfg.CCP_IGNORE_PATTERNS, [])
		const newExplorerIgnore = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.context_explorer, keys.ignore], cfg.CCP_CONTEXT_EXPLORER_IGNORE_GLOBS, [])
		const newExplorerHideChildren = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.context_explorer, keys.hide_children], cfg.CCP_CONTEXT_EXPLORER_HIDE_CHILDREN_GLOBS, [])
		const newTreeAlwaysShow = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.always_show], cfg.CCP_PROJECT_TREE_ALWAYS_SHOW_GLOBS, [])
		const newTreeAlwaysHide = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.always_hide], cfg.CCP_PROJECT_TREE_ALWAYS_HIDE_GLOBS, [])
		const newTreeShowIfSelected = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.show_if_selected], cfg.CCP_PROJECT_TREE_SHOW_IF_SELECTED_GLOBS, [])

		this.globalIgnoreGlobs = newGlobalIgnore
		this.contextExplorerIgnoreGlobs = newExplorerIgnore
		this.contextExplorerHideChildrenGlobs = newExplorerHideChildren
		this.projectTreeAlwaysShowGlobs = newTreeAlwaysShow
		this.projectTreeAlwaysHideGlobs = newTreeAlwaysHide
		this.projectTreeShowIfSelectedGlobs = newTreeShowIfSelected
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                       PROVIDER INTERFACE                                         │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	private async isUriHiddenForProviderUi(uri: Uri): Promise<boolean> { //>
		const relativePath = this.workspaceAdapter.asRelativePath(uri, false).replace(/\\/g, '/')

		if (micromatch.isMatch(relativePath, this.globalIgnoreGlobs))
			return true
		if (micromatch.isMatch(relativePath, this.contextExplorerIgnoreGlobs))
			return true

		if (this.fileGroupsConfig) {
			for (const groupName in this.fileGroupsConfig) {
				const group = this.fileGroupsConfig[groupName]
				const settingId = `${constants.quickSettings.fileGroupVisibility.idPrefix}.${groupName}`
				const isVisible = await this.quickSettingsProvider.getSettingState(settingId)

				if (isVisible === false) { // If the toggle is OFF
					const patterns = group.items || []
					if (micromatch.isMatch(relativePath, patterns)) {
						return true // Hide it
					}
				}
			}
		}

		return false
	} //<

	async getChildren(element?: FileExplorerItem): Promise<FileExplorerItem[]> { //>
		if (!element && this._statusMessage) {
			const statusItem = new TreeItem(this._statusMessage, TreeItemCollapsibleState.None)
			statusItem.iconPath = new ThemeIcon('check')
			return [statusItem as FileExplorerItem]
		}

		if (!this.isInitialized) {
			await this.loadConfigurationPatterns()
			this.isInitialized = true
		}

		if (!this.workspaceAdapter.workspaceFolders || this.workspaceAdapter.workspaceFolders.length === 0)
			return []

		const children: FileExplorerItem[] = []
		const sourceUri = element ? element.uri : this.workspaceAdapter.workspaceFolders[0].uri

		if (element && element.type === 'directory') {
			const relativeElementPath = this.workspaceAdapter.asRelativePath(element.uri, false).replace(/\\/g, '/')
			if (micromatch.isMatch(relativeElementPath, this.contextExplorerHideChildrenGlobs)) {
				return []
			}
		}

		try {
			const entries = await this.workspaceAdapter.fs.readDirectory(sourceUri)
			const promises = entries.map(async ([name, type]) => {
				const childUri = Uri.joinPath(sourceUri, name)

				if (await this.isUriHiddenForProviderUi(childUri)) {
					return null
				}

				let collapsibleStateOverride: TreeItemCollapsibleState | undefined
				const relativeChildPath = this.workspaceAdapter.asRelativePath(childUri, false).replace(/\\/g, '/')

				if (type === VsCodeFileTypeEnum.Directory && micromatch.isMatch(relativeChildPath, this.contextExplorerHideChildrenGlobs)) {
					collapsibleStateOverride = TreeItemCollapsibleState.None
				}
				return new FileExplorerItem(childUri, name, type, this.getCheckboxState(childUri) || TreeItemCheckboxState.Unchecked, undefined, collapsibleStateOverride)
			})

			const resolvedChildren = (await Promise.all(promises)).filter(item => item !== null) as FileExplorerItem[]

			children.push(...resolvedChildren)
		}
		catch (_error: any) {
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
		if (!(element instanceof FileExplorerItem)) {
			return element
		}

		const currentState = this.getCheckboxState(element.uri)
		element.checkboxState = currentState === undefined ? TreeItemCheckboxState.Unchecked : currentState

		if (element.collapsibleState === undefined) {
			element.collapsibleState = element.type === 'directory' ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
		}
		return element
	} //<

	async refresh(): Promise<void> { //>
		await this.loadConfigurationPatterns()
		this._onDidChangeTreeData.fire()
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
		this._onDidChangeTreeData.fire()
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
					checkedUris.push(uri)
				}
				catch (_error: any) {
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
	// │                                     GLOB GETTERS FOR SERVICES                                    │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	public getCoreScanIgnoreGlobs(): string[] { //>
		return [...this.globalIgnoreGlobs]
	} //<

	public getContextExplorerIgnoreGlobs(): string[] { //>
		return [...this.contextExplorerIgnoreGlobs]
	} //<

	public getContextExplorerHideChildrenGlobs(): string[] { //>
		return [...this.contextExplorerHideChildrenGlobs]
	} //<

	public getProjectTreeAlwaysShowGlobs(): string[] { //>
		return [...this.projectTreeAlwaysShowGlobs]
	} //<

	public getProjectTreeAlwaysHideGlobs(): string[] { //>
		return [...this.projectTreeAlwaysHideGlobs]
	} //<

	public getProjectTreeShowIfSelectedGlobs(): string[] { //>
		return [...this.projectTreeShowIfSelectedGlobs]
	} //<

	public getFileGroupsConfig(): FileGroupsConfig | undefined { //>
		return this.fileGroupsConfig
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                       LIFECYCLE MANAGEMENT                                       │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	public dispose(): void { //>
		this._onDidChangeTreeData.dispose()
		if (this.fileWatcher) {
			this.fileWatcher.dispose()
		}
		if (this.configChangeListener) {
			this.configChangeListener.dispose()
		}
		console.log(`[${constants.extension.name}] FileExplorerDataProvider disposed.`)
	} //<

	private _statusMessage: string | undefined

	public showStatusMessage(message: string, duration: number): void { //>
		this._statusMessage = message
		this._onDidChangeTreeData.fire()

		setTimeout(() => {
			if (this._statusMessage === message) {
				this._statusMessage = undefined
				this._onDidChangeTreeData.fire()
			}
		}, duration)
	} //<

}