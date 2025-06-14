// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { TreeItem, TreeItemCollapsibleState, ThemeIcon } from 'vscode'
import type { TreeItemCheckboxState } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { ISavedStateItem } from '../_interfaces/ISavedStateItem.ts'
import { constants } from '../_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

export class SavedStateItem extends TreeItem implements ISavedStateItem { //>

	public id: string
	public timestamp: number
	public checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>

	constructor(
		id: string,
		name: string,
		timestamp: number,
		checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>,
	) { //>
		super(name, TreeItemCollapsibleState.None)
		this.id = id
		this.timestamp = timestamp
		this.checkedItems = checkedItems

		this.tooltip = `Saved on: ${new Date(timestamp).toLocaleString()}`
		this.description = `${checkedItems.length} items`
		this.iconPath = new ThemeIcon('save')
		this.contextValue = 'savedStateEntry' // For context menus

		// Command to execute when the item is clicked (e.g., load this state)
		// Ensure constants.commands.contextCherryPicker.loadSavedState is defined in local constants
		this.command = {
			command: constants.commands.contextCherryPicker.loadSavedState,
			title: 'Load State',
			arguments: [this],
		}
	} //<

}
