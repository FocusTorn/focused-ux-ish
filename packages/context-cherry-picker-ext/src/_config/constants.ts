// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

const EXT_ID_PREFIX = 'ccpSatellite'

export const constants = {
	extension: {
		name: 'F-UX: Context Cherry Picker',
		nickName: 'CCP Satellite',
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
		CCP_PROJECT_TREE_ALWAYS_SHOW_GLOBS: `${EXT_ID_PREFIX}.projectTree.alwaysShowGlobs`,
		CCP_PROJECT_TREE_ALWAYS_HIDE_GLOBS: `${EXT_ID_PREFIX}.projectTree.alwaysHideGlobs`,
		CCP_PROJECT_TREE_SHOW_IF_SELECTED_GLOBS: `${EXT_ID_PREFIX}.projectTree.showIfSelectedGlobs`,
		CCP_CONTEXT_EXPLORER_IGNORE_GLOBS: `${EXT_ID_PREFIX}.contextExplorer.ignoreGlobs`,
		CCP_CONTEXT_EXPLORER_HIDE_CHILDREN_GLOBS: `${EXT_ID_PREFIX}.contextExplorer.hideChildrenGlobs`,
		GOOGLE_API_KEY: `${EXT_ID_PREFIX}.google.apiKey`,
	},
	storageKeys: {
		SAVED_STATES_KEY: `${EXT_ID_PREFIX}.savedStates`, // For Memento or globalState
	},
	projectConfig: {
        
		fileName: '.FocusedUX',
        
		keys: {
			contextCherryPicker: 'ContextCherryPicker',
			ignore: 'ignore',
			project_tree: 'project_tree',
			always_show: 'always_show',
			always_hide: 'always_hide',
			show_if_selected: 'show_if_selected',
			context_explorer: 'context_explorer',
			// 'ignore' is also a sub-key of context_explorer for UI-only ignore
			hide_children: 'hide_children',
		},
	},
	quickSettings: {
		projectStructureContents: {
			id: `${EXT_ID_PREFIX}.quickSetting.projectStructureContents`,
			// Options would be 'none', 'selected', 'all'
		},
	},
} as const