// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import 'reflect-metadata'
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, Disposable } from 'vscode'
import * as vscode from 'vscode' // For vscode.commands

//= IMPLEMENTATIONS ===========================================================================================
import { registerCCP_Dependencies } from './injection.js'
import type { IContextCherryPickerManager } from './_interfaces/IContextCherryPickerManager.ts'
import { constants } from './_config/constants.js'
import type { SavedStateItem } from './models/SavedStateItem.ts'

//--------------------------------------------------------------------------------------------------------------<<

export async function activate(context: ExtensionContext): Promise<void> { //>
	console.log(`[${constants.extension.name}] Activating...`) // Uses satellite's constant

	registerCCP_Dependencies(context)

	const ccpManager = container.resolve<IContextCherryPickerManager>('IContextCherryPickerManager')

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

	const disposables: Disposable[] = [
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

	context.subscriptions.push(...disposables)

	console.log(`[${constants.extension.name}] Activated and commands registered.`)
} //<

export function deactivate(): void { //>
	console.log(`[${constants.extension.name}] Deactivated.`)
} //<
