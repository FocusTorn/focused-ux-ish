const EXT_ID_PREFIX = 'fux-ghost-writer'

export const constants = {
	extension: {
		name: 'F-UX: Ghost Writer',
		id: EXT_ID_PREFIX,
		configKey: EXT_ID_PREFIX,
	},
	commands: {
		storeCodeFragment: `${EXT_ID_PREFIX}.storeCodeFragment`,
		insertImportStatement: `${EXT_ID_PREFIX}.insertImportStatement`,
		logSelectedVariable: `${EXT_ID_PREFIX}.logSelectedVariable`,
	},
	configKeys: {
		loggerIncludeClassName: 'consoleLogger.includeClassName',
		loggerIncludeFunctionName: 'consoleLogger.includeFunctionName',
	},
} as const