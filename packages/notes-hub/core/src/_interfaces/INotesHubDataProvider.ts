// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Event, TreeDataProvider, TreeDragAndDropController, Uri, TreeView } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubItem } from './INotesHubItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubDataProvider extends TreeDataProvider<INotesHubItem>, TreeDragAndDropController<INotesHubItem> {
	onDidChangeTreeData: Event<INotesHubItem | undefined | null | void>
	readonly notesDir: string
	readonly providerName: 'project' | 'remote' | 'global'
	treeView?: TreeView<INotesHubItem>

	refresh: () => void
	getNotesHubItem: (uri: Uri) => Promise<INotesHubItem | undefined>
	initializeTreeView: (viewId: string) => TreeView<INotesHubItem>
}