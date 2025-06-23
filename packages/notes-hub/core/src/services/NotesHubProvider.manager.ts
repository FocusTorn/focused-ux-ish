// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, Disposable } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubProviderManager } from '../_interfaces/INotesHubProviderManager.js'
import type { INotesHubDataProvider } from '../_interfaces/INotesHubDataProvider.js'
import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'
import { ProjectNotesDataProvider } from '../providers/ProjectNotesDataProvider.js'
import { RemoteNotesDataProvider } from '../providers/RemoteNotesDataProvider.js'
import { GlobalNotesDataProvider } from '../providers/GlobalNotesDataProvider.js'
import type { NotesHubConfig } from '../_interfaces/INotesHubConfigService.js'

//= INJECTED TYPES ============================================================================================
import type { ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, ICommands } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class NotesHubProviderManager implements INotesHubProviderManager {

	private projectNotesProvider?: ProjectNotesDataProvider
	private remoteNotesProvider?: RemoteNotesDataProvider
	private globalNotesProvider?: GlobalNotesDataProvider
	private disposables: Disposable[] = []

	constructor( //>
		@inject('ExtensionContext') private readonly iContext: ExtensionContext,
		@inject('IWindow') private readonly iWindow: IWindow,
		@inject('IWorkspace') private readonly iWorkspace: IWorkspace,
		@inject('ICommands') private readonly iCommands: ICommands,
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject('IFrontmatterUtilsService') private readonly iFrontmatterUtils: IFrontmatterUtilsService,
		@inject('IPathUtilsService') private readonly iPathUtils: IPathUtilsService,
	) {} //<

	public async initializeProviders(config: NotesHubConfig, commandPrefix: string, openNoteCommandId: string): Promise<void> { //>
		if (config.isProjectNotesEnabled) {
			this.projectNotesProvider = new ProjectNotesDataProvider(
				this.iContext, this.iWindow, this.iWorkspace, this.iCommands,
				this.iCommonUtils, this.iFrontmatterUtils, this.iPathUtils,
				config.projectNotesPath, openNoteCommandId,
			)
			this.projectNotesProvider.initializeTreeView(`${commandPrefix}.projectNotesView`)
			this.disposables.push(this.projectNotesProvider)
		}

		if (config.isRemoteNotesEnabled) {
			this.remoteNotesProvider = new RemoteNotesDataProvider(
				this.iContext, this.iWindow, this.iWorkspace, this.iCommands,
				this.iCommonUtils, this.iFrontmatterUtils, this.iPathUtils,
				config.remoteNotesPath, openNoteCommandId,
			)
			this.remoteNotesProvider.initializeTreeView(`${commandPrefix}.remoteNotesView`)
			this.disposables.push(this.remoteNotesProvider)
		}

		if (config.isGlobalNotesEnabled) {
			this.globalNotesProvider = new GlobalNotesDataProvider(
				this.iContext, this.iWindow, this.iWorkspace, this.iCommands,
				this.iCommonUtils, this.iFrontmatterUtils, this.iPathUtils,
				config.globalNotesPath, openNoteCommandId,
			)
			this.globalNotesProvider.initializeTreeView(`${commandPrefix}.globalNotesView`)
			this.disposables.push(this.globalNotesProvider)
		}
	} //<

	public dispose(): void { //>
		this.projectNotesProvider?.dispose()
		this.remoteNotesProvider?.dispose()
		this.globalNotesProvider?.dispose()
		this.projectNotesProvider = undefined
		this.remoteNotesProvider = undefined
		this.globalNotesProvider = undefined
		this.disposables.forEach(d => d.dispose())
		this.disposables = []
	} //<

	public async getProviderForNote(
		item: INotesHubItem): Promise<INotesHubDataProvider | undefined> {
		const config = {
			projectNotesPath: this.projectNotesProvider?.notesDir || '',
			remoteNotesPath: this.remoteNotesProvider?.notesDir || '',
			globalNotesPath: this.globalNotesProvider?.notesDir || '',
		}
		const sanitizedFilePath = this.iPathUtils.santizePath(item.filePath)

		if (this.projectNotesProvider && config.projectNotesPath && sanitizedFilePath.startsWith(config.projectNotesPath)) {
			return this.projectNotesProvider
		}
		if (this.remoteNotesProvider && config.remoteNotesPath && sanitizedFilePath.startsWith(config.remoteNotesPath)) {
			return this.remoteNotesProvider
		}
		if (this.globalNotesProvider && config.globalNotesPath && sanitizedFilePath.startsWith(config.globalNotesPath)) {
			return this.globalNotesProvider
		}
		this.iCommonUtils.errMsg(`Could not determine provider for item: ${item.filePath}`)
		return undefined
	} //<

	public getProviderInstance(providerName: 'project' | 'remote' | 'global'): INotesHubDataProvider | undefined { //>
		switch (providerName) {
			case 'project': return this.projectNotesProvider
			case 'remote': return this.remoteNotesProvider
			case 'global': return this.globalNotesProvider
			default: return undefined
		}
	} //<

	public refreshProviders( //>
		providersToRefresh?: 'project' | 'remote' | 'global' | 'all' | Array<'project' | 'remote' | 'global'>,
	): void {
		const targets = Array.isArray(providersToRefresh)
			? providersToRefresh
			: providersToRefresh === undefined || providersToRefresh === 'all'
				? ['project', 'remote', 'global'] as const
				: [providersToRefresh]

		for (const target of targets) {
			switch (target) {
				case 'project': this.projectNotesProvider?.refresh(); break
				case 'remote': this.remoteNotesProvider?.refresh(); break
				case 'global': this.globalNotesProvider?.refresh(); break
			}
		}
	} //<

	public async revealNotesHubItem( //>
		provider: INotesHubDataProvider, item: INotesHubItem, select: boolean = false): Promise<void> {
		try {
			if (!provider.treeView) {
				this.iCommonUtils.errMsg(`Tree view not found for provider: ${provider.providerName}`)
				return
			}
			if (!item) {
				this.iCommonUtils.errMsg('Item to reveal is null or undefined')
				return
			}
			await provider.treeView.reveal(item, { expand: true, select: false })
			if (select) {
				await this.iCommonUtils.delay(50)
				await provider.treeView.reveal(item, { select: true, focus: true, expand: true })
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg('Error revealing item in Notes Hub', error)
		}
	} //<
}