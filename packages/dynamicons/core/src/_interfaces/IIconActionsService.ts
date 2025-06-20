// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IIconActionsService {
	assignIconToResource: (
		resourceUris: Uri[],
		iconTypeScope?: 'file' | 'folder' | 'language'
	) => Promise<void>

	/**
	 * Shows a QuickPick list of available icon definitions.
	 * @param assignableToType Filters icons suitable for 'file' or 'folder' assignment. If undefined, shows all.
	 * @param currentFilter An optional filter function to further refine the list of icons based on their definition key.
	 * @returns The selected icon definition key (e.g., "_file", "_usr-myCustomIcon") or undefined if no selection is made.
	 */
	showAvailableIconsQuickPick: (
		assignableToType?: 'file' | 'folder',
		currentFilter?: (iconName: string) => boolean
	) => Promise<string | undefined>

	showUserIconAssignments: (
		type: 'file' | 'folder' | 'language' // Changed from 'file' | 'folder' to include 'language'
	) => Promise<void>

	revertIconAssignment: (
		resourceUris: Uri[]
	) => Promise<void>

	toggleExplorerArrows: () => Promise<void>
	refreshIconTheme: () => Promise<void>

} // <
