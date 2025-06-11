// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { injectable } from 'tsyringe';

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Clipboard, UIKind } from 'vscode';
import { env as VsCodeEnv } from 'vscode'; 

//= IMPLEMENTATION TYPES ======================================================================================
import type { IEnv } from '../_vscode_abstractions/IEnv.ts'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class EnvAdapter implements IEnv {
	 get appName(): string { return VsCodeEnv.appName; }
	get appRoot(): string { return VsCodeEnv.appRoot; }
	get language(): string { return VsCodeEnv.language; }
	get clipboard(): Clipboard { return VsCodeEnv.clipboard; }
	get machineId(): string { return VsCodeEnv.machineId; }
	get sessionId(): string { return VsCodeEnv.sessionId; }
	get uiKind(): UIKind { return VsCodeEnv.uiKind; }
}