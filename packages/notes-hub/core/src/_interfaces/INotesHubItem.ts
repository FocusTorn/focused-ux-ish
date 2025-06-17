// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemLabel, Uri, ThemeIcon, ThemeColor, TreeItemCollapsibleState, Command, MarkdownString } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubItem {
	// Core TreeItem properties
	label: TreeItemLabel | string
	id?: string
	resourceUri?: Uri
	tooltip?: string | MarkdownString | undefined
	description?: string | boolean | undefined
	iconPath?: string | Uri | ThemeIcon | { light: string | Uri, dark: string | Uri }
	collapsibleState?: TreeItemCollapsibleState
	contextValue?: string
	command?: Command

	// NotesHub specific properties
	fileName: string
	filePath: string
	isDirectory: boolean
	parentUri?: Uri
	frontmatter?: { [key: string]: string }
	color?: ThemeColor | string
}