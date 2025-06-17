// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Event, TreeDataProvider, TreeItemCheckboxState, Uri } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileExplorerItem } from '../models/FileExplorerItem.ts'
import type { FileGroupsConfig } from './ccp.types.ts'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileExplorerDataProvider extends TreeDataProvider<FileExplorerItem> { //>
	onDidChangeTreeData: Event<FileExplorerItem | undefined | null | void>

	refresh: () => Promise<void>
	updateCheckboxState: (uri: Uri, state: TreeItemCheckboxState) => void
	getCheckboxState: (uri: Uri) => TreeItemCheckboxState | undefined
	getAllCheckedItems: () => Uri[]
	loadCheckedState: (items: Array<{ uriString: string, checkboxState: number }>) => void
	clearAllCheckboxes: () => void

	getCoreScanIgnoreGlobs: () => string[]
	
	getProjectTreeAlwaysShowGlobs: () => string[]
	getProjectTreeAlwaysHideGlobs: () => string[]
	getProjectTreeShowIfSelectedGlobs: () => string[]

	getContextExplorerIgnoreGlobs: () => string[]
	getContextExplorerHideChildrenGlobs: () => string[]
	
	getFileGroupsConfig: () => FileGroupsConfig | undefined

	showStatusMessage: (message: string, duration: number) => void

} //<
