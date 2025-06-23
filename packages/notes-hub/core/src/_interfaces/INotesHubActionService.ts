// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubItem } from './INotesHubItem.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubActionService { //>
	openNote: (noteItem: INotesHubItem) => Promise<void>
	renameItem: (item: INotesHubItem) => Promise<void>
	addFrontmatter: (noteItem: INotesHubItem) => Promise<void>
	openNotePreview: (noteItem: INotesHubItem) => Promise<void>
	deleteItem: (item: INotesHubItem) => Promise<void>
	copyItem: (item: INotesHubItem) => Promise<void>
	cutItem: (item: INotesHubItem) => Promise<void>
	pasteItem: (targetFolderItem: INotesHubItem) => Promise<void>
	newNoteInFolder: (targetFolderItem: INotesHubItem) => Promise<void>
	newFolderInFolder: (targetFolderItem: INotesHubItem) => Promise<void>
	newNoteAtRoot: (providerName: 'project' | 'remote' | 'global') => Promise<void>
	newFolderAtRoot: (providerName: 'project' | 'remote' | 'global') => Promise<void>
} //<
