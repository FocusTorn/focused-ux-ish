import { container } from 'tsyringe'
import type { ExtensionContext } from 'vscode'
import { SharedServicesModule, CommonUtilsService } from '@focused-ux/shared-services'
import type { ICommonUtilsService } from '@focused-ux/shared-services'
import { ChronocopyService, type IChronocopyService } from '@focused-ux/chrono-copy-core'
import { ChronocopyModule } from './Chronocopy.module.js'

export function registerDependencies(context: ExtensionContext): void {
	SharedServicesModule.registerDependencies(container, context)
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.registerSingleton<IChronocopyService>('IChronocopyService', ChronocopyService)
	container.registerSingleton(ChronocopyModule)
}