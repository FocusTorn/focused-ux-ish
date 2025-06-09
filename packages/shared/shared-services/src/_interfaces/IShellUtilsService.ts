// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface IShellUtilsService { //>
	executeCommand: (command: string, args?: string[], cwd?: string) => Promise<void>
	getCDCommand: (path: string | undefined, enterPoetryShell?: boolean) => Promise<string | undefined>
} //<
