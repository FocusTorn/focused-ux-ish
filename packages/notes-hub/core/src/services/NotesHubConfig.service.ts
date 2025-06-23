// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { Uri, commands as VsCodeCommands } from 'vscode'

//= NODE JS ===================================================================================================
import type * as nodeOs from 'node:os'
import type * as nodePath from 'node:path'

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubConfigService, NotesHubConfig } from '../_interfaces/INotesHubConfigService.js'
import { notesHubConstants } from '../_config/constants.js'

//= INJECTED TYPES ============================================================================================
import type { IPathUtilsService, IWorkspaceUtilsService, IWorkspace, ICommonUtilsService } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class NotesHubConfigService implements INotesHubConfigService {

	constructor( //>
		@inject('IWorkspace') private readonly iWorkspace: IWorkspace,
		@inject('IPathUtilsService') private readonly iPathUtils: IPathUtilsService,
		@inject('IWorkspaceUtilsService') private readonly iWorkspaceUtils: IWorkspaceUtilsService,
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject('iOsHomedir') private readonly iOsHomedir: typeof nodeOs.homedir,
		@inject('iPathJoin') private readonly iPathJoin: typeof nodePath.join,
		@inject('iPathNormalize') private readonly iPathNormalize: typeof nodePath.normalize,
	) {} //<

	public getNotesHubConfig(configPrefix: string): NotesHubConfig { //>
		const nhConfig = this.iWorkspace.getConfiguration(configPrefix)

		const getPath = (key: string, defaultSubPath: string): string => {
			let configuredPath: string = nhConfig.get<string>(key) || ''
			if (!configuredPath) {
				if (key === notesHubConstants.configKeys.PROJECT_PATH) {
					const workspaceInfo = this.iWorkspaceUtils.getWorkspaceInfo()
					const { primaryName, workspaceName } = workspaceInfo
					let projectDirName: string = 'default_project_notes'
					if (primaryName && workspaceName && primaryName !== workspaceName) {
						projectDirName = `${primaryName}(${workspaceName})`
					}
					else if (primaryName || workspaceName) {
						projectDirName = primaryName || workspaceName!
					}

					configuredPath = this.iPathJoin(this.iOsHomedir(), '.fux_note-hub', 'project', projectDirName)

				}
				else {

					configuredPath = this.iPathJoin(this.iOsHomedir(), '.fux_note-hub', defaultSubPath)

				}
			}
			else if (configuredPath.startsWith('~')) {
				configuredPath = this.iPathJoin(this.iOsHomedir(), configuredPath.slice(1))
			}
			return this.iPathUtils.santizePath(this.iPathNormalize(configuredPath))
		}

		const projectNotesPath = getPath(notesHubConstants.configKeys.PROJECT_PATH, 'project/default_project_notes')
		const remoteNotesPath = getPath(notesHubConstants.configKeys.REMOTE_PATH, 'remote')
		const globalNotesPath = getPath(notesHubConstants.configKeys.GLOBAL_PATH, 'global')

		const isProjectNotesEnabled = nhConfig.get<boolean>(notesHubConstants.configKeys.ENABLE_PROJECT_NOTES, true)
		const isRemoteNotesEnabled = nhConfig.get<boolean>(notesHubConstants.configKeys.ENABLE_REMOTE_NOTES, true)
		const isGlobalNotesEnabled = nhConfig.get<boolean>(notesHubConstants.configKeys.ENABLE_GLOBAL_NOTES, true)

		VsCodeCommands.executeCommand('setContext', `config.${configPrefix}.enableProjectNotes`, isProjectNotesEnabled)
		VsCodeCommands.executeCommand('setContext', `config.${configPrefix}.enableRemoteNotes`, isRemoteNotesEnabled)
		VsCodeCommands.executeCommand('setContext', `config.${configPrefix}.enableGlobalNotes`, isGlobalNotesEnabled)

		return {
			projectNotesPath,
			remoteNotesPath,
			globalNotesPath,
			isProjectNotesEnabled,
			isRemoteNotesEnabled,
			isGlobalNotesEnabled,
		}
	} //<

	public async createDirectoryIfNeeded(dirPath: string): Promise<void> { //>
		try {
			const uri = Uri.file(this.iPathUtils.santizePath(dirPath))
			try {
				await this.iWorkspace.fs.stat(uri)
			}
			catch (error) {
				const fsError = error as NodeJS.ErrnoException
				if (fsError.code === 'ENOENT' || fsError.code === 'FileNotFound') {
					await this.iWorkspace.fs.createDirectory(uri)
				}
				else {
					throw error
				}
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to ensure directory exists: ${dirPath}`, error)
		}
	} //<
}