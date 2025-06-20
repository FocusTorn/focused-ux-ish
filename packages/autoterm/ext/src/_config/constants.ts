const EXT_ID_PREFIX = 'fux-autoterm'

export const constants = {
	extension: {
		name: 'F-UX: Autoterm',
		id: EXT_ID_PREFIX,
	},
	commands: {
		updateTerminalPath: `${EXT_ID_PREFIX}.updateTerminalPath`,
		enterPoetryShell: `${EXT_ID_PREFIX}.enterPoetryShell`,
	},
} as const