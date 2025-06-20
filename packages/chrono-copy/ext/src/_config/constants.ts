const EXT_ID_PREFIX = 'fux-chronocopy'

export const constants = {
	extension: {
		name: 'F-UX: Chronocopy',
		id: EXT_ID_PREFIX,
	},
	commands: {
		createBackup: `${EXT_ID_PREFIX}.createBackup`,
	},
} as const
