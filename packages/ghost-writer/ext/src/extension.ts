import 'reflect-metadata'
import { container } from 'tsyringe'
import type { ExtensionContext, Disposable } from 'vscode'
import * as vscode from 'vscode'
import { registerDependencies } from './injection.js'
import { GhostWriterModule } from './GhostWriter.module.js'
import { constants } from './_config/constants.js'

export function activate(context: ExtensionContext): void {
	console.log(`[${constants.extension.name}] Activating...`)

	registerDependencies(context)

	const ghostWriterModule = container.resolve(GhostWriterModule)

	const disposables: Disposable[] = [
		vscode.commands.registerCommand(
			constants.commands.storeCodeFragment,
			() => ghostWriterModule.handleStoreCodeFragment(),
		),
		vscode.commands.registerCommand(
			constants.commands.insertImportStatement,
			() => ghostWriterModule.handleInsertImportStatement(),
		),
		vscode.commands.registerCommand(
			constants.commands.logSelectedVariable,
			() => ghostWriterModule.handleLogSelectedVariable(),
		),
	]

	context.subscriptions.push(...disposables)
	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {}