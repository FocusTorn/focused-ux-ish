// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import { BaseNotesDataProvider } from './BaseNotesDataProvider.js'

//= INJECTED TYPES ============================================================================================
import type { ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, ICommands } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class ProjectNotesDataProvider extends BaseNotesDataProvider {

	constructor(
		@inject('ExtensionContext') context: ExtensionContext,
		@inject('IWindow') window: IWindow,
		@inject('IWorkspace') workspace: IWorkspace,
		@inject('ICommands') commands: ICommands,
		@inject('ICommonUtilsService') commonUtils: ICommonUtilsService,
		@inject('IFrontmatterUtilsService') frontmatterUtils: IFrontmatterUtilsService,
		@inject('IPathUtilsService') pathUtils: IPathUtilsService,
		@inject('projectNotesDir') notesDir: string,
		@inject('openNoteCommandId') openNoteCommandId: string,
	) {
		super(notesDir, 'project', openNoteCommandId, context, window, workspace, commands, commonUtils, frontmatterUtils, pathUtils)
	}
}