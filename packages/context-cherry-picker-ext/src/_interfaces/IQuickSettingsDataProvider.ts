// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { WebviewViewProvider, WebviewView, WebviewViewResolveContext, CancellationToken } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IQuickSettingsDataProvider extends WebviewViewProvider { //>
	resolveWebviewView: (
		webviewView: WebviewView,
		context: WebviewViewResolveContext,
		token: CancellationToken,
	) => void | Thenable<void>

	refresh: () => Promise<void>
	updateSettingState: (settingId: string, newState: any) => Promise<void>
	getSettingState: (settingId: string) => Promise<any>
} //<
