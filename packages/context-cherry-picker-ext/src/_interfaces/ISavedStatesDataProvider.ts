// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Event, TreeDataProvider } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { SavedStateItem } from '../models/SavedStateItem.ts'

//--------------------------------------------------------------------------------------------------------------<<

export interface ISavedStatesDataProvider extends TreeDataProvider<SavedStateItem> { //>
	onDidChangeTreeData: Event<SavedStateItem | undefined | null | void>
	refresh: () => void
} //<
