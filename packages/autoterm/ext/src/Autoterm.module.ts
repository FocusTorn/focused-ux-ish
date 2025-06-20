import { inject, singleton } from 'tsyringe'
import type { IWindow } from '@focused-ux/shared-services'
import type { IAutotermService } from '@focused-ux/autoterm-core'
import type { Uri } from 'vscode'

@singleton()
export class AutotermModule {
	constructor(
		@inject('IAutotermService') private readonly service: IAutotermService,
		@inject('IWindow') private readonly window: IWindow,
	) {}

	public async handleUpdateTerminalPath(uri?: Uri): Promise<void> {
		const finalUri = uri || this.window.activeTextEditor?.document.uri
		if (!finalUri) {
			this.window.showErrorMessage('No file or folder context to update terminal path.')
			return
		}
		await this.service.updateTerminalPath(finalUri)
	}

	public async handleEnterPoetryShell(uri?: Uri): Promise<void> {
		const finalUri = uri || this.window.activeTextEditor?.document.uri
		// The service can handle an undefined URI, so no need for an error message here.
		await this.service.enterPoetryShell(finalUri)
	}
}