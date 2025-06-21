// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//= NODE JS ===================================================================================================
// import type { Buffer } from 'node:buffer'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFileUtilsService { //>
	createFileBackup: (fileUri: Uri) => Promise<void>
	readJsonFileSync: <T = any>(filePath: string, encoding?: BufferEncoding) => T | undefined
	readJsonFileAsync: <T = any>(filePath: string, encoding?: BufferEncoding) => Promise<T | undefined>
	formatFileSize: (bytes: number) => string
	iFspWriteFile: (
		path: import('node:fs').PathLike | import('node:fs/promises').FileHandle,
		data: string | Uint8Array,
		options?: import('node:fs').WriteFileOptions
	) => Promise<void>
	iFspAccess: (path: import('node:fs').PathLike, mode?: number) => Promise<void>
	iFspMkdir: (
		path: import('node:fs').PathLike,
		options?: import('node:fs').MakeDirectoryOptions
	) => Promise<string | undefined>
	// Add other file utility methods if they exist in the service
} //<
