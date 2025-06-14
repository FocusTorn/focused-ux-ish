// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Clipboard, UIKind } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IEnv { //>
	appName: string
	appRoot: string
	language: string
	clipboard: Clipboard
	machineId: string
	sessionId: string
	uiKind: UIKind
} //<
