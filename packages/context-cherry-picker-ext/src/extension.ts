import 'reflect-metadata';
// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, Disposable } from 'vscode'
import * as vscode from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import { registerCCP_Dependencies } from './injection.js'
import type { IContextCherryPickerManager } from './_interfaces/IContextCherryPickerManager.ts'
import { constants } from './_config/constants.js'
import type { SavedStateItem } from './models/SavedStateItem.ts'
import type { IFileExplorerDataProvider } from './_interfaces/IFileExplorerDataProvider.ts' // For dispose

//--------------------------------------------------------------------------------------------------------------<<

// Store disposables that need to be cleaned up on deactivation
const extensionDisposables: Disposable[] = [];

export async function activate(context: ExtensionContext): Promise<void> { //>
	console.log(`[${constants.extension.name}] Activating...`)

	registerCCP_Dependencies(context)

	const ccpManager = container.resolve<IContextCherryPickerManager>('IContextCherryPickerManager')
	const fileExplorerDataProvider = container.resolve<IFileExplorerDataProvider>('IFileExplorerDataProvider');

	// Add the provider to disposables if it implements Disposable
	if (typeof (fileExplorerDataProvider as any).dispose === 'function') {
		extensionDisposables.push(fileExplorerDataProvider as unknown as Disposable);
	}

	try {
		await ccpManager.initializeViews(
			constants.views.contextCherryPicker.explorer,
			constants.views.contextCherryPicker.savedStates,
			constants.views.contextCherryPicker.quickSettings,
		)
		console.log(`[${constants.extension.name}] Views initialized.`)
	} catch (error) {
		console.error(`[${constants.extension.name}] Error initializing views:`, error)
		vscode.window.showErrorMessage(`[${constants.extension.name}] Failed to initialize views. See console for details.`)
	}

	const commandDisposables: Disposable[] = [
		vscode.commands.registerCommand(
			constants.commands.contextCherryPicker.saveCheckedState,
			async () => await ccpManager.saveCurrentCheckedState(),
		),
		vscode.commands.registerCommand(
			constants.commands.contextCherryPicker.refreshExplorer,
			async () => await ccpManager.refreshExplorerView(),
		),
		vscode.commands.registerCommand(
			constants.commands.contextCherryPicker.deleteSavedState,
			async (item: SavedStateItem) => await ccpManager.deleteSavedState(item),
		),
		vscode.commands.registerCommand(
			constants.commands.contextCherryPicker.loadSavedState,
			async (item: SavedStateItem) => await ccpManager.loadSavedStateIntoExplorer(item),
		),
		vscode.commands.registerCommand(
			constants.commands.contextCherryPicker.clearAllCheckedInExplorer,
			async () => await ccpManager.clearAllCheckedInExplorer(),
		),
		vscode.commands.registerCommand(
			constants.commands.contextCherryPicker.copyContextOfCheckedItems,
			async () => await ccpManager.copyContextOfCheckedItems(),
		),
	]

	context.subscriptions.push(...commandDisposables);
	extensionDisposables.push(...commandDisposables); // Also add command disposables to our local list

	console.log(`[${constants.extension.name}] Activated and commands registered.`)
} //<

export function deactivate(): void { //>
	console.log(`[${constants.extension.name}] Deactivating...`)
	for (const disposable of extensionDisposables) {
		try {
			disposable.dispose();
		} catch (e) {
			console.error(`[${constants.extension.name}] Error disposing resource:`, e);
		}
	}
	extensionDisposables.length = 0; // Clear the array
	console.log(`[${constants.extension.name}] Deactivated and resources disposed.`)
} //<