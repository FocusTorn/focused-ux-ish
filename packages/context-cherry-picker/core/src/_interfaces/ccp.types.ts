// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface FileSystemEntry { //>
	uri: Uri
	isFile: boolean
	size?: number
	name: string
	relativePath: string
} //<

export interface FileGroup { //>
	initially_visible: boolean
	items: string[]
} //<

export interface FileGroupsConfig { //>
	[groupName: string]: FileGroup
} //<
