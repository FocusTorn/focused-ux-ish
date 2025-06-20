import type { Uri } from 'vscode'

export interface IAutotermService {
	updateTerminalPath(uri: Uri): Promise<void>
	enterPoetryShell(uri?: Uri): Promise<void>
}