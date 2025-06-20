import { inject, injectable } from 'tsyringe'
import type { Uri } from 'vscode'
import type { IWindow, ICommonUtilsService, IShellUtilsService } from '@focused-ux/shared-services'
import type { IAutotermService } from '../_interfaces/IAutotermService.js'
import type * as nodePath from 'node:path'
import type { stat as fspStatType } from 'node:fs/promises'

@injectable()
export class AutotermService implements IAutotermService {
	constructor(
		@inject('IWindow') private readonly window: IWindow,
		@inject('ICommonUtilsService') private readonly commonUtils: ICommonUtilsService,
		@inject('IShellUtilsService') private readonly shellUtils: IShellUtilsService,
		@inject('iFspStat') private readonly fspStat: typeof fspStatType,
		@inject('iPathDirname') private readonly pathDirname: typeof nodePath.dirname,
	) {}

	public async updateTerminalPath(uri: Uri): Promise<void> {
		try {
			const stats = await this.fspStat(uri.fsPath)
			const pathToSend = stats.isDirectory() ? uri.fsPath : this.pathDirname(uri.fsPath)
			const cdCommand = await this.shellUtils.getCDCommand(pathToSend)

			if (cdCommand) {
				const terminal = this.window.activeTerminal || this.window.createTerminal()
				terminal.sendText(cdCommand)
				terminal.show()
			} else {
				this.window.showErrorMessage('Could not determine command to change directory.')
			}
		}
		catch (error: any) {
			this.commonUtils.errMsg(`Error getting path information for ${uri.fsPath}`, error)
		}
	}

	public async enterPoetryShell(uri?: Uri): Promise<void> {
		try {
			const terminal = this.window.createTerminal('Poetry Shell')
			let pathToSend: string | undefined

			if (uri) {
				const stats = await this.fspStat(uri.fsPath)
				pathToSend = stats.isDirectory() ? uri.fsPath : this.pathDirname(uri.fsPath)
			}

			const cdCommand = await this.shellUtils.getCDCommand(pathToSend, true)

			if (cdCommand) {
				terminal.sendText(cdCommand)
			} else {
				// If no path, just try to enter poetry shell in current dir
				terminal.sendText('poetry shell')
			}
			terminal.show()
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to enter Poetry shell.', error)
		}
	}
}