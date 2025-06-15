export const dynamiconsConstants = { //>
	featureName: 'Dynamicons',
	packageNameCore: '@focused-ux/dynamicons-core',
	packageNameExt: 'fux-dynamicons',
	configPrefix: 'dynamicons',
	iconThemeId: 'dynamicons-theme',
	commands: {
		activateIconTheme: 'dynamicons.activateIconTheme',
		assignIcon: 'dynamicons.assignIcon',
		revertIcon: 'dynamicons.revertIcon',
		toggleExplorerArrows: 'dynamicons.toggleExplorerArrows',
		showUserFileIconAssignments: 'dynamicons.showUserFileIconAssignments',
		showUserFolderIconAssignments: 'dynamicons.showUserFolderIconAssignments',
		refreshIconTheme: 'dynamicons.refreshIconTheme',
	},
	configKeys: {
		userIconsDirectory: 'userIconsDirectory',
		customIconMappings: 'customIconMappings',
		hideExplorerArrows: 'hideExplorerArrows',
		baseThemeFileName: 'baseThemeFileName',
		generatedThemeFileName: 'generatedThemeFileName',
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

		baseThemeFilenameDefault: 'base.theme.json',
		generatedThemeFilenameDefault: 'dynamicons.theme.json',
	},
	assets: {
		themesPath: 'assets/themes',
	},
} as const
