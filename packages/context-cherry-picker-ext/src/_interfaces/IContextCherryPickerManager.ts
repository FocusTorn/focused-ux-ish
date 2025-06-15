// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { SavedStateItem } from '../models/SavedStateItem.ts'

//--------------------------------------------------------------------------------------------------------------<<

export interface IContextCherryPickerManager { //>
	initializeViews: (explorerViewId: string, savedStatesViewId: string, quickSettingsViewId: string) => Promise<void>
	getCheckedExplorerItems: () => Uri[]
	saveCurrentCheckedState: () => Promise<void>
	copyCheckedFilePaths: () => Promise<void>
	refreshExplorerView: () => Promise<void>
	deleteSavedState: (stateItem: SavedStateItem) => Promise<void>
	loadSavedStateIntoExplorer: (stateItem: SavedStateItem) => Promise<void>
	clearAllCheckedInExplorer: () => Promise<void>
	copyContextOfCheckedItems: () => Promise<void>
	getQuickSettingState: (settingId: string) => Promise<any>

	showStatusMessage: (type: 'vsc' | 'drop' | 'desc' | 'replace', message: string, duration?: number,) => void

} //<
