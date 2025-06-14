// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { EventEmitter, FileType as VsCodeFileTypeEnum, TreeItemCheckboxState, Uri, TreeItemCollapsibleState } from 'vscode'
import type { Event, TreeItem, TreeItemLabel, FileSystemError, ConfigurationChangeEvent, FileSystemWatcher, Disposable } from 'vscode' // Added Disposable

//= NODE JS ===================================================================================================
import { Buffer } from 'node:buffer'

//= MISC ======================================================================================================
import micromatch from 'micromatch'
import * as yaml from 'js-yaml'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFileExplorerDataProvider } from '../_interfaces/IFileExplorerDataProvider.ts'
import { FileExplorerItem } from '../models/FileExplorerItem.js'
import { constants } from '../_config/constants.js'

//= INJECTED TYPES ============================================================================================
import type { IWorkspace, IWindow } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

interface ProjectYamlConfig { //>
	ContextCherryPicker?: {
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
export class FileExplorerDataProvider implements IFileExplorerDataProvider, Disposable { //> // Added Disposable

	private _onDidChangeTreeData: EventEmitter<FileExplorerItem | undefined | null | void> = new EventEmitter<FileExplorerItem | undefined | null | void>()
	readonly onDidChangeTreeData: Event<FileExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event

	private checkboxStates: Map<string, TreeItemCheckboxState> = new Map()
	private fileWatcher: FileSystemWatcher | undefined
	private isInitialized = false
	private configChangeListener: Disposable | undefined;

	// Configuration properties
	private globalIgnoreGlobs: string[] = []
	private contextExplorerIgnoreGlobs: string[] = []
	private contextExplorerHideChildrenGlobs: string[] = []
	private projectTreeAlwaysShowGlobs: string[] = []
	private projectTreeAlwaysHideGlobs: string[] = []
	private projectTreeShowIfSelectedGlobs: string[] = []

	constructor(
		@inject('IWorkspace') private readonly workspaceAdapter: IWorkspace,
		@inject('IWindow') private readonly windowAdapter: IWindow,
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
		const ccpKey = constants.projectConfig.keys.contextCherryPicker

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

		const keys = constants.projectConfig.keys
		const cfg = constants.configKeys

		const newGlobalIgnore = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.ignore], cfg.CCP_IGNORE_PATTERNS, [])
		const newExplorerIgnore = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.context_explorer, keys.ignore], cfg.CCP_CONTEXT_EXPLORER_IGNORE_GLOBS, [])
		const newExplorerHideChildren = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.context_explorer, keys.hide_children], cfg.CCP_CONTEXT_EXPLORER_HIDE_CHILDREN_GLOBS, [])
		const newTreeAlwaysShow = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.always_show], cfg.CCP_PROJECT_TREE_ALWAYS_SHOW_GLOBS, [])
		const newTreeAlwaysHide = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.always_hide], cfg.CCP_PROJECT_TREE_ALWAYS_HIDE_GLOBS, [])
		const newTreeShowIfSelected = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.show_if_selected], cfg.CCP_PROJECT_TREE_SHOW_IF_SELECTED_GLOBS, [])

		let changed = false

		if (JSON.stringify(this.globalIgnoreGlobs) !== JSON.stringify(newGlobalIgnore)) {
			this.globalIgnoreGlobs = newGlobalIgnore; changed = true
		}
		if (JSON.stringify(this.contextExplorerIgnoreGlobs) !== JSON.stringify(newExplorerIgnore)) {
			this.contextExplorerIgnoreGlobs = newExplorerIgnore; changed = true
		}
		if (JSON.stringify(this.contextExplorerHideChildrenGlobs) !== JSON.stringify(newExplorerHideChildren)) {
			this.contextExplorerHideChildrenGlobs = newExplorerHideChildren; changed = true
		}
		if (JSON.stringify(this.projectTreeAlwaysShowGlobs) !== JSON.stringify(newTreeAlwaysShow)) {
			this.projectTreeAlwaysShowGlobs = newTreeAlwaysShow; changed = true
		}
		if (JSON.stringify(this.projectTreeAlwaysHideGlobs) !== JSON.stringify(newTreeAlwaysHide)) {
			this.projectTreeAlwaysHideGlobs = newTreeAlwaysHide; changed = true
		}
		if (JSON.stringify(this.projectTreeShowIfSelectedGlobs) !== JSON.stringify(newTreeShowIfSelected)) {
			this.projectTreeShowIfSelectedGlobs = newTreeShowIfSelected; changed = true
		}

		if (changed && this.isInitialized) { // Only fire if initialized to avoid premature refresh
			this._onDidChangeTreeData.fire()
		}
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                       PROVIDER INTERFACE                                         │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	private isUriHiddenForProviderUi(uri: Uri): boolean { //>
		const relativePath = this.workspaceAdapter.asRelativePath(uri, false).replace(/\\/g, '/')

		if (micromatch.isMatch(relativePath, this.globalIgnoreGlobs))
			return true
		if (micromatch.isMatch(relativePath, this.contextExplorerIgnoreGlobs))
			return true
		return false
	} //<

	async getChildren(element?: FileExplorerItem): Promise<FileExplorerItem[]> { //>
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

			for (const [name, type] of entries) {
				const childUri = Uri.joinPath(sourceUri, name)

				if (this.isUriHiddenForProviderUi(childUri))
					continue

				let collapsibleStateOverride: TreeItemCollapsibleState | undefined
				const relativeChildPath = this.workspaceAdapter.asRelativePath(childUri, false).replace(/\\/g, '/')

				if (type === VsCodeFileTypeEnum.Directory && micromatch.isMatch(relativeChildPath, this.contextExplorerHideChildrenGlobs)) {
					collapsibleStateOverride = TreeItemCollapsibleState.None
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
		await this.loadConfigurationPatterns() // Ensure patterns are reloaded
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
		this._onDidChangeTreeData.fire() // Fire for individual updates too
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
	// │                                     GLOB GETTERS FOR SERVICES                                    │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	public getCoreScanIgnoreGlobs(): string[] { //>
		return [...this.globalIgnoreGlobs] // Return a copy
	} //<

	public getContextExplorerIgnoreGlobs(): string[] { //>
		return [...this.contextExplorerIgnoreGlobs] // Return a copy
	} //<

	public getContextExplorerHideChildrenGlobs(): string[] { //>
		return [...this.contextExplorerHideChildrenGlobs] // Return a copy
	} //<

	public getProjectTreeAlwaysShowGlobs(): string[] { //>
		return [...this.projectTreeAlwaysShowGlobs] // Return a copy
	} //<

	public getProjectTreeAlwaysHideGlobs(): string[] { //>
		return [...this.projectTreeAlwaysHideGlobs] // Return a copy
	} //<

	public getProjectTreeShowIfSelectedGlobs(): string[] { //>
		return [...this.projectTreeShowIfSelectedGlobs] // Return a copy
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                       LIFECYCLE MANAGEMENT                                       │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	public dispose(): void { //>
		this._onDidChangeTreeData.dispose();
		if (this.fileWatcher) {
			this.fileWatcher.dispose();
		}
		if (this.configChangeListener) {
			this.configChangeListener.dispose();
		}
		console.log(`[${constants.extension.name}] FileExplorerDataProvider disposed.`);
	} //<

}