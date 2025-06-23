// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubItem } from './INotesHubItem.js'
import type { INotesHubDataProvider } from './INotesHubDataProvider.js'
import type { NotesHubConfig } from './INotesHubConfigService.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface INotesHubService {
	// Core Note Operations
	openNote: (noteItem: INotesHubItem) => Promise<void>
	renameItem: (item: INotesHubItem) => Promise<void>
	addFrontmatter: (noteItem: INotesHubItem) => Promise<void>
	openNotePreview: (noteItem: INotesHubItem) => Promise<void>
	deleteItem: (item: INotesHubItem) => Promise<void>

	// Clipboard Operations
	copyItem: (item: INotesHubItem) => Promise<void>
	cutItem: (item: INotesHubItem) => Promise<void>
	pasteItem: (targetFolderItem: INotesHubItem) => Promise<void>

	// Creation Operations
	newNoteInFolder: (targetFolderItem: INotesHubItem) => Promise<void>
	newFolderInFolder: (targetFolderItem: INotesHubItem) => Promise<void>
	newNoteAtRoot: (providerName: 'project' | 'remote' | 'global') => Promise<void>
	newFolderAtRoot: (providerName: 'project' | 'remote' | 'global') => Promise<void>

	// Provider and View Management
	refreshProviders: (providersToRefresh?: 'project' | 'remote' | 'global' | 'all' | Array<'project' | 'remote' | 'global'>) => void
	getProviderForNote: (item: INotesHubItem) => Promise<INotesHubDataProvider | undefined>
	revealNotesHubItem: (provider: INotesHubDataProvider, item: INotesHubItem, select?: boolean) => Promise<void>

	// Configuration
	getNotesHubConfig: () => NotesHubConfig

	// Initialization (called by NotesHubModule)
	initializeNotesHub: (configPrefix: string, commandPrefix: string) => Promise<void>
	dispose: () => void
}
