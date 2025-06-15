// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import { SharedServicesModule } from '@focused-ux/shared-services'
import { ContextCherryPickerModule } from './ContextCherryPicker.module.js'

//--------------------------------------------------------------------------------------------------------------<<

export function registerCCP_Dependencies(context: ExtensionContext): void {
	SharedServicesModule.registerDependencies(container, context)

	ContextCherryPickerModule.registerDependencies(container)
}
