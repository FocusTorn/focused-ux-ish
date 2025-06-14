// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemLabel } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface ISavedStateItem { //>
	id: string
	label?: string | TreeItemLabel | undefined
	timestamp: number
	checkedItems: Array<{ uriString: string, checkboxState: number }>
} //<
