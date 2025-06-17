// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import type { DependencyContainer } from 'tsyringe'
import { container as globalContainer } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, Disposable } from 'vscode'
import * as vscode from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import { INotesHubDataProvider, INotesHubItem, INotesHubService } from '@focused-ux/notes-hub-core'


import { NotesHubService } from '@focused-ux/notes-hub-core'
import { constants } from './_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

export class NotesHubModule {

	private service?: INotesHubService

	public static registerDependencies(
		container: DependencyContainer = globalContainer,
	): void {
		container.registerSingleton<INotesHubService>('INotesHubService', NotesHubService)
	}

	private getService(): INotesHubService {
		if (!this.service) {
			this.service = globalContainer.resolve<INotesHubService>('INotesHubService')
		}
		return this.service
	}

	public registerCommands(
		_context: ExtensionContext,
	): Disposable[] {
		const service = this.getService()
		const commandMap: { [key: string]: (...args: any[]) => any } = {
			[constants.commands.newProjectFolder]: () => service.newFolderAtRoot('project'),
			[constants.commands.newRemoteFolder]: () => service.newFolderAtRoot('remote'),
			[constants.commands.newGlobalFolder]: () => service.newFolderAtRoot('global'),
			[constants.commands.newProjectNote]: () => service.newNoteAtRoot('project'),
			[constants.commands.newRemoteNote]: () => service.newNoteAtRoot('remote'),
			[constants.commands.newGlobalNote]: () => service.newNoteAtRoot('global'),
			[constants.commands.newNestedNote]: (item?: INotesHubItem) => item ? service.newNoteInFolder(item) : vscode.window.showWarningMessage('Select a folder to create a nested note.'),
			[constants.commands.newNestedFolder]: (item?: INotesHubItem) => item ? service.newFolderInFolder(item) : vscode.window.showWarningMessage('Select a folder to create a nested folder.'),
			[constants.commands.openNote]: (item?: INotesHubItem) => item && service.openNote(item),
			[constants.commands.openNotePreview]: (item?: INotesHubItem) => item && service.openNotePreview(item),
			[constants.commands.addFrontmatter]: (item?: INotesHubItem) => item && service.addFrontmatter(item),
			[constants.commands.copyItem]: (item?: INotesHubItem) => item && service.copyItem(item),
			[constants.commands.cutItem]: (item?: INotesHubItem) => item && service.cutItem(item),
			[constants.commands.pasteItem]: (item?: INotesHubItem) => item && service.pasteItem(item),
			[constants.commands.renameItem]: (item?: INotesHubItem) => item && service.renameItem(item),
			[constants.commands.deleteItem]: (item?: INotesHubItem) => item && service.deleteItem(item),
		};

		return Object.entries(commandMap).map(([command, handler]) => {
			return vscode.commands.registerCommand(command, handler);
		});
	}

	public async initializeModule(): Promise<void> {
		const service = this.getService()
		await service.initializeNotesHub(constants.extension.configKey, constants.extension.id)
		console.log(`[${constants.extension.name}] NotesHubModule initialized.`)
	}

	public dispose(): void {
		this.getService()?.dispose()
		console.log(`[${constants.extension.name}] NotesHubModule disposed.`)
	}
}