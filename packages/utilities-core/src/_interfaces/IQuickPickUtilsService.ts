// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { QuickPickItem, QuickPickOptions } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IQuickPickUtilsService { //>
	showQuickPickSingle: <T extends QuickPickItem, K extends keyof T>(
		items: T[],
		options: QuickPickOptions,
		defaultKey?: K,
	) => Promise<T[K] | undefined>
} //<
