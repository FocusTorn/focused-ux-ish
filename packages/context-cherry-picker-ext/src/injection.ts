// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import { SharedServicesModule } from '@focused-ux/shared-services'
// CCP Module for its dependencies
import { ContextCherryPickerModule } from './ContextCherryPicker.module.js'

//--------------------------------------------------------------------------------------------------------------<<

export function registerCCP_Dependencies(context: ExtensionContext): void { //>
	// Register all common dependencies (services, adapters, node/vscode primitives)
	// This is now an idempotent operation.
	SharedServicesModule.registerDependencies(container, context)

	// Register CCP-specific dependencies
	ContextCherryPickerModule.registerDependencies(container)
} //<