// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, singleton } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { WebviewView, WebviewViewResolveContext, CancellationToken, Uri, Webview, ExtensionContext } from 'vscode'
import * as vscode from 'vscode' // For vscode.Uri, vscode.joinPath

//= NODE JS ===================================================================================================
import { Buffer } from 'node:buffer' // For Buffer.from when reading file

//= IMPLEMENTATION TYPES ======================================================================================
import type { IQuickSettingsDataProvider } from '../_interfaces/IQuickSettingsDataProvider.ts'
import { constants } from '../_config/constants.js'

//= INJECTED TYPES ============================================================================================
import type { IWorkspace } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

const PROJECT_STRUCTURE_SETTING_ID = constants.quickSettings.projectStructureContents.id

type ProjectStructureSettingValue = 'none' | 'selected' | 'all'

@singleton()
export class QuickSettingsDataProvider implements IQuickSettingsDataProvider { //>

	private _view?: WebviewView
	private _extensionUri: Uri
	private _settingsState: Map<string, any> = new Map()

	constructor(
		@inject('iContext') private readonly _context: ExtensionContext, // Injected ExtensionContext
		@inject('iWorkspace') private readonly _workspace: IWorkspace, // Injected IWorkspace
	) { //>
		this._extensionUri = this._context.extensionUri
		this._settingsState.set(PROJECT_STRUCTURE_SETTING_ID, 'selected' as ProjectStructureSettingValue)
	} //<

	public async resolveWebviewView( //> // Made async
		webviewView: WebviewView,
		_context: WebviewViewResolveContext<unknown>,
		_token: CancellationToken,
	): Promise<void> { // Return Promise<void>
		this._view = webviewView

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, 'assets', 'views'), // For HTML file
				// Add other asset paths if needed (e.g., for CSS, JS linked in HTML)
			],
		}

		try {
			webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview)
		} catch (error) {
			console.error(`[${constants.extension.nickName}] Error loading HTML for QuickSettings webview:`, error)
			webviewView.webview.html = `<html><body><p>Error loading quick settings view. Please check console.</p></body></html>`
		}

		webviewView.webview.onDidReceiveMessage(async (message) => { //>
			switch (message.command) {
				case 'updateSetting':
					if (message.settingId && message.value !== undefined) {
						await this.updateSettingState(message.settingId, message.value)
					}
					
			}
		}) //<
	} //<

	public async refresh(): Promise<void> { //>
		if (this._view) {
			try {
				this._view.webview.html = await this._getHtmlForWebview(this._view.webview)
				// console.log(`[${constants.extension.nickName}] QuickSettings webview refreshed.`);
			} catch (error) {
				console.error(`[${constants.extension.nickName}] Error refreshing HTML for QuickSettings webview:`, error)
				this._view.webview.html = `<html><body><p>Error refreshing quick settings view. Please check console.</p></body></html>`
			}
		}
	} //<

	public async updateSettingState(settingId: string, newState: any): Promise<void> { //>
		this._settingsState.set(settingId, newState)
		// console.log(`[${constants.extension.nickName}] Setting '${settingId}' updated to:`, newState);

		if (this._view) { //>
			this._view.webview.postMessage({
				command: 'settingUpdated',
				settingId,
				value: newState,
			})
		} //<
	} //<

	public async getSettingState(settingId: string): Promise<any> { //>
		return this._settingsState.get(settingId)
	} //<

	private async _getHtmlForWebview(webview: Webview): Promise<string> { //> // Made async
		const nonce = getNonce()
		const currentProjectStructureState = (this._settingsState.get(
			PROJECT_STRUCTURE_SETTING_ID,
		) || 'selected') as ProjectStructureSettingValue

		const viewHtmlUri = vscode.Uri.joinPath(this._extensionUri, 'assets', 'views', 'projectStructureQuickSetting.html')

		try {
			const fileContents = await this._workspace.fs.readFile(viewHtmlUri)
			let htmlContent = Buffer.from(fileContents).toString('utf-8')

			// Replace placeholders
			htmlContent = htmlContent.replace(/\$\{nonce\}/g, nonce)
			htmlContent = htmlContent.replace(/\$\{webview.cspSource\}/g, webview.cspSource)
			// For dynamic class assignment based on state
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.none\}/g, currentProjectStructureState === 'none' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.selected\}/g, currentProjectStructureState === 'selected' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.all\}/g, currentProjectStructureState === 'all' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{PROJECT_STRUCTURE_SETTING_ID\}/g, PROJECT_STRUCTURE_SETTING_ID)
			
			return htmlContent
		} catch (error) {
			console.error(`[${constants.extension.nickName}] Failed to read HTML file ${viewHtmlUri.fsPath}:`, error)
			throw error // Re-throw to be caught by caller
		}
	} //<

}

function getNonce(): string { //>
	let text = ''
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
} //<
