// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container, Lifecycle } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import type { IIconActionsService, IIconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import { IconActionsService, IconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import {
	CommonUtilsService,
	FileUtilsService,
	PathUtilsService,
	QuickPickUtilsService,
	SharedServicesModule,
} from '@focused-ux/shared-services'
import type {
	ICommonUtilsService,
	IFileUtilsService,
	IPathUtilsService,
    IQuickPickUtilsService,
} from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

export function registerDynamiconsDependencies(context: ExtensionContext): void { //>
	// 1. Register low-level adapters and primitives.
	SharedServicesModule.registerDependencies(container, context)

	// 2. Register the specific high-level shared services needed by this package.
	//    (Adjust this list based on the actual dependencies of the core services)
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.registerSingleton<IFileUtilsService>('IFileUtilsService', FileUtilsService)
	container.registerSingleton<IPathUtilsService>('IPathUtilsService', PathUtilsService)
	container.registerSingleton<IQuickPickUtilsService>('IQuickPickUtilsService', QuickPickUtilsService)

	// 3. Register Dynamicons-specific services.
	container.register<IIconActionsService>(
		'IIconActionsService',
		{ useClass: IconActionsService },
		{ lifecycle: Lifecycle.Singleton },
	)
	container.register<IIconThemeGeneratorService>(
		'IIconThemeGeneratorService',
		{ useClass: IconThemeGeneratorService },
		{ lifecycle: Lifecycle.Singleton },
	)
} //<
