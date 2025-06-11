// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, TreeItemCheckboxState, Uri as VsCodeUri } from 'vscode'
import { Uri as VsCodeUriUtil } from 'vscode'

//= NODE JS ===================================================================================================
import { Buffer } from 'node:buffer'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IStorageService } from '../_interfaces/IStorageService.ts'
import type { ISavedStateItem } from '../_interfaces/ISavedStateItem.ts'

//= INJECTED TYPES ============================================================================================
import type { IWorkspace } from '@focused-ux/shared-services'
import { constants as localCcpConstants } from '../_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

interface SavedStateStorageEntry { //>
	label: string
	timestamp: number
	checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>
} //<

interface SavedStatesFileFormat { //>
	[id: string]: SavedStateStorageEntry
} //<

const STORAGE_FILE_NAME = `${localCcpConstants.extension.id}.savedStates.json`

@injectable()
export class StorageService implements IStorageService { //>

	private storageFileUri: VsCodeUri

	constructor(
		@inject('iContext') private readonly context: ExtensionContext,
		@inject('iWorkspace') private readonly workspaceAdapter: IWorkspace,
	) {
		// Use globalStorageUri for extension-specific, machine-wide storage
		this.storageFileUri = VsCodeUriUtil.joinPath(this.context.globalStorageUri, STORAGE_FILE_NAME)
		this.ensureStorageFileExists()
	}

	private async ensureStorageFileExists( //>
	): Promise<void> {
		try {
			await this.workspaceAdapter.fs.stat(this.storageFileUri)
		} catch {
			// If file doesn't exist, create it with an empty JSON object
			await this.workspaceAdapter.fs.createDirectory(this.context.globalStorageUri) // Ensure directory exists
			await this.workspaceAdapter.fs.writeFile(this.storageFileUri, Buffer.from(JSON.stringify({}, null, 2)))
		}
	} //<

	private async readStorage( //>
	): Promise<SavedStatesFileFormat> {
		try {
			const fileContents = await this.workspaceAdapter.fs.readFile(this.storageFileUri)

			return JSON.parse(Buffer.from(fileContents).toString('utf-8')) as SavedStatesFileFormat
		} catch (error) {
			console.error(`[${localCcpConstants.extension.nickName}] Error reading storage file:`, error)
			return {} // Return empty object on error
		}
	} //<
    
	private async writeStorage( //>
		data: SavedStatesFileFormat,
	): Promise<void> {
		try {
			await this.workspaceAdapter.fs.writeFile(this.storageFileUri, Buffer.from(JSON.stringify(data, null, 2)))
		} catch (error) {
			console.error(`[${localCcpConstants.extension.nickName}] Error writing storage file:`, error)
		}
	} //<

	async saveState( //>
		name: string,
		checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>,
	): Promise<void> {
		const storage = await this.readStorage()
		const id = Date.now().toString() // Simple unique ID

		storage[id] = {
			label: name,
			timestamp: Date.now(),
			checkedItems,
		}
		await this.writeStorage(storage)
	} //<

	async loadState( //>
		id: string,
	): Promise<Array<{ uriString: string, checkboxState: TreeItemCheckboxState }> | undefined> {
		const storage = await this.readStorage()

		return storage[id]?.checkedItems
	} //<

	async loadAllSavedStates( //>
	): Promise<ISavedStateItem[]> {
		const storage = await this.readStorage()

		return Object.entries(storage).map(([id, data]) => ({
			id,
			label: data.label,
			timestamp: data.timestamp,
			checkedItems: data.checkedItems,
		}))
	} //<

	async deleteState( //>
		id: string,
	): Promise<void> {
		const storage = await this.readStorage()

		if (storage[id]) {
			delete storage[id]
			await this.writeStorage(storage)
		}
	} //<
    
}
