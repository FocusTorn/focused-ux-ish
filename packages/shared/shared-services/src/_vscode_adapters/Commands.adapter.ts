// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { injectable } from 'tsyringe';

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Disposable } from 'vscode';
import { commands as VsCodeCommands } from 'vscode';

//= IMPLEMENTATION TYPES ======================================================================================
import type { ICommands } from '../_vscode_abstractions/ICommands.ts'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class CommandsAdapter implements ICommands {
	registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
		return VsCodeCommands.registerCommand(command, callback, thisArg);
	}
	executeCommand<T = unknown>(command: string, ...rest: any[]): Thenable<T | undefined> {
		 return VsCodeCommands.executeCommand<T>(command, ...rest);
	}
	getCommands(filterInternal?: boolean): Thenable<string[]> {
		return VsCodeCommands.getCommands(filterInternal);
	}
}