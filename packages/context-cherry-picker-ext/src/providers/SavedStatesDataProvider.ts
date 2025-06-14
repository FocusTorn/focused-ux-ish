// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { EventEmitter } from 'vscode'
import type { Event, TreeItem, TreeItemLabel } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { ISavedStatesDataProvider } from '../_interfaces/ISavedStatesDataProvider.ts'
import type { IStorageService } from '../_interfaces/IStorageService.ts'
import { SavedStateItem } from '../models/SavedStateItem.js'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class SavedStatesDataProvider implements ISavedStatesDataProvider { //>

	private _onDidChangeTreeData: EventEmitter<SavedStateItem | undefined | null | void> = new EventEmitter<SavedStateItem | undefined | null | void>()
	readonly onDidChangeTreeData: Event<SavedStateItem | undefined | null | void> = this._onDidChangeTreeData.event

	constructor(
		@inject('IStorageService') private readonly storageService: IStorageService,
	) {}

	getTreeItem( //>
		element: SavedStateItem,
	): TreeItem {
		return element
	} //<

	async getChildren( //>
		element?: SavedStateItem,
	): Promise<SavedStateItem[]> {
		if (element) {
			return [] // Saved states are flat, no children
		}

		const savedStatesData = await this.storageService.loadAllSavedStates()

		return savedStatesData.map((data) => { //>
			const labelString = typeof data.label === 'string' ? data.label : (data.label as TreeItemLabel)?.label || 'Unnamed State'

			return new SavedStateItem(data.id, labelString, data.timestamp, data.checkedItems)
		}) //<
	} //<

	refresh(): void { //>
		this._onDidChangeTreeData.fire()
	} //<

}
