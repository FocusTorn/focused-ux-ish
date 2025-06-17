// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import {
	CommonUtilsService,
	FileUtilsService,
	FrontmatterUtilsService,
	SharedServicesModule,
	WorkspaceUtilsService,
} from '@focused-ux/shared-services'
import type {
	ICommonUtilsService,
	IFileUtilsService,
	IFrontmatterUtilsService,
	IWorkspaceUtilsService,
} from '@focused-ux/shared-services'
import { NotesHubModule } from './NotesHub.module.js'

//--------------------------------------------------------------------------------------------------------------<<

export function registerNotesHubDependencies(context: ExtensionContext): void { //>
	// 1. Register low-level adapters and primitives.
	SharedServicesModule.registerDependencies(container, context)

	// 2. Register the specific high-level shared services needed by this package.
	//    (Adjust this list based on the actual dependencies of the NotesHubModule)
	container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.registerSingleton<IFileUtilsService>('IFileUtilsService', FileUtilsService)
	container.registerSingleton<IFrontmatterUtilsService>('IFrontmatterUtilsService', FrontmatterUtilsService)
	container.registerSingleton<IWorkspaceUtilsService>('IWorkspaceUtilsService', WorkspaceUtilsService)

	// 3. Register this extension's own dependencies.
	NotesHubModule.registerDependencies(container)
} //<