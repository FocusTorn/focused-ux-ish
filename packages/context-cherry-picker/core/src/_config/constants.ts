const EXT_ID_PREFIX = 'ccp'

export const constants = {
	extension: {
		name: 'F-UX: Context Cherry Picker',
		nickName: 'CCP',
		id: `${EXT_ID_PREFIX}`,
		configKey: `${EXT_ID_PREFIX}`,
	},
	commands: {
		contextCherryPicker: {
			saveCheckedState: `${EXT_ID_PREFIX}.saveCheckedState`,
			refreshExplorer: `${EXT_ID_PREFIX}.refreshExplorer`,
			deleteSavedState: `${EXT_ID_PREFIX}.deleteSavedState`,
			loadSavedState: `${EXT_ID_PREFIX}.loadSavedState`,
			clearAllCheckedInExplorer: `${EXT_ID_PREFIX}.clearAllCheckedInExplorer`,
			copyContextOfCheckedItems: `${EXT_ID_PREFIX}.copyContextOfCheckedItems`,
		},
	},
	views: {
		contextCherryPicker: {
			activityBar: `${EXT_ID_PREFIX}.activityBar`,
			explorer: `${EXT_ID_PREFIX}.explorerView`,
			savedStates: `${EXT_ID_PREFIX}.savedStatesView`,
			quickSettings: `${EXT_ID_PREFIX}.quickSettingsView`,
		},
	},
	configKeys: {
		CCP_IGNORE_PATTERNS: `${EXT_ID_PREFIX}.ignoreGlobs`,
		CCP_PROJECT_TREE_ALWAYS_SHOW_GLOBS: `${EXT_ID_PREFIX}.projectTreeDisplay.alwaysShowGlobs`,
		CCP_PROJECT_TREE_ALWAYS_HIDE_GLOBS: `${EXT_ID_PREFIX}.projectTreeDisplay.alwaysHideGlobs`,
		CCP_PROJECT_TREE_SHOW_IF_SELECTED_GLOBS: `${EXT_ID_PREFIX}.projectTreeDisplay.showIfSelectedGlobs`,
		CCP_CONTEXT_EXPLORER_IGNORE_GLOBS: `${EXT_ID_PREFIX}.directoryContentDisplay.hideDirAndContentsGlobs`,
		CCP_CONTEXT_EXPLORER_HIDE_CHILDREN_GLOBS: `${EXT_ID_PREFIX}.directoryContentDisplay.showDirHideContentsGlobs`,
		GOOGLE_API_KEY: `${EXT_ID_PREFIX}.google.apiKey`,
	},
	storageKeys: {
		SAVED_STATES_KEY: `${EXT_ID_PREFIX}.savedStates`, // For Memento or globalState
	},
	projectConfig: {
		fileName: '.FocusedUX',
		keys: {
			contextCherryPicker: 'ContextCherryPicker',
			file_groups: 'file_groups',
			initially_visible: 'initially_visible',
			items: 'items',
			ignore: 'ignore',
			project_tree: 'project_tree',
			always_show: 'always_show',
			always_hide: 'always_hide',
			show_if_selected: 'show_if_selected',
			context_explorer: 'context_explorer',
			hide_children: 'hide_children',
			settings: 'settings',
			message_show_seconds: 'message_show_seconds',
			default_project_structure: 'default_project_structure',
		},
	},
	quickSettings: {
		projectStructureContents: {
			id: `${EXT_ID_PREFIX}.quickSetting.projectStructureContents`, // 'none', 'selected', 'all'
		},
		fileGroupVisibility: {
			idPrefix: `${EXT_ID_PREFIX}.quickSetting.fileGroupVisibility`, // e.g., ccp.quickSetting.fileGroupVisibility.build
		},
	},
} as const
