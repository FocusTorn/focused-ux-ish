// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import {
	CommonUtilsService,
	FileUtilsService,
	SharedServicesModule,
	TreeFormatterService,
	TokenizerService,
} from '@focused-ux/shared-services'
import type {
	ICommonUtilsService,
	IFileUtilsService,
	ITreeFormatterService,
	ITokenizerService,
} from '@focused-ux/shared-services'
import { ContextCherryPickerModule } from './ContextCherryPicker.module.js'

//--------------------------------------------------------------------------------------------------------------<<

export function registerCCP_Dependencies(context: ExtensionContext): void { //>
	// 1. Register all the low-level adapters and primitives from the shared module.
	SharedServicesModule.registerDependencies(container, context)

	// 2. Register the specific high-level shared services that this package needs.
	//    By doing this here, we allow the bundler to tree-shake unused services.
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.registerSingleton<IFileUtilsService>('IFileUtilsService', FileUtilsService)
	container.registerSingleton<ITokenizerService>('ITokenizerService', TokenizerService)
	container.registerSingleton<ITreeFormatterService>('ITreeFormatterService', TreeFormatterService)

	// 3. Register this extension's own dependencies.
	ContextCherryPickerModule.registerDependencies(container)
} //<
