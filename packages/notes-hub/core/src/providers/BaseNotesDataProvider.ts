// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type {
	CancellationToken,
	DataTransfer,
	Event,
	ExtensionContext,
	FileSystemWatcher,
	ProviderResult,
	TreeDragAndDropController,
	TreeView,
	Uri,
	TreeItem,
} from 'vscode'
import {
	DataTransferItem,
	EventEmitter,
	FileType,
	RelativePattern,
	ThemeIcon,
	TreeItemCollapsibleState,
	Uri as VsCodeUri,
} from 'vscode'

//= NODE JS ===================================================================================================
import { basename, dirname, extname, join, normalize } from 'node:path'
import { constants as fsConstants } from 'node:fs'
import { Buffer } from 'node:buffer'
import { access as fspAccess } from 'node:fs/promises'

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubDataProvider } from '../_interfaces/INotesHubDataProvider.js'
import { NotesHubItem } from '../models/NotesHubItem.js'

//= INJECTED TYPES ============================================================================================
import type { ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, ICommands } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

const DEFAULT_ROOT_ICON = 'folder'
const PROJECT_ROOT_ICON = 'project'
const REMOTE_ROOT_ICON = 'remote-explorer'
const GLOBAL_ROOT_ICON = 'globe'
const DEFAULT_FOLDER_ICON = 'folder'

const ALLOWED_EXTENSIONS = ['.md', '.txt', '.txte']

export abstract class BaseNotesDataProvider implements INotesHubDataProvider, TreeDragAndDropController<NotesHubItem> {

	private _onDidChangeTreeData: EventEmitter<NotesHubItem | undefined | null | void> = new EventEmitter()
	readonly onDidChangeTreeData: Event<NotesHubItem | undefined | null | void> = this._onDidChangeTreeData.event

	public treeView?: TreeView<NotesHubItem>
	private fileWatcher: FileSystemWatcher

	public readonly dropMimeTypes = ['text/uri-list']
	public readonly dragMimeTypes = ['text/uri-list']

	constructor(
		public readonly notesDir: string,
		public readonly providerName: 'project' | 'remote' | 'global',
		private readonly openNoteCommandId: string,
		protected readonly iContext: ExtensionContext,
		protected readonly iWindow: IWindow,
		protected readonly iWorkspace: IWorkspace,
		protected readonly iCommands: ICommands,
		protected readonly iCommonUtils: ICommonUtilsService,
		protected readonly iFrontmatterUtils: IFrontmatterUtilsService,
		protected readonly iPathUtils: IPathUtilsService,
	) {
		if (this.providerName === 'project' && this.notesDir.includes('.fux-notes')) {
			this.addDirToGitignore('.fux-notes')
		}

		this.fileWatcher = this.iWorkspace.createFileSystemWatcher(
			new RelativePattern(this.notesDir, '**/*'),
		)
		this.fileWatcher.onDidChange(() => this.refresh())
		this.fileWatcher.onDidCreate(() => this.refresh())
		this.fileWatcher.onDidDelete(() => this.refresh())
		this.iContext.subscriptions.push(this.fileWatcher)
	}

	public initializeTreeView(viewId: string): TreeView<NotesHubItem> {
		this.treeView = this.iWindow.createTreeView(viewId, {
			treeDataProvider: this,
			showCollapseAll: true,
			canSelectMany: true,
			dragAndDropController: this,
		})

		this.treeView.onDidChangeSelection(async (e) => {
			if (e.selection.length > 0) {
				const clickedItem = e.selection[0]
				if (!clickedItem.isDirectory && clickedItem.resourceUri) {
					this.iCommands.executeCommand(this.openNoteCommandId, clickedItem)
				}
			}
		})

		this.iContext.subscriptions.push(this.treeView)
		return this.treeView
	}

	public refresh(): void {
		this._onDidChangeTreeData.fire(undefined)
	}

	public dispose(): void {
		this._onDidChangeTreeData.dispose()
		this.fileWatcher.dispose()
		this.treeView?.dispose()
	}

	public getParent(element: NotesHubItem): ProviderResult<NotesHubItem> {
		if (!element.parentUri) {
			return undefined
		}
		return undefined
	}

	public async getTreeItem(element: NotesHubItem): Promise<TreeItem> {
		if (element.isDirectory) {
			// If it's a root item (no parent), start it as expanded. Otherwise, collapsed.
			element.collapsibleState = !element.parentUri
				? TreeItemCollapsibleState.Expanded
				: TreeItemCollapsibleState.Collapsed
		}
		else {
			element.collapsibleState = TreeItemCollapsibleState.None
		}

		if (element.isDirectory) {
			if (!element.parentUri) { // This is a root folder for this provider
				switch (this.providerName) {
					case 'project':
						element.iconPath = new ThemeIcon(PROJECT_ROOT_ICON)
						break
					case 'remote':
						element.iconPath = new ThemeIcon(REMOTE_ROOT_ICON)
						break
					case 'global':
						element.iconPath = new ThemeIcon(GLOBAL_ROOT_ICON)
						break
					default:
						element.iconPath = new ThemeIcon(DEFAULT_ROOT_ICON)
				}
			}
			else {
				element.iconPath = new ThemeIcon(DEFAULT_FOLDER_ICON)
			}
		}
		return element
	}

	public async getChildren(element?: NotesHubItem): Promise<NotesHubItem[]> {
		try {
			const dirPath = element?.filePath || this.notesDir

			if (!element) { // Root level for this provider
				const rootFolderItem = new NotesHubItem(basename(this.notesDir), this.notesDir, true)
				return [rootFolderItem]
			}

			if (element.isDirectory && element.resourceUri) {
				const entries = await this.iWorkspace.fs.readDirectory(element.resourceUri)
				const items: NotesHubItem[] = []

				for (const [name, fileType] of entries) {
					const filePath = join(dirPath, name)
					const isDir = (fileType & FileType.Directory) > 0

					if (isDir || this.isExtensionValid(filePath)) {
						const frontmatter = !isDir ? await this.iFrontmatterUtils.getFrontmatter(filePath) : undefined
						const item = new NotesHubItem(name, filePath, isDir, element.resourceUri, frontmatter)
						items.push(item)
					}
				}
				return items.sort(this.sortItems)
			}
			return []
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Error reading directory: ${element?.filePath || this.notesDir}`, error)
			return []
		}
	}

	public async getNotesHubItem(uri: Uri): Promise<NotesHubItem | undefined> {
		try {
			const filePath = uri.fsPath
			const stats = await this.iWorkspace.fs.stat(uri)
			const isDirectory = (stats.type & FileType.Directory) > 0
			const fileName = basename(filePath)
			const parentPath = dirname(filePath)
			const parentUri = parentPath !== filePath ? VsCodeUri.file(parentPath) : undefined

			let frontmatter: { [key: string]: string } | undefined
			if (!isDirectory && this.isExtensionValid(filePath)) {
				frontmatter = await this.iFrontmatterUtils.getFrontmatter(filePath)
			}
			return new NotesHubItem(fileName, filePath, isDirectory, parentUri, frontmatter)
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Error creating NotesHubItem for URI: ${uri.fsPath}`, error)
			return undefined
		}
	}

	public async handleDrag(
		source: readonly NotesHubItem[],
		dataTransfer: DataTransfer,
		_token: CancellationToken,
	): Promise<void> {
		const validSourceUris = source
			.map(item => item.resourceUri?.toString())
			.filter(uriString => uriString !== undefined) as string[]

		if (validSourceUris.length > 0) {
			dataTransfer.set('text/uri-list', new DataTransferItem(validSourceUris.join('\n')))
		}
	}

	public async handleDrop(
		target: NotesHubItem | undefined,
		dataTransfer: DataTransfer,
		token: CancellationToken,
	): Promise<void> {
		if (token.isCancellationRequested) {
			return
		}

		const transferItem = dataTransfer.get('text/uri-list')
		if (!transferItem) {
			this.iCommonUtils.errMsg('Invalid drop data: Missing text/uri-list.')
			return
		}

		const draggedUriStrings = (await transferItem.asString()).split('\n')
		if (draggedUriStrings.length === 0 || !draggedUriStrings[0]) {
			this.iCommonUtils.errMsg('Invalid drop data: No URIs found.')
			return
		}

		const sourceUri = VsCodeUri.parse(draggedUriStrings[0])
		if (!sourceUri) {
			this.iCommonUtils.errMsg('Invalid drop data: Could not parse source URI.')
			return
		}

		let targetDirUri: Uri
		if (target) {
			targetDirUri = target.isDirectory ? target.resourceUri! : VsCodeUri.file(dirname(target.filePath))
		}
		else {
			targetDirUri = VsCodeUri.file(this.notesDir)
		}

		const sourceName = basename(sourceUri.fsPath)
		const newTargetPathUri = VsCodeUri.joinPath(targetDirUri, sourceName)

		if (sourceUri.toString() === newTargetPathUri.toString()) {
			return
		}

		if (await this.fileExists(newTargetPathUri.fsPath)) {
			const confirm = await this.confirmOverwrite(sourceName)
			if (!confirm) {
				return
			}
		}

		try {
			await this.iWorkspace.fs.rename(sourceUri, newTargetPathUri, { overwrite: true })
			this.refresh()
		}
		catch (err) {
			this.iCommonUtils.errMsg(`Failed to move item '${sourceName}'`, err)
		}
	}

	private sortItems(a: NotesHubItem, b: NotesHubItem): number {
		const aIsDir = a.isDirectory ? 0 : 1
		const bIsDir = b.isDirectory ? 0 : 1
		const aLabel = typeof a.label === 'string' ? a.label : a.label?.label || ''
		const bLabel = typeof b.label === 'string' ? b.label : b.label?.label || ''
		return aIsDir - bIsDir || aLabel.localeCompare(bLabel)
	}

	private isExtensionValid(filePath: string): boolean {
		return ALLOWED_EXTENSIONS.includes(extname(filePath).toLowerCase())
	}

	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fspAccess(this.iPathUtils.santizePath(filePath), fsConstants.F_OK)
			return true
		}
		catch {
			return false
		}
	}

	private async confirmOverwrite(itemName: string): Promise<boolean> {
		const message = `'${itemName}' already exists. Overwrite?`
		const result = await this.iWindow.showInformationMessage(message, { modal: true }, 'Overwrite')
		return result === 'Overwrite'
	}

	private async addDirToGitignore(dirToIgnore: string): Promise<void> {
		const workspaceFolder = this.iWorkspace.workspaceFolders?.[0]
		if (!workspaceFolder) {
			return
		}

		const gitignoreUri = VsCodeUri.joinPath(workspaceFolder.uri, '.gitignore')
		try {
			let gitignoreContent = ''
			try {
				const rawContent = await this.iWorkspace.fs.readFile(gitignoreUri)
				gitignoreContent = Buffer.from(rawContent).toString('utf-8')
			}
			catch (error) {
				const fsError = error as NodeJS.ErrnoException
				if (fsError.code !== 'ENOENT' && fsError.code !== 'FileNotFound') {
					this.iCommonUtils.errMsg(`Error reading .gitignore: ${gitignoreUri.fsPath}`, fsError)
				}
			}

			const lineToSearch = `/${dirToIgnore}/`
			if (!gitignoreContent.includes(lineToSearch)) {
				const newEntry = `${gitignoreContent.length > 0 ? '\n' : ''}# Ignored by F-UX Notes Hub\n${lineToSearch}\n`
				const fullContent = gitignoreContent + newEntry
				await this.iWorkspace.fs.writeFile(gitignoreUri, Buffer.from(fullContent, 'utf-8'))
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to update .gitignore for ${dirToIgnore}`, error)
		}
	}

	protected santizePath(uncleanPath: string): string {
		const normalPath = normalize(uncleanPath)
		return normalPath.replace(/\\/g, '/')
	}
}