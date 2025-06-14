// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type {
	IWorkspaceUtilsService,
	WorkspaceInfo,
} from '../_interfaces/IWorkspaceUtilsService.js'

//= INJECTED TYPES ============================================================================================
import type { IWorkspace } from '../_vscode_abstractions/IWorkspace.js'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class WorkspaceUtilsService implements IWorkspaceUtilsService { //>

	constructor(
		@inject('IWorkspace') private readonly iWorkspace: IWorkspace,
	) {}

	public getWorkspaceInfo(): WorkspaceInfo { //>
		const workspaceFolders = this.iWorkspace.workspaceFolders
		const inWorkspace = !!workspaceFolders && workspaceFolders.length > 0
		const multiRoot = inWorkspace && workspaceFolders.length > 1
		const workspaceName = inWorkspace ? this.iWorkspace.name : undefined
		let primaryUri: Uri | undefined
		let primaryName: string | undefined
		const multiRootByIndex: Uri[] = []
		const multiRootByName: { [key: string]: Uri } = {}
		let safeWorkspaceName: string = 'default'
		let isRemote: boolean = false
		let remoteUserAndHost: string | undefined

		if (inWorkspace && workspaceFolders) {
			primaryUri = workspaceFolders[0].uri
			primaryName = workspaceFolders[0].name
			safeWorkspaceName = workspaceName ?? primaryName ?? 'default_workspace'

			workspaceFolders.forEach((folder) => {
				if (folder) {
					multiRootByIndex.push(folder.uri)
					multiRootByName[folder.name] = folder.uri

					if (folder.uri?.scheme === 'vscode-remote') {
						isRemote = true
						const authority = folder.uri.authority
						if (authority) {
							const parts = authority.split('+')
							remoteUserAndHost = parts[0]
						}
					}
				}
			})
		} else {
			safeWorkspaceName = `no_workspace_open`
		}

		return {
			inWorkspace,
			workspaceName,
			multiRoot,
			primaryUri,
			primaryName,
			multiRootByIndex,
			multiRootByName,
			workspaceFolders,
			safeWorkspaceName,
			isRemote,
			remoteUserAndHost,
		}
	} //<

} // <