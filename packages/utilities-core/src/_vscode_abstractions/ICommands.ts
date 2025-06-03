// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Disposable } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface ICommands { //>
	registerCommand: (command: string, callback: (...args: any[]) => any, thisArg?: any) => Disposable
	executeCommand: <T = unknown>(command: string, ...rest: any[]) => Thenable<T | undefined>
	getCommands: (filterInternal?: boolean) => Thenable<string[]>
} //<
