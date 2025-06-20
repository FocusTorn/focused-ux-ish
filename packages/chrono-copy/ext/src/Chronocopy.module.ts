import { inject, singleton } from 'tsyringe'
import type { IWindow } from '@focused-ux/shared-services'
import type { IChronocopyService } from '@focused-ux/chrono-copy-core'
import type { Uri } from 'vscode'

@singleton()
export class ChronocopyModule {
	constructor(
		@inject('IChronocopyService') private readonly service: IChronocopyService,
		@inject('IWindow') private readonly window: IWindow,
	) {}

	public async handleCreateBackup(uri?: Uri): Promise<void> {
		const finalUri = uri || this.window.activeTextEditor?.document.uri
		if (!finalUri) {
			this.window.showErrorMessage('No file selected or open to back up.')
			return
		}
		await this.service.createBackup(finalUri)
	}
}