// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container, Lifecycle } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import type { IIconActionsService, IIconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import { IconActionsService, IconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import { SharedServicesModule } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

export function registerDynamiconsDependencies(context: ExtensionContext): void { //>
	// Register all common dependencies (services, adapters, node/vscode primitives)
	// This is now an idempotent operation.
	SharedServicesModule.registerDependencies(container, context)

	// Register Dynamicons-specific services
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