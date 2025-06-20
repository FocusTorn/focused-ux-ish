import { container } from 'tsyringe'
import type { ExtensionContext } from 'vscode'
import { SharedServicesModule, CommonUtilsService, ShellUtilsService } from '@focused-ux/shared-services'
import type { ICommonUtilsService, IShellUtilsService } from '@focused-ux/shared-services'
import { AutotermService, type IAutotermService } from '@focused-ux/autoterm-core'
import { AutotermModule } from './Autoterm.module.js'

export function registerDependencies(context: ExtensionContext): void {
	SharedServicesModule.registerDependencies(container, context)
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.registerSingleton<IShellUtilsService>('IShellUtilsService', ShellUtilsService)
	container.registerSingleton<IAutotermService>('IAutotermService', AutotermService)
	container.registerSingleton(AutotermModule)
}