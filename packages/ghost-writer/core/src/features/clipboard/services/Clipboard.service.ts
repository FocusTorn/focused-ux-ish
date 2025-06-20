import { inject, injectable } from 'tsyringe'
import type { IStorageService } from '../../../_interfaces/IStorageService.js'
import { ghostWriterConstants } from '../../../_config/constants.js'
import type { IClipboardService, StoredFragment } from '../_interfaces/IClipboardService.js'

@injectable()
export class ClipboardService implements IClipboardService {
	constructor(@inject('IStorageService') private readonly storageService: IStorageService) {}

	public async store(fragment: StoredFragment): Promise<void> {
		await this.storageService.update(ghostWriterConstants.storageKeys.CLIPBOARD, fragment)
	}

	public async retrieve(): Promise<StoredFragment | undefined> {
		return this.storageService.get<StoredFragment>(ghostWriterConstants.storageKeys.CLIPBOARD)
	}

	public async clear(): Promise<void> {
		await this.storageService.update(ghostWriterConstants.storageKeys.CLIPBOARD, undefined)
	}
}