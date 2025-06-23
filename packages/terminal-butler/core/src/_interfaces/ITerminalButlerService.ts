import type { Uri } from 'vscode'

export interface ITerminalButlerService {
	updateTerminalPath: (uri: Uri) => Promise<void>
	enterPoetryShell: (uri?: Uri) => Promise<void>
}
