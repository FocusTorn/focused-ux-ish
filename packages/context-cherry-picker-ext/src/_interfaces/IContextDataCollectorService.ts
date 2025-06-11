// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileSystemEntry } from './ccp.types.ts'

//--------------------------------------------------------------------------------------------------------------<<

export interface CollectionResult { //>
	treeEntries: Map<string, FileSystemEntry>
	contentFileUris: Set<Uri>
} //<

export interface IContextDataCollectorService { //>
	collectContextData: (
		mode: 'all' | 'selected' | 'none',
		initialCheckedUris: Uri[],
		projectRootUri: Uri,
		coreScanIgnoreGlobs: string[],
		coreScanDirHideAndContentsGlobs: string[],
		coreScanDirShowDirHideContentsGlobs: string[],
	) => Promise<CollectionResult>
} //<
