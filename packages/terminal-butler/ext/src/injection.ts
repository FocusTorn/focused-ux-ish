import { container } from 'tsyringe'
import type { ExtensionContext } from 'vscode'
import { SharedServicesModule, CommonUtilsService, ShellUtilsService } from '@focused-ux/shared-services'
import type { ICommonUtilsService, IShellUtilsService } from '@focused-ux/shared-services'
import { TerminalButlerService, type ITerminalButlerService } from '@focused-ux/terminal-butler-core'
import { TerminalButlerModule } from './TerminalButler.module.js'

export function registerDependencies(context: ExtensionContext): void {
	SharedServicesModule.registerDependencies(container, context)
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.registerSingleton<IShellUtilsService>('IShellUtilsService', ShellUtilsService)
	container.registerSingleton<ITerminalButlerService>('ITerminalButlerService', TerminalButlerService)
	container.registerSingleton(TerminalButlerModule)
}
