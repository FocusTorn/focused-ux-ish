const EXT_ID_PREFIX = 'fux-terminal-butler'

export const constants = {
	extension: {
		name: 'F-UX: Terminal Butler',
		id: EXT_ID_PREFIX,
	},
	commands: {
		updateTerminalPath: `${EXT_ID_PREFIX}.updateTerminalPath`,
		enterPoetryShell: `${EXT_ID_PREFIX}.enterPoetryShell`,
	},
} as const
