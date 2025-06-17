export const notesHubConstants = {
	// These are relative keys. The full key is built by the service using a prefix.
	configKeys: {
		ENABLE_PROJECT_NOTES: `enableProjectNotes`,
		ENABLE_REMOTE_NOTES: `enableRemoteNotes`,
		ENABLE_GLOBAL_NOTES: `enableGlobalNotes`,
		PROJECT_PATH: `projectNotesPath`,
		REMOTE_PATH: `remoteNotesPath`,
		GLOBAL_PATH: `globalNotesPath`,
	},
	// These are context/storage keys that need a prefix.
	contextKeys: {
		CAN_PASTE: `canPaste`,
	},
	storageKeys: {
		OPERATION: `operation`,
	},
    // These are command suffixes. The prefix is added by the ext module.
    commands: {
        openNote: 'openNote',
    }
} as const