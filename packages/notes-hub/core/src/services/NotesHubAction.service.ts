// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, MessageItem, FileType as VsCodeFileTypeEnum } from 'vscode'
import { Uri, ProgressLocation as VsCodeProgressLocation, commands as VsCodeCommands } from 'vscode'
import { Buffer } from 'node:buffer'

//= NODE JS ===================================================================================================
import type * as nodePath from 'node:path'
import { constants as fsConstants } from 'node:fs'
import type { access as fspAccessType, rename as fspRenameType } from 'node:fs/promises'

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubActionService } from '../_interfaces/INotesHubActionService.js'
import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'
import { NotesHubItem } from '../models/NotesHubItem.js'
import { notesHubConstants } from '../_config/constants.js'
import type { INotesHubProviderManager } from '../_interfaces/INotesHubProviderManager.js'

//= INJECTED TYPES ============================================================================================
import type { ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, IEnv } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

const ALLOWED_EXTENSIONS_NOTES_HUB = ['.md', '.txt', '.txte']

interface ConfirmMessageItem extends MessageItem { //>
	choice: string
} //<

@injectable()
export class NotesHubActionService implements INotesHubActionService {

	constructor( //>
		@inject('ExtensionContext') private readonly iContext: ExtensionContext,
		@inject('IWindow') private readonly iWindow: IWindow,
		@inject('IWorkspace') private readonly iWorkspace: IWorkspace,
		@inject('IEnv') private readonly iEnv: IEnv,
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject('IFrontmatterUtilsService') private readonly iFrontmatterUtils: IFrontmatterUtilsService,
		@inject('IPathUtilsService') private readonly iPathUtils: IPathUtilsService,
		@inject('INotesHubProviderManager') private readonly iProviderManager: INotesHubProviderManager,
		@inject('iPathJoin') private readonly iPathJoin: typeof nodePath.join,
		@inject('iPathDirname') private readonly iPathDirname: typeof nodePath.dirname,
		@inject('iPathBasename') private readonly iPathBasename: typeof nodePath.basename,
		@inject('iPathParse') private readonly iPathParse: typeof nodePath.parse,
		@inject('iPathExtname') private readonly iPathExtname: typeof nodePath.extname,
		@inject('iFspAccess') private readonly iFspAccess: typeof fspAccessType,
		@inject('iFspRename') private readonly iFspRename: typeof fspRenameType,
		@inject('vscodeFileType') private readonly iFileTypeEnum: typeof VsCodeFileTypeEnum,
	) {} //<

	public async openNote( //>
		noteItem: INotesHubItem): Promise<void> {
		if (!noteItem?.resourceUri) {
			this.iCommonUtils.errMsg('Could not open note: Invalid resource URI.')
			return
		}
		try {
			const doc = await this.iWorkspace.openTextDocument(noteItem.resourceUri)
			await this.iWindow.showTextDocument(doc)
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to open note: ${typeof noteItem.label === 'string' ? noteItem.label : noteItem.label?.label}`, error)
		}
	} //<

	public async renameItem( //>
		item: INotesHubItem): Promise<void> {
		const oldUri = item?.resourceUri
		if (!oldUri) {
			this.iCommonUtils.errMsg('Cannot rename item: Invalid URI.')
			return
		}
		const oldFilePath = oldUri.fsPath
		const oldName = this.iPathBasename(oldFilePath)

		const newNameWithExt = await this.iWindow.showInputBox({
			prompt: 'Enter the new name (extension will be preserved if not specified)',
			value: oldName,
		})

		if (!newNameWithExt) return

		const oldExt = this.iPathExtname(oldName)
		let newName = newNameWithExt
		let newExt = this.iPathExtname(newNameWithExt)

		if (!newExt && oldExt) {
			newExt = oldExt
		}
		else if (newExt) {
			newName = this.iPathParse(newNameWithExt).name
		}

		const finalNewName = newExt ? `${newName}${newExt}` : newName
		const newPath = this.iPathJoin(this.iPathDirname(oldFilePath), finalNewName)
		const newUri = Uri.file(this.iPathUtils.santizePath(newPath))

		if (oldUri.toString() === newUri.toString()) return

		try {
			await this.iWorkspace.fs.rename(oldUri, newUri, { overwrite: false })
			const provider = await this.iProviderManager.getProviderForNote(item)
			provider?.refresh()
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to rename item '${oldName}'`, error)
		}
	} //<

	public async addFrontmatter( //>
		noteItem: INotesHubItem): Promise<void> {
		if (!noteItem?.resourceUri || noteItem.isDirectory) {
			this.iCommonUtils.errMsg('Cannot add frontmatter: Invalid item or not a file.')
			return
		}

		try {
			const fileContentBuffer = await this.iWorkspace.fs.readFile(noteItem.resourceUri)
			const fileContent = Buffer.from(fileContentBuffer).toString('utf-8')

			if (this.iFrontmatterUtils.getFrontmatter_validateFrontmatter(fileContent)) {
				this.iWindow.showInformationMessage('Frontmatter already exists in this note.')
				return
			}

			const newFrontmatter = `---\nPriority: \nCodicon: \nDesc: \n---\n\n${fileContent}`
			await this.iWorkspace.fs.writeFile(noteItem.resourceUri, Buffer.from(newFrontmatter, 'utf-8'))
			this.iWindow.showInformationMessage('Frontmatter added successfully.')

			const provider = await this.iProviderManager.getProviderForNote(noteItem)
			provider?.refresh()
		}
		catch (error) {
			this.iCommonUtils.errMsg('Error adding frontmatter', error)
		}
	} //<

	public async openNotePreview( //>
		noteItem: INotesHubItem): Promise<void> {
		if (!noteItem?.resourceUri || noteItem.isDirectory) {
			this.iCommonUtils.errMsg('Cannot open preview: Invalid item or not a file.')
			return
		}
		try {
			await VsCodeCommands.executeCommand('markdown.showPreviewToSide', noteItem.resourceUri)
		}
		catch (error) {
			this.iCommonUtils.errMsg('Failed to open note preview.', error)
		}
	} //<

	public async deleteItem( //>
		item: INotesHubItem): Promise<void> {
		const resourceUri = item?.resourceUri
		if (!resourceUri) {
			this.iCommonUtils.errMsg('Could not delete item: Invalid resource URI.')
			return
		}

		const itemName = typeof item.label === 'string' ? item.label : item.label?.label || this.iPathBasename(resourceUri.fsPath)
		const confirm = await this.confirmAction(`Are you sure you want to delete '${itemName}'?`, 'Delete')
		if (!confirm) return

		try {
			await this.iWorkspace.fs.delete(resourceUri, { recursive: true, useTrash: true })
			const provider = await this.iProviderManager.getProviderForNote(item)
			provider?.refresh()
			this.iWindow.showInformationMessage(`Item '${itemName}' moved to trash.`)
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to delete item '${itemName}'`, error)
		}
	} //<

	public async copyItem( //>
		item: INotesHubItem): Promise<void> {
		if (!item?.resourceUri) {
			this.iCommonUtils.errMsg('Cannot copy item: Invalid item or URI.')
			return
		}
		await this.iEnv.clipboard.writeText(item.resourceUri.toString())
		await this.iContext.globalState.update(`${notesHubConstants.commands.openNote}.${notesHubConstants.storageKeys.OPERATION}`, 'copy')
		VsCodeCommands.executeCommand('setContext', `${notesHubConstants.commands.openNote}.${notesHubConstants.contextKeys.CAN_PASTE}`, true)
		this.iWindow.showInformationMessage(`'${item.fileName}' copied.`)
	} //<

	public async cutItem( //>
		item: INotesHubItem): Promise<void> {
		if (!item?.resourceUri) {
			this.iCommonUtils.errMsg('Cannot cut item: Invalid item or URI.')
			return
		}
		await this.iEnv.clipboard.writeText(item.resourceUri.toString())
		await this.iContext.globalState.update(`${notesHubConstants.commands.openNote}.${notesHubConstants.storageKeys.OPERATION}`, 'cut')
		VsCodeCommands.executeCommand('setContext', `${notesHubConstants.commands.openNote}.${notesHubConstants.contextKeys.CAN_PASTE}`, true)
		this.iWindow.showInformationMessage(`'${item.fileName}' cut.`)
	} //<

	public async pasteItem( //>
		targetFolderItem: INotesHubItem): Promise<void> {
		if (!targetFolderItem?.isDirectory || !targetFolderItem.resourceUri) {
			this.iCommonUtils.errMsg('Cannot paste item: Target is not a valid folder.')
			return
		}

		const sourceUriString = await this.iEnv.clipboard.readText()
		if (!sourceUriString) {
			this.iCommonUtils.errMsg('Clipboard is empty or contains invalid data for paste.')
			return
		}

		let sourceUri: Uri
		try {
			sourceUri = Uri.parse(sourceUriString, true)
		}
		catch (error) {
			this.iCommonUtils.errMsg('Invalid URI on clipboard for paste operation.', error)
			return
		}

		const sourceItemName = this.iPathBasename(sourceUri.fsPath)
		const targetFolderPath = targetFolderItem.resourceUri.fsPath
		const targetItemPath = this.iPathJoin(targetFolderPath, sourceItemName)
		const targetItemUri = Uri.file(this.iPathUtils.santizePath(targetItemPath))

		if (sourceUri.toString() === targetItemUri.toString()) return

		if (await this.fileExists(targetItemUri.fsPath)) {
			const confirm = await this.confirmOverwrite(sourceItemName)
			if (!confirm) return
		}

		const operation = this.iContext.globalState.get<'copy' | 'cut'>(`${notesHubConstants.commands.openNote}.${notesHubConstants.storageKeys.OPERATION}`)
		const operationName = operation === 'cut' ? 'Moving' : 'Copying'

		try {
			await this.iWindow.withProgress(
				{ location: VsCodeProgressLocation.Notification, title: `${operationName} '${sourceItemName}'...`, cancellable: false },
				async () => {
					if (operation === 'cut') {
						await this.iFspRename(sourceUri.fsPath, targetItemUri.fsPath)
					}
					else {
						await this.iWorkspace.fs.copy(sourceUri, targetItemUri, { overwrite: true })
					}
				},
			)

			const targetProvider = await this.iProviderManager.getProviderForNote(targetFolderItem)
			targetProvider?.refresh()

			const sourceStats = await this.iWorkspace.fs.stat(sourceUri)
			const sourceItemForProviderLookup = new NotesHubItem(this.iPathBasename(sourceUri.fsPath), sourceUri.fsPath, sourceStats.type === this.iFileTypeEnum.Directory)
			const sourceProvider = await this.iProviderManager.getProviderForNote(sourceItemForProviderLookup)
			if (sourceProvider && sourceProvider !== targetProvider) {
				sourceProvider.refresh()
			}

			if (operation === 'cut') {
				await this.iContext.globalState.update(`${notesHubConstants.commands.openNote}.${notesHubConstants.storageKeys.OPERATION}`, undefined)
				await this.iEnv.clipboard.writeText('')
				VsCodeCommands.executeCommand('setContext', `${notesHubConstants.commands.openNote}.${notesHubConstants.contextKeys.CAN_PASTE}`, false)
			}
			this.iWindow.showInformationMessage(`Item '${sourceItemName}' ${operation === 'cut' ? 'moved' : 'copied'}.`)
		}
		catch (err) {
			this.iCommonUtils.errMsg(`Failed to ${operationName.toLowerCase()} item`, err)
		}
	} //<

	public async newNoteInFolder( //>
		targetFolderItem: INotesHubItem): Promise<void> {
		if (!targetFolderItem?.isDirectory || !targetFolderItem.resourceUri) {
			this.iCommonUtils.errMsg('This command can only be used on a valid folder.')
			return
		}
		const provider = await this.iProviderManager.getProviderForNote(targetFolderItem)
		if (!provider) {
			this.iCommonUtils.errMsg('Could not determine provider for the target folder.')
			return
		}

		const notesDir = targetFolderItem.filePath
		const result = await this.getNewFileNameWithExtension('NewNote')
		if (!result) return

		const { newName, newExtension } = result
		const newNotePath = this.iPathJoin(notesDir, `${newName}${newExtension}`)
		const newNoteUri = Uri.file(this.iPathUtils.santizePath(newNotePath))

		try {
			await this.iWorkspace.fs.writeFile(newNoteUri, Buffer.from(`# ${newName}\n`, 'utf-8'))
			provider.refresh()
			const doc = await this.iWorkspace.openTextDocument(newNoteUri)
			await this.iWindow.showTextDocument(doc)

			const newItemForReveal = await provider.getNotesHubItem(newNoteUri)
			if (newItemForReveal) {
				await this.iProviderManager.revealNotesHubItem(provider, newItemForReveal, true)
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg('Failed to create new note', error)
		}
	} //<

	public async newFolderInFolder( //>
		targetFolderItem: INotesHubItem): Promise<void> {
		if (!targetFolderItem?.isDirectory || !targetFolderItem.resourceUri) {
			this.iCommonUtils.errMsg('This command can only be used on a valid folder.')
			return
		}
		const provider = await this.iProviderManager.getProviderForNote(targetFolderItem)
		if (!provider) {
			this.iCommonUtils.errMsg('Could not determine provider for the target folder.')
			return
		}

		const newFolderName = await this.iWindow.showInputBox({ prompt: 'Enter the name of the new folder', value: 'NewFolder' })
		if (!newFolderName) return

		const targetFolderPath = targetFolderItem.filePath
		const newFolderPath = this.iPathJoin(targetFolderPath, this.iPathUtils.santizePath(newFolderName))
		const newFolderUri = Uri.file(newFolderPath)

		try {
			await this.iFspAccess(targetFolderPath, fsConstants.W_OK)
		}
		catch (error) {
			this.iCommonUtils.errMsg('Permission denied. Cannot create a folder in this directory.', error)
			return
		}

		try {
			await this.iWorkspace.fs.createDirectory(newFolderUri)
			provider.refresh()
			const newItemForReveal = await provider.getNotesHubItem(newFolderUri)
			if (newItemForReveal) {
				await this.iProviderManager.revealNotesHubItem(provider, newItemForReveal, true)
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to create folder '${newFolderName}'`, error)
		}
	} //<

	public async newNoteAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> { //>
		const provider = this.iProviderManager.getProviderInstance(providerName)
		if (!provider) {
			this.iCommonUtils.errMsg(`Notes Hub provider '${providerName}' is not enabled or available.`)
			return
		}
		const rootItem = new NotesHubItem(this.iPathBasename(provider.notesDir), provider.notesDir, true)
		await this.newNoteInFolder(rootItem)
	} //<

	public async newFolderAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> { //>
		const provider = this.iProviderManager.getProviderInstance(providerName)
		if (!provider) {
			this.iCommonUtils.errMsg(`Notes Hub provider '${providerName}' is not enabled or available.`)
			return
		}
		const rootItem = new NotesHubItem(this.iPathBasename(provider.notesDir), provider.notesDir, true)
		await this.newFolderInFolder(rootItem)
	} //<

	private async confirmAction(message: string, confirmActionTitle: string = 'Confirm'): Promise<boolean> { //>
		const items: ConfirmMessageItem[] = [
			{ title: confirmActionTitle, choice: 'confirm' },
			{ title: 'Cancel', choice: 'cancel', isCloseAffordance: true },
		]
		const result = await this.iWindow.showWarningMessage(message, { modal: true }, ...items)
		return result?.choice === 'confirm'
	} //<

	private async confirmOverwrite(itemName: string): Promise<boolean> { //>
		return this.confirmAction(`'${itemName}' already exists. Overwrite?`, 'Overwrite')
	} //<

	private async getNewFileNameWithExtension( //>
		promptValue: string = 'NewNote',
		prompt: string = 'Enter the new name (extension will be added if missing):',
		defaultExtension: string = '.md',
	): Promise<{ newName: string, newExtension: string } | undefined> {
		let newFileNameWithExt: string | undefined
		let newFileName: string
		let fileExtension: string

		while (true) {
			newFileNameWithExt = await this.iWindow.showInputBox({
				prompt: `${prompt} Allowed: ${ALLOWED_EXTENSIONS_NOTES_HUB.join(', ')}`,
				value: promptValue,
			})

			if (!newFileNameWithExt) return undefined

			const parsedPath = this.iPathParse(newFileNameWithExt)
			newFileName = parsedPath.name
			fileExtension = parsedPath.ext.toLowerCase()

			if (fileExtension && ALLOWED_EXTENSIONS_NOTES_HUB.includes(fileExtension)) {
				break
			}
			else if (!fileExtension) {
				newFileName = newFileNameWithExt
				fileExtension = defaultExtension
				break
			}
			else {
				this.iWindow.showErrorMessage(`Invalid extension: '${fileExtension}'. Allowed: ${ALLOWED_EXTENSIONS_NOTES_HUB.join(', ')}`)
				promptValue = newFileName
			}
		}
		return { newName: newFileName, newExtension: fileExtension }
	} //<

	private async fileExists(filePath: string): Promise<boolean> { //>
		try {
			await this.iFspAccess(this.iPathUtils.santizePath(filePath), fsConstants.F_OK)
			return true
		}
		catch {
			return false
		}
	} //<
}