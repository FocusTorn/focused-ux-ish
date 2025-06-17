// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, singleton } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, TreeView, Uri } from 'vscode'
import * as vscode from 'vscode' // For vscode.env.clipboard, vscode.TreeItemCheckboxState etc.

//= IMPLEMENTATION TYPES ======================================================================================
import type { IContextCherryPickerManager } from '../_interfaces/IContextCherryPickerManager.ts'
import type { IFileExplorerDataProvider } from '../_interfaces/IFileExplorerDataProvider.ts'
import type { ISavedStatesDataProvider } from '../_interfaces/ISavedStatesDataProvider.ts'
import type { IStorageService } from '../_interfaces/IStorageService.ts'
import type { SavedStateItem } from '../models/SavedStateItem.ts'
import type { IQuickSettingsDataProvider } from '../_interfaces/IQuickSettingsDataProvider.ts'
import type { FileExplorerItem } from '../models/FileExplorerItem.ts'
import type { IContextDataCollectorService } from '../_interfaces/IContextDataCollectorService.ts'
import type { IProjectTreeFormatterService } from '../_interfaces/IProjectTreeFormatterService.ts'
import type { IFileContentProviderService } from '../_interfaces/IFileContentProviderService.ts'

//= INJECTED TYPES ============================================================================================
import { constants } from '../_config/constants.js' // Path to local constants
import type { ICommands, IWindow, IWorkspace } from '@focused-ux/shared-services' // Using shared services
import type * as nodePath from 'node:path'

//--------------------------------------------------------------------------------------------------------------<<

const LOG_PREFIX = `[${constants.extension.nickName} - CCP_Manager]:`

@singleton()
export class ContextCherryPickerManager implements IContextCherryPickerManager {

	private _explorerView: TreeView<FileExplorerItem> | undefined
	private _savedStatesView: TreeView<SavedStateItem> | undefined
	private projectRootUri!: vscode.Uri

	constructor( //>
		@inject('iContext') private readonly _context: ExtensionContext,
		@inject('IFileExplorerDataProvider')
		private readonly _fileExplorerDataProvider: IFileExplorerDataProvider,
		@inject('ISavedStatesDataProvider')
		private readonly _savedStatesDataProvider: ISavedStatesDataProvider,
		@inject('IQuickSettingsDataProvider')
		private readonly _quickSettingsDataProvider: IQuickSettingsDataProvider,
		@inject('IStorageService') private readonly _storageService: IStorageService,
		@inject('IContextDataCollectorService') private readonly _contextDataCollector: IContextDataCollectorService,
		@inject('IProjectTreeFormatterService') private readonly _projectTreeFormatter: IProjectTreeFormatterService,
		@inject('IFileContentProviderService') private readonly _fileContentProvider: IFileContentProviderService,
		@inject('ICommands') private readonly _commands: ICommands,
		@inject('IWindow') private readonly _window: IWindow,
		@inject('IWorkspace') private readonly _workspace: IWorkspace,
		@inject('iPathBasename') private readonly _pathBasename: typeof nodePath.basename,
	) {} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                          PUBLIC METHODS                                          │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘    
    
	public async initializeViews( //>
		explorerViewId: string, // These will be satellite-specific IDs
		savedStatesViewId: string,
		quickSettingsViewId: string,
	): Promise<void> {
		this._explorerView = this._window.createTreeView(explorerViewId, {
			treeDataProvider: this._fileExplorerDataProvider,
			showCollapseAll: true,
			canSelectMany: true,
		})
		this._context.subscriptions.push(this._explorerView)

		this._explorerView.description = ' '

		this._explorerView.onDidChangeCheckboxState(
			(e: vscode.TreeCheckboxChangeEvent<FileExplorerItem>) => { //>
				if (e.items && e.items.length > 0) {
					for (const [item, state] of e.items) {
						if (item.uri) {
							this._fileExplorerDataProvider.updateCheckboxState(item.uri, state)
						}
					}
				}
			}, //<
			null,
			this._context.subscriptions,
		)

		this._savedStatesView = this._window.createTreeView(savedStatesViewId, {
			treeDataProvider: this._savedStatesDataProvider,
		})
		this._context.subscriptions.push(this._savedStatesView)

		const quickSettingsDisposable = this._window.registerWebviewViewProvider(
			quickSettingsViewId,
			this._quickSettingsDataProvider,
		)

		this._context.subscriptions.push(quickSettingsDisposable)

		// Listen for setting updates from the quick settings view
		this._quickSettingsDataProvider.onDidUpdateSetting(async ({ settingId }) => {
			if (settingId.startsWith(constants.quickSettings.fileGroupVisibility.idPrefix)) {
				await this.refreshExplorerView()
			}
		})

		await this._fileExplorerDataProvider.refresh()
		this._savedStatesDataProvider.refresh()
		await this._quickSettingsDataProvider.refresh()
	} //<
    
	public async saveCurrentCheckedState(): Promise<void> { //>
		const checkedItems = this.getCheckedExplorerItems()

		if (checkedItems.length === 0) {
			this._window.showInformationMessage('No items are checked to save.')
			return
		}

		const stateName = await this._window.showInputBox({ prompt: 'Enter a name for this saved state' })

		if (stateName) {
			const itemsToSave = checkedItems.map(uri => ({
				uriString: uri.toString(),
				checkboxState: this._fileExplorerDataProvider.getCheckboxState(uri) || vscode.TreeItemCheckboxState.Unchecked,
			}))

			await this._storageService.saveState(stateName, itemsToSave)
			this._savedStatesDataProvider.refresh()
            
			this.showStatusMessage('drop', `💾 State '${stateName}' saved.`)
		}
	} //<

	public async copyCheckedFilePaths(): Promise<void> { //>
		const checkedUris = this.getCheckedExplorerItems()

		if (checkedUris.length === 0) {
			this._window.showInformationMessage('No file paths to copy.')
			return
		}
		await vscode.env.clipboard.writeText(checkedUris.map(uri => uri.fsPath).join('\n'))
		this._window.showInformationMessage('Checked file paths copied to clipboard.')
	} //<

	public async refreshExplorerView(): Promise<void> { //>
		await this._fileExplorerDataProvider.refresh()
	} //<

	public async deleteSavedState(stateItem: SavedStateItem): Promise<void> { //>
		if (!stateItem || !stateItem.id)
			return

		const confirm = await this._window.showWarningMessage(`Delete "${stateItem.label || stateItem.id}"?`, { modal: true }, 'Delete')

		if (confirm === 'Delete') {
			await this._storageService.deleteState(stateItem.id)
			this._savedStatesDataProvider.refresh()
		}
	} //<

	public async loadSavedStateIntoExplorer(stateItem: SavedStateItem): Promise<void> { //>
		if (!stateItem || !stateItem.id)
			return

		const loadedItems = await this._storageService.loadState(stateItem.id)

		if (loadedItems) {
			this._fileExplorerDataProvider.loadCheckedState(loadedItems)
			await this._fileExplorerDataProvider.refresh() // Ensure view updates after loading
		}
	} //<

	public async clearAllCheckedInExplorer(): Promise<void> { //>
		this._fileExplorerDataProvider.clearAllCheckboxes()
	} //<

	public async copyContextOfCheckedItems(): Promise<void> { //>
		console.log(`${LOG_PREFIX} copyContextOfCheckedItems called.`)

		const initialCheckedUris = this.getCheckedExplorerItems()

		const workspaceFolders = this._workspace.workspaceFolders

		if (!workspaceFolders || workspaceFolders.length === 0) {
			this._window.showInformationMessage('No workspace folder open.')
			return
		}
		this.projectRootUri = workspaceFolders[0].uri

		const projectRootName = this._pathBasename(this.projectRootUri.fsPath) || 'ProjectRoot'

		let totalTokens = 0
		const maxTokens = 500000 // This could be a setting

		const projectStructureQuickSettingMode = await this.getQuickSettingState(constants.quickSettings.projectStructureContents.id) as 'all' | 'selected' | 'none'

		console.log(`${LOG_PREFIX} Project Structure Quick Setting Mode:`, projectStructureQuickSettingMode)

		// Get static configuration globs from the provider
		const staticCoreIgnores = this._fileExplorerDataProvider.getCoreScanIgnoreGlobs()
		const contextExplorerIgnoreGlobs = this._fileExplorerDataProvider.getContextExplorerIgnoreGlobs()
		const contextExplorerHideChildrenGlobs = this._fileExplorerDataProvider.getContextExplorerHideChildrenGlobs()
		const outputFilterAlwaysShow = this._fileExplorerDataProvider.getProjectTreeAlwaysShowGlobs()
		const outputFilterAlwaysHide = this._fileExplorerDataProvider.getProjectTreeAlwaysHideGlobs()
		const outputFilterShowIfSelected = this._fileExplorerDataProvider.getProjectTreeShowIfSelectedGlobs()

		// Build dynamic ignore list from file group toggles
		const dynamicIgnoreGlobs: string[] = []
		const fileGroups = this._fileExplorerDataProvider.getFileGroupsConfig()

		if (fileGroups) {
			for (const groupName in fileGroups) {
				const settingId = `${constants.quickSettings.fileGroupVisibility.idPrefix}.${groupName}`
				const isVisible = await this.getQuickSettingState(settingId)

				if (isVisible === false) { // If toggle is off, add its patterns to the ignore list
					dynamicIgnoreGlobs.push(...(fileGroups[groupName].items || []))
				}
			}
		}

		// Combine static and dynamic ignores for the content scan
		const finalCoreScanIgnores = [...staticCoreIgnores, ...dynamicIgnoreGlobs]

		const collectionResult = await this._contextDataCollector.collectContextData(
			projectStructureQuickSettingMode,
			initialCheckedUris,
			this.projectRootUri,
			finalCoreScanIgnores,
			contextExplorerIgnoreGlobs,
			contextExplorerHideChildrenGlobs,
		)
		const { treeEntries, contentFileUris } = collectionResult

		let formattedTreeString = ''

		if (projectStructureQuickSettingMode !== 'none') {
			formattedTreeString = this._projectTreeFormatter.formatProjectTree(
				treeEntries,
				this.projectRootUri,
				projectRootName,
				outputFilterAlwaysShow,
				outputFilterAlwaysHide,
				outputFilterShowIfSelected,
				initialCheckedUris,
			)
		}

		const fileContentResult = await this._fileContentProvider.getFileContents(
			contentFileUris,
			treeEntries,
			maxTokens,
			totalTokens,
		)
		const filesContentOutputString = fileContentResult.contentString

		totalTokens += fileContentResult.processedTokens

		let finalOutput = '<context>\n'

		if (projectStructureQuickSettingMode !== 'none') {
			finalOutput += '<project_tree>'
			if (formattedTreeString && formattedTreeString.trim() !== '') {
				finalOutput += `\n${formattedTreeString.trim()}\n`
			}
			finalOutput += '</project_tree>\n'
		}

		finalOutput += `<project_files>\n${filesContentOutputString || '\n'}</project_files>\n`
		finalOutput += '</context>'

		console.log(`${LOG_PREFIX} Total tokens for final output (estimate): ${totalTokens}`)

		const isTreeSectionIncluded = projectStructureQuickSettingMode !== 'none'
		const isEmptyTreeContent = !formattedTreeString.trim()
		const isEmptyFileContent = !filesContentOutputString.trim() || filesContentOutputString === '\n'

		if (projectStructureQuickSettingMode === 'none' && contentFileUris.size === 0) {
			this._window.showInformationMessage('No items selected for content, and project tree is set to "none".')
		}
		else if (isTreeSectionIncluded && isEmptyTreeContent && contentFileUris.size === 0) {
			this._window.showInformationMessage('No content to copy (tree and files are empty after processing filters).')
		}
		else if (contentFileUris.size > 0 && isEmptyFileContent) {
			if (projectStructureQuickSettingMode === 'none') {
				this._window.showInformationMessage('Selected files for content were empty or could not be read; project tree is "none".')
			}
			else {
				this._window.showInformationMessage('Selected files for content were empty or could not be read.')
			}
		}
		else if (!isTreeSectionIncluded && isEmptyFileContent) {
			this._window.showInformationMessage('No content to copy (project tree is "none" and no file content was generated).')
		}
		else if (isTreeSectionIncluded && isEmptyTreeContent && isEmptyFileContent) {
			this._window.showInformationMessage('No content to copy (tree and files are empty after processing).')
		}
		else {
			await vscode.env.clipboard.writeText(finalOutput)
            
			this.showStatusMessage('drop', `📋 Context copied (~${totalTokens} tokens)`, 1000)
		}
	} //<

	public async getQuickSettingState(settingId: string): Promise<any> { //>
		return this._quickSettingsDataProvider.getSettingState(settingId)
	} //<
    
	public getCheckedExplorerItems(): Uri[] { //>
		return this._fileExplorerDataProvider.getAllCheckedItems()
	} //<
    
	public showStatusMessage( //>
		type: 'vsc' | 'drop' | 'desc' | 'replace',
		message: string,
		duration: number = 1250,
	): void {
		switch (type) {
			case 'vsc':
				this._window.showInformationMessage(message)
				break
			case 'drop':
				this._setDropExplorerMessage(message, duration)
				break
			case 'desc':
				this._setDescExplorerMessage(message, duration)
				break
			case 'replace':
				this._fileExplorerDataProvider.showStatusMessage(message, duration)
				break
			default:
				this._window.showInformationMessage(message)
				break
		}
	} //<
    
	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                         PRIVATE HELPERS                                          │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	private _setDropExplorerMessage(message: string, duration?: number): void { //>
		if (!this._explorerView) {
			return
		}
		this._explorerView.message = message
		if (duration) {
			setTimeout(() => {
				if (this._explorerView && this._explorerView.message === message) {
					this._explorerView.message = undefined
				}
			}, duration)
		}
	} //<

	private _setDescExplorerMessage(message: string, duration?: number): void { //>
		if (!this._explorerView) {
			return
		}
		this._explorerView.description = message
		if (duration) {
			setTimeout(() => {
				if (this._explorerView && this._explorerView.description === message) {
					this._explorerView.description = ''
				}
			}, duration)
		}
	} //<
    
}
