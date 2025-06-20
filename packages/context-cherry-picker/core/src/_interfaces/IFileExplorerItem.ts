// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCheckboxState, Uri, TreeItemLabel, MarkdownString } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileExplorerItem { //>
	uri: Uri
	label: string | TreeItemLabel | undefined
	tooltip?: string | MarkdownString | undefined
	type: 'file' | 'directory'
	checkboxState?: TreeItemCheckboxState
} //<
