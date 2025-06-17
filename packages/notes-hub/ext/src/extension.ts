// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import 'reflect-metadata'
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import { registerNotesHubDependencies } from './injection.js'
import { NotesHubModule } from './NotesHub.module.js'
import { constants } from './_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

let notesHubModuleInstance: NotesHubModule | undefined

export async function activate(context: ExtensionContext): Promise<void> {
	console.log(`[${constants.extension.name}] Activating...`)

	registerNotesHubDependencies(context)

	try {
		notesHubModuleInstance = new NotesHubModule()
		context.subscriptions.push(...notesHubModuleInstance.registerCommands(context))
		await notesHubModuleInstance.initializeModule()
		context.subscriptions.push({ dispose: () => notesHubModuleInstance?.dispose() })
	}
	catch (error) {
		console.error(`[${constants.extension.name}] Error during NotesHubModule initialization:`, error)
	}

	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {
	console.log(`[${constants.extension.name}] Deactivated.`)
}