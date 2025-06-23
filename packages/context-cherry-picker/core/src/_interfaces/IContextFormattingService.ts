// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileSystemEntry } from './ccp.types.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface IContextFormattingService { //>
	generateProjectTreeString: (
		treeEntriesMap: Map<string, FileSystemEntry>,
		projectRootUri: Uri,
		projectRootName: string,
		outputFilterAlwaysShow: string[],
		outputFilterAlwaysHide: string[],
		outputFilterShowIfSelected: string[],
		initialCheckedUris: Uri[],
	) => string
} //<
