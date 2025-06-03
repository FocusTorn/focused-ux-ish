// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export const dynamiconsConstants = { //> // Renamed from dynamiconsCoreConstants
	featureName: 'Dynamicons', // General name for the feature
	packageNameCore: '@focused-ui/dynamicons-core',
	packageNameExt: 'focused-ui-dynamicons', // Matches the 'name' in ext/package.json

	configPrefix: 'dynamicons',

	commands: {
		activateIconTheme: 'dynamicons.activateIconTheme',
		assignIcon: 'dynamicons.assignIcon',
		revertIcon: 'dynamicons.revertIcon',
		toggleExplorerArrows: 'dynamicons.toggleExplorerArrows',
		showUserFileIconAssignments: 'dynamicons.showUserFileIconAssignments',
		showUserFolderIconAssignments: 'dynamicons.showUserFolderIconAssignments',
		refreshIconTheme: 'dynamicons.refreshIconTheme',
	},

	// From package.json contributes.iconThemes[0].id
	iconThemeId: 'dynamicons-theme',

	// From package.json configuration
	configKeys: {
		userIconsDirectory: 'userIconsDirectory', // actual key is configPrefix + this
		customIconMappings: 'customIconMappings',
		hideExplorerArrows: 'hideExplorerArrows',
		baseThemeFileName: 'baseThemeFileName', // Name of the base template
		generatedThemeFileName: 'generatedThemeFileName', // Name for the dynamically generated theme file
	},

	associationKeyPrefixes: {
		file: 'file:',
		folder: 'folder:',
		language: 'language:',
	},

	defaults: {
		userIconDefinitionPrefix: '_user_',
		iconThemeNamePrefix: '_dynamiconsTheme_',
		openFolderIconSuffix: '-open',
		// Literal default filenames for use in config.get() and scripts
		baseThemeFilenameDefault: 'base.theme.json',
		generatedThemeFilenameDefault: 'dynamicons.theme.json',
	},

	assets: {
		themesPath: 'assets/themes', // Relative to extension's root
	},
} as const