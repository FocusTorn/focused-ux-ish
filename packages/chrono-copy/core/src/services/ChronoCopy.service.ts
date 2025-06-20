import { inject, injectable } from 'tsyringe'
import type { Uri } from 'vscode'
import type { IWindow, ICommonUtilsService } from '@focused-ux/shared-services'
import type { IChronocopyService } from '../_interfaces/IChronoCopyService.js'
import type * as nodePath from 'node:path'
import type { access as fspAccessType, copyFile as fspCopyFileType } from 'node:fs/promises'

@injectable()
export class ChronocopyService implements IChronocopyService {
	constructor(
		@inject('IWindow') private readonly window: IWindow,
		@inject('ICommonUtilsService') private readonly commonUtils: ICommonUtilsService,
		@inject('iPathBasename') private readonly pathBasename: typeof nodePath.basename,
		@inject('iPathDirname') private readonly pathDirname: typeof nodePath.dirname,
		@inject('iPathJoin') private readonly pathJoin: typeof nodePath.join,
		@inject('iFspAccess') private readonly fspAccess: typeof fspAccessType,
		@inject('iFspCopyFile') private readonly fspCopyFile: typeof fspCopyFileType,
	) {}

	public async createBackup(fileUri: Uri): Promise<void> {
		try {
			const sourcePath = fileUri.fsPath
			const baseName = this.pathBasename(sourcePath)
			const directory = this.pathDirname(sourcePath)
			let backupNumber = 1
			let backupFileName = `${baseName}.bak`
			let destinationPath = this.pathJoin(directory, backupFileName)

			while (true) {
				try {
					await this.fspAccess(destinationPath)
					backupNumber++
					backupFileName = `${baseName}.bak${backupNumber}`
					destinationPath = this.pathJoin(directory, backupFileName)
				}
				catch {
					// File doesn't exist, we can use this path
					break
				}
			}

			await this.fspCopyFile(sourcePath, destinationPath)
			this.window.showInformationMessage(`Backup created: ${backupFileName}`)
		}
		catch (error) {
			this.commonUtils.errMsg(`Error creating backup for ${fileUri.fsPath}`, error)
		}
	}
}