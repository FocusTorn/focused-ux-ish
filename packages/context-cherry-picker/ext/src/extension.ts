// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import 'reflect-metadata'
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, Disposable } from 'vscode'
import * as vscode from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import { registerCCP_Dependencies } from './injection.js'
import { type IContextCherryPickerManager, ccpConstants, type SavedStateItem, type IFileExplorerDataProvider } from '@focused-ux/context-cherry-picker-core'

//--------------------------------------------------------------------------------------------------------------<<


// TODO Implement Add, Remove and Replace to the saved state.


const extensionDisposables: Disposable[] = []

export async function activate(context: ExtensionContext): Promise<void> {
	console.log(`[${ccpConstants.extension.name}] Activating...`)

	registerCCP_Dependencies(context)

	const ccpManager = container.resolve<IContextCherryPickerManager>('IContextCherryPickerManager')
	const fileExplorerDataProvider = container.resolve<IFileExplorerDataProvider>('IFileExplorerDataProvider')

	if (typeof (fileExplorerDataProvider as any).dispose === 'function') {
		extensionDisposables.push(fileExplorerDataProvider as unknown as Disposable)
	}

	try {
		await ccpManager.initializeViews(
			ccpConstants.views.contextCherryPicker.explorer,
			ccpConstants.views.contextCherryPicker.savedStates,
			ccpConstants.views.contextCherryPicker.quickSettings,
		)
		console.log(`[${ccpConstants.extension.name}] Views initialized.`)
	}
	catch (error) {
		console.error(`[${ccpConstants.extension.name}] Error initializing views:`, error)
		vscode.window.showErrorMessage(`[${ccpConstants.extension.name}] Failed to initialize views. See console for details.`)
	}

	const commandDisposables: Disposable[] = [
		vscode.commands.registerCommand(
			ccpConstants.commands.contextCherryPicker.saveCheckedState,
			async () => await ccpManager.saveCurrentCheckedState(),
		),
		vscode.commands.registerCommand(
			ccpConstants.commands.contextCherryPicker.refreshExplorer,
			async () => await ccpManager.refreshExplorerView(),
		),
		vscode.commands.registerCommand(
			ccpConstants.commands.contextCherryPicker.deleteSavedState,
			async (item: SavedStateItem) => await ccpManager.deleteSavedState(item),
		),
		vscode.commands.registerCommand(
			ccpConstants.commands.contextCherryPicker.loadSavedState,
			async (item: SavedStateItem) => await ccpManager.loadSavedStateIntoExplorer(item),
		),
		vscode.commands.registerCommand(
			ccpConstants.commands.contextCherryPicker.clearAllCheckedInExplorer,
			async () => await ccpManager.clearAllCheckedInExplorer(),
		),
		vscode.commands.registerCommand(
			ccpConstants.commands.contextCherryPicker.copyContextOfCheckedItems,
			async () => await ccpManager.copyContextOfCheckedItems(),
		),
	]

	context.subscriptions.push(...commandDisposables)
	extensionDisposables.push(...commandDisposables)

	console.log(`[${ccpConstants.extension.name}] Activated and commands registered.`)
}

export function deactivate(): void { //>
	console.log(`[${ccpConstants.extension.name}] Deactivating...`)
	for (const disposable of extensionDisposables) {
		try {
			disposable.dispose()
		}
		catch (e) {
			console.error(`[${ccpConstants.extension.name}] Error disposing resource:`, e)
		}
	}
	extensionDisposables.length = 0
	console.log(`[${ccpConstants.extension.name}] Deactivated and resources disposed.`)
} //<
