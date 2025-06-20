import { inject, injectable } from 'tsyringe'
import type { ExtensionContext } from 'vscode'
import type { IStorageService } from '@focused-ux/ghost-writer-core'

@injectable()
export class StorageAdapter implements IStorageService {
	constructor(@inject('ExtensionContext') private readonly context: ExtensionContext) {}

	async update(key: string, value: any): Promise<void> {
		await this.context.globalState.update(key, value)
	}

	async get<T>(key: string): Promise<T | undefined> {
		return this.context.globalState.get<T>(key)
	}
}