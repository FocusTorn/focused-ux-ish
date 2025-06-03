// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IIconActionsService { //>
	assignIconToResource: (resourceUri: Uri | undefined, iconTypeScope?: 'file' | 'folder' | 'language') => Promise<void>
	revertIconAssignment: (resourceUri: Uri | undefined) => Promise<void>
	showAvailableIconsQuickPick: (iconFilter?: (iconName: string) => boolean) => Promise<string | undefined>
	toggleExplorerArrows: () => Promise<void>
	showUserIconAssignments: (type: 'file' | 'folder') => Promise<void>
	refreshIconTheme: () => Promise<void>
} //<
