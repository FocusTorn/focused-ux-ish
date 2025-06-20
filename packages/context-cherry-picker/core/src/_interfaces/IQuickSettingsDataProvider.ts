// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { WebviewViewProvider, WebviewView, WebviewViewResolveContext, CancellationToken, Event } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IQuickSettingsDataProvider extends WebviewViewProvider { //>
	onDidUpdateSetting: Event<{ settingId: string, value: any }>

	resolveWebviewView: (
		webviewView: WebviewView,
		context: WebviewViewResolveContext,
		token: CancellationToken,
	) => void | Thenable<void>

	refresh: () => Promise<void>
	updateSettingState: (settingId: string, newState: any) => Promise<void>
	getSettingState: (settingId: string) => Promise<any>
} //<
