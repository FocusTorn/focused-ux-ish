// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri, WorkspaceFolder } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface WorkspaceInfo { //>
	inWorkspace: boolean
	workspaceName?: string
	multiRoot: boolean
	primaryUri?: Uri
	primaryName?: string
	multiRootByIndex: Uri[]
	multiRootByName: { [key: string]: Uri }
	workspaceFolders?: readonly WorkspaceFolder[]
	safeWorkspaceName: string
	isRemote: boolean
	remoteUserAndHost?: string
} //<

export interface IWorkspaceUtilsService { //>
	getWorkspaceInfo: () => WorkspaceInfo
} //<
