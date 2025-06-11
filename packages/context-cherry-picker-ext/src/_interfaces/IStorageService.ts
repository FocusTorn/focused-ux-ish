// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCheckboxState } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { ISavedStateItem } from './ISavedStateItem.ts'

//--------------------------------------------------------------------------------------------------------------<<

export interface IStorageService { //>
	saveState: (name: string, checkedItems: Array<{ uriString: string, checkboxState: TreeItemCheckboxState }>) => Promise<void>
	loadState: (id: string) => Promise<Array<{ uriString: string, checkboxState: TreeItemCheckboxState }> | undefined>
	loadAllSavedStates: () => Promise<ISavedStateItem[]>
	deleteState: (id: string) => Promise<void>
} //<
