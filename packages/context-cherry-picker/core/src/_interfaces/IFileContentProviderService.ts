// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface FileContentResult { //>
	contentString: string
	processedTokens: number
	limitReached: boolean
} //<

export interface IFileContentProviderService { //>
	getFileContents: (
		contentFileUris: Set<Uri>,
		collectedFileSystemEntries: Map<string, any>,
		maxTokens: number,
		currentTotalTokens: number,
	) => Promise<FileContentResult>
} //<
