// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Disposable } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubService } from '../_interfaces/INotesHubService.js'
import type { INotesHubDataProvider } from '../_interfaces/INotesHubDataProvider.js'
import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'
import { notesHubConstants } from '../_config/constants.js'
import type { INotesHubConfigService, NotesHubConfig } from '../_interfaces/INotesHubConfigService.js'
import type { INotesHubActionService } from '../_interfaces/INotesHubActionService.js'
import type { INotesHubProviderManager } from '../_interfaces/INotesHubProviderManager.js'

//= INJECTED TYPES ============================================================================================
import type { IWorkspace } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class NotesHubService implements INotesHubService {

	private disposables: Disposable[] = []
	private configPrefix: string = 'nh'
	private commandPrefix: string = 'nh'

	constructor( //>
		@inject('IWorkspace') private readonly iWorkspace: IWorkspace,
		@inject('INotesHubConfigService') private readonly iConfigService: INotesHubConfigService,
		@inject('INotesHubActionService') private readonly iActionService: INotesHubActionService,
		@inject('INotesHubProviderManager') private readonly iProviderManager: INotesHubProviderManager,
	) {} //<

	public async initializeNotesHub( //>
		configPrefix: string = 'nh',
		commandPrefix: string = 'nh',
	): Promise<void> {
		this.configPrefix = configPrefix
		this.commandPrefix = commandPrefix

		const config = this.iConfigService.getNotesHubConfig(this.configPrefix)

		await this.iConfigService.createDirectoryIfNeeded(config.projectNotesPath)
		await this.iConfigService.createDirectoryIfNeeded(config.remoteNotesPath)
		await this.iConfigService.createDirectoryIfNeeded(config.globalNotesPath)

		const openNoteCommandId = `${this.commandPrefix}.${notesHubConstants.commands.openNote}`

		await this.iProviderManager.initializeProviders(config, this.commandPrefix, openNoteCommandId)

		const configWatcher = this.iWorkspace.onDidChangeConfiguration(async (e) => {
			if (e.affectsConfiguration(this.configPrefix)) {
				this.dispose()
				await this.initializeNotesHub(this.configPrefix, this.commandPrefix)
			}
		})

		this.disposables.push(configWatcher)
	} //<

	public dispose(): void { //>
		this.iProviderManager.dispose()
		this.disposables.forEach(d => d.dispose())
		this.disposables = []
	} //<

	// Delegated methods
	public getNotesHubConfig(): NotesHubConfig {
		return this.iConfigService.getNotesHubConfig(this.configPrefix)
	}

	public getProviderForNote(item: INotesHubItem): Promise<INotesHubDataProvider | undefined> {
		return this.iProviderManager.getProviderForNote(item)
	}

	public refreshProviders(providersToRefresh?: 'project' | 'remote' | 'global' | 'all' | Array<'project' | 'remote' | 'global'>): void {
		this.iProviderManager.refreshProviders(providersToRefresh)
	}

	public revealNotesHubItem(provider: INotesHubDataProvider, item: INotesHubItem, select?: boolean): Promise<void> {
		return this.iProviderManager.revealNotesHubItem(provider, item, select)
	}

	public openNote(noteItem: INotesHubItem): Promise<void> {
		return this.iActionService.openNote(noteItem)
	}

	public renameItem(item: INotesHubItem): Promise<void> {
		return this.iActionService.renameItem(item)
	}

	public addFrontmatter(noteItem: INotesHubItem): Promise<void> {
		return this.iActionService.addFrontmatter(noteItem)
	}

	public openNotePreview(noteItem: INotesHubItem): Promise<void> {
		return this.iActionService.openNotePreview(noteItem)
	}

	public deleteItem(item: INotesHubItem): Promise<void> {
		return this.iActionService.deleteItem(item)
	}

	public copyItem(item: INotesHubItem): Promise<void> {
		return this.iActionService.copyItem(item)
	}

	public cutItem(item: INotesHubItem): Promise<void> {
		return this.iActionService.cutItem(item)
	}

	public pasteItem(targetFolderItem: INotesHubItem): Promise<void> {
		return this.iActionService.pasteItem(targetFolderItem)
	}

	public newNoteInFolder(targetFolderItem: INotesHubItem): Promise<void> {
		return this.iActionService.newNoteInFolder(targetFolderItem)
	}

	public newFolderInFolder(targetFolderItem: INotesHubItem): Promise<void> {
		return this.iActionService.newFolderInFolder(targetFolderItem)
	}

	public newNoteAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> {
		return this.iActionService.newNoteAtRoot(providerName)
	}

	public newFolderAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> {
		return this.iActionService.newFolderAtRoot(providerName)
	}

}
