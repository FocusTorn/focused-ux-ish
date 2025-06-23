import type { IWindow } from '@focused-ux/shared-services'
import type { ITerminalButlerService } from '@focused-ux/terminal-butler-core'
import { inject, singleton } from 'tsyringe'
import type { Uri } from 'vscode'

@singleton()
export class TerminalButlerModule {

	constructor(
		@inject('ITerminalButlerService') private readonly service: ITerminalButlerService,
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
