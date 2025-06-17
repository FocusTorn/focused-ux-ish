// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, singleton } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { WebviewView, WebviewViewResolveContext, CancellationToken, Uri, Webview, ExtensionContext, Event } from 'vscode'
import * as vscode from 'vscode' // For vscode.Uri, vscode.joinPath

//= NODE JS ===================================================================================================
import { Buffer } from 'node:buffer' // For Buffer.from when reading file
import * as yaml from 'js-yaml'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IQuickSettingsDataProvider } from '../_interfaces/IQuickSettingsDataProvider.ts'
import { constants } from '../_config/constants.js'

//= INJECTED TYPES ============================================================================================
import type { IWorkspace } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

const PROJECT_STRUCTURE_SETTING_ID = constants.quickSettings.projectStructureContents.id

type ProjectStructureSettingValue = 'none' | 'selected' | 'all'
interface FileGroup { //>
	initially_visible: boolean
	items: string[]
} //<
interface FileGroupsConfig { //>
	[groupName: string]: FileGroup
} //<
interface ProjectYamlConfig { //>
	ContextCherryPicker?: {
		file_groups?: FileGroupsConfig
	}
} //<

@singleton()
export class QuickSettingsDataProvider implements IQuickSettingsDataProvider { //>

	private _view?: WebviewView
	private _extensionUri: Uri
	private _settingsState: Map<string, any> = new Map()
	private _onDidUpdateSetting = new vscode.EventEmitter<{ settingId: string, value: any }>()
	public readonly onDidUpdateSetting: Event<{ settingId: string, value: any }> = this._onDidUpdateSetting.event

	constructor( //>
		@inject('iContext') private readonly _context: ExtensionContext, // Injected ExtensionContext
		@inject('IWorkspace') private readonly _workspace: IWorkspace, // Injected IWorkspace
	) {
		this._extensionUri = this._context.extensionUri
		this._settingsState.set(PROJECT_STRUCTURE_SETTING_ID, 'selected' as ProjectStructureSettingValue)
		this._initializeFileGroupStates()
	} //<

	private async _initializeFileGroupStates(): Promise<void> { //>
		const fileGroups = await this._getFileGroupsFromConfig()

		if (fileGroups) {
			for (const groupName in fileGroups) {
				const group = fileGroups[groupName]
				const settingId = `${constants.quickSettings.fileGroupVisibility.idPrefix}.${groupName}`

				// Only set initial state if not already set (e.g., by user action)
				if (!this._settingsState.has(settingId)) {
					this._settingsState.set(settingId, group.initially_visible ?? false)
				}
			}
		}
	} //<

	private async _getFileGroupsFromConfig(): Promise<FileGroupsConfig | undefined> { //>
		if (this._workspace.workspaceFolders && this._workspace.workspaceFolders.length > 0) {
			const workspaceRoot = this._workspace.workspaceFolders[0].uri
			const configFileUri = vscode.Uri.joinPath(workspaceRoot, constants.projectConfig.fileName)

			try {
				const fileContents = await this._workspace.fs.readFile(configFileUri)
				const yamlContent = Buffer.from(fileContents).toString('utf-8')
				const parsedConfig = yaml.load(yamlContent) as ProjectYamlConfig

				return parsedConfig?.ContextCherryPicker?.file_groups
			}
			catch (error) {
				// File not found is expected, other errors should be logged.
				if (!(error instanceof vscode.FileSystemError && error.code === 'FileNotFound')) {
					console.error(`[${constants.extension.nickName}] Error reading .FocusedUX for file groups:`, error)
				}
			}
		}
		return undefined
	} //<

	public async resolveWebviewView( //>
		webviewView: WebviewView,
		_context: WebviewViewResolveContext<unknown>,
		_token: CancellationToken,
	): Promise<void> {
		this._view = webviewView

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, 'assets', 'views'),
			],
		}

		// Re-initialize states in case config changed while view was hidden
		await this._initializeFileGroupStates()
		webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview)

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
			await this._initializeFileGroupStates()
			this._view.webview.html = await this._getHtmlForWebview(this._view.webview)
		}
	} //<

	public async updateSettingState(settingId: string, newState: any): Promise<void> { //>
		this._settingsState.set(settingId, newState)
		this._onDidUpdateSetting.fire({ settingId, value: newState })

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

	private async _getHtmlForWebview(webview: Webview): Promise<string> { //>
		const nonce = getNonce()
		const currentProjectStructureState = (this._settingsState.get(
			PROJECT_STRUCTURE_SETTING_ID,
		) || 'selected') as ProjectStructureSettingValue

		const viewHtmlUri = vscode.Uri.joinPath(this._extensionUri, 'assets', 'views', 'projectStructureQuickSetting.html')

		const fileGroups = await this._getFileGroupsFromConfig()
		let fileGroupButtonsHtml = ''

		if (fileGroups) {
			for (const groupName in fileGroups) {
				const settingId = `${constants.quickSettings.fileGroupVisibility.idPrefix}.${groupName}`
				const isSelected = this._settingsState.get(settingId) ? 'selected' : ''

				fileGroupButtonsHtml += `<div class="toggle-button ${isSelected}" data-setting-id="${settingId}">${groupName}</div>`
			}
		}

		try {
			const fileContents = await this._workspace.fs.readFile(viewHtmlUri)
			let htmlContent = Buffer.from(fileContents).toString('utf-8')

			// Replace placeholders
			htmlContent = htmlContent.replace(/\$\{nonce\}/g, nonce)
			htmlContent = htmlContent.replace(/\$\{webview.cspSource\}/g, webview.cspSource)
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.none\}/g, currentProjectStructureState === 'none' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.selected\}/g, currentProjectStructureState === 'selected' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.all\}/g, currentProjectStructureState === 'all' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{PROJECT_STRUCTURE_SETTING_ID\}/g, PROJECT_STRUCTURE_SETTING_ID)
			htmlContent = htmlContent.replace(/\$\{fileGroupButtonsHtml\}/g, fileGroupButtonsHtml)

			return htmlContent
		}
		catch (error) {
			console.error(`[${constants.extension.nickName}] Failed to read HTML file ${viewHtmlUri.fsPath}:`, error)
			throw error
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
