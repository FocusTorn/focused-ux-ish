import type { Uri } from 'vscode'

export interface IChronocopyService {
	createBackup(fileUri: Uri): Promise<void>
}