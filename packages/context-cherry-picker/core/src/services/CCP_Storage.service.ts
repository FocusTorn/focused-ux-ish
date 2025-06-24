// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, TreeItemCheckboxState, Uri as VsCodeUri } from 'vscode'
import { Uri as VsCodeUriUtil } from 'vscode'

//= NODE JS ===================================================================================================
import { Buffer } from 'node:buffer'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IStorageService } from '../_interfaces/IStorageService.js'
import type { ISavedStateItem } from '../_interfaces/ISavedStateItem.js'

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
	private initializationPromise: Promise<void> | null = null

	constructor(
		@inject('iContext') private readonly context: ExtensionContext,
		@inject('IWorkspace') private readonly workspaceAdapter: IWorkspace,
	) {
		this.storageFileUri = VsCodeUriUtil.joinPath(this.context.globalStorageUri, STORAGE_FILE_NAME)
	}

	private _initializeStorage(): Promise<void> { //>
		if (!this.initializationPromise) {
			this.initializationPromise = (async () => {
				try {
					// Check if the storage file already exists
					await this.workspaceAdapter.fs.stat(this.storageFileUri)
				}
				catch { // Error object intentionally not used here
					// File doesn't exist or other stat error, try to create it
					try {
						// Ensure the globalStorageUri directory exists
						await this.workspaceAdapter.fs.createDirectory(this.context.globalStorageUri)
						// Create the empty storage file
						await this.workspaceAdapter.fs.writeFile(this.storageFileUri, Buffer.from(JSON.stringify({}, null, 2)))
						console.log(`[${localCcpConstants.extension.nickName}] Storage file initialized at ${this.storageFileUri.fsPath}`)
					}
					catch (createError) {
						console.error(`[${localCcpConstants.extension.nickName}] Critical error creating storage file ${this.storageFileUri.fsPath}:`, createError)
						// Propagate the error to fail the initialization promise
						throw createError
					}
				}
			})()
		}
		return this.initializationPromise
	} //<

	private async readStorage(): Promise<SavedStatesFileFormat> { //>
		await this._initializeStorage() // Ensure storage is initialized before reading
		try {
			const fileContents = await this.workspaceAdapter.fs.readFile(this.storageFileUri)

			return JSON.parse(Buffer.from(fileContents).toString('utf-8')) as SavedStatesFileFormat
		}
		catch (error) {
			// Log error, but return an empty object to allow the application to proceed gracefully if possible
			console.error(`[${localCcpConstants.extension.nickName}] Error reading storage file ${this.storageFileUri.fsPath}:`, error)
			return {}
		}
	} //<

	private async writeStorage(data: SavedStatesFileFormat): Promise<void> { //>
		await this._initializeStorage() // Ensure storage is initialized before writing
		try {
			await this.workspaceAdapter.fs.writeFile(this.storageFileUri, Buffer.from(JSON.stringify(data, null, 2)))
		}
		catch (error) {
			console.error(`[${localCcpConstants.extension.nickName}] Error writing storage file ${this.storageFileUri.fsPath}:`, error)
			throw error // Rethrow write errors as they might be critical
		}
	} //<

	async saveState(name: string, checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>): Promise<void> { //>
		const storage = await this.readStorage()
		const id = Date.now().toString() // Simple unique ID

		storage[id] = {
			label: name,
			timestamp: Date.now(),
			checkedItems,
		}
		await this.writeStorage(storage)
	} //<

	async loadState(id: string): Promise<Array<{ uriString: string, checkboxState: TreeItemCheckboxState }> | undefined> { //>
		const storage = await this.readStorage()

		return storage[id]?.checkedItems
	} //<

	async loadAllSavedStates(): Promise<ISavedStateItem[]> { //>
		const storage = await this.readStorage()

		return Object.entries(storage).map(([id, data]) => ({
			id,
			label: data.label,
			timestamp: data.timestamp,
			checkedItems: data.checkedItems,
		}))
	} //<

	async deleteState(id: string): Promise<void> { //>
		const storage = await this.readStorage()

		if (storage[id]) {
			delete storage[id]
			await this.writeStorage(storage)
		}
	} //<

}
