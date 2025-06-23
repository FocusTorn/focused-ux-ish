// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface NotesHubConfig { //>
	projectNotesPath: string
	remoteNotesPath: string
	globalNotesPath: string
	isProjectNotesEnabled: boolean
	isRemoteNotesEnabled: boolean
	isGlobalNotesEnabled: boolean
} //<

export interface INotesHubConfigService { //>
	getNotesHubConfig(configPrefix: string): NotesHubConfig
	createDirectoryIfNeeded(dirPath: string): Promise<void>
} //<