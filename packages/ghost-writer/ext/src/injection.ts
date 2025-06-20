import { container } from 'tsyringe'
import type { ExtensionContext } from 'vscode'
import { SharedServicesModule, PathUtilsService, CommonUtilsService } from '@focused-ux/shared-services'
import type { IPathUtilsService, ICommonUtilsService } from '@focused-ux/shared-services'
import {
	ClipboardService,
	ImportGeneratorService,
	ConsoleLoggerService,
	type IClipboardService,
	type IImportGeneratorService,
	type IConsoleLoggerService,
	type IStorageService,
} from '@focused-ux/ghost-writer-core'
import { StorageAdapter } from './services/Storage.adapter.js'
import { GhostWriterModule } from './GhostWriter.module.js'

export function registerDependencies(context: ExtensionContext): void {
	// 1. Register shared services and primitives
	SharedServicesModule.registerDependencies(container, context)
	container.registerSingleton<IPathUtilsService>('IPathUtilsService', PathUtilsService)
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)

	// 2. Register this extension's services and adapters
	container.registerSingleton<IStorageService>('IStorageService', StorageAdapter)
	container.registerSingleton<IClipboardService>('IClipboardService', ClipboardService)
	container.registerSingleton<IImportGeneratorService>('IImportGeneratorService', ImportGeneratorService)
	container.registerSingleton<IConsoleLoggerService>('IConsoleLoggerService', ConsoleLoggerService)

    // 3. Register the module itself
    container.registerSingleton(GhostWriterModule)
}