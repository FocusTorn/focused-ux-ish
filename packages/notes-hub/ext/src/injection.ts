// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import { SharedServicesModule } from '@focused-ux/shared-services'
import { NotesHubModule } from './NotesHub.module.js'

//--------------------------------------------------------------------------------------------------------------<<

export function registerNotesHubDependencies(context: ExtensionContext): void {
	SharedServicesModule.registerDependencies(container, context)
	NotesHubModule.registerDependencies(container)
}