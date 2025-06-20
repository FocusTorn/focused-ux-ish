import 'reflect-metadata'
import { container } from 'tsyringe'
import type { ExtensionContext, Disposable, Uri } from 'vscode'
import * as vscode from 'vscode'
import { registerDependencies } from './injection.js'
import { ChronocopyModule } from './Chronocopy.module.js'
import { constants } from './_config/constants.js'

export function activate(context: ExtensionContext): void {
	console.log(`[${constants.extension.name}] Activating...`)

	registerDependencies(context)

	const chronocopyModule = container.resolve(ChronocopyModule)

	const disposables: Disposable[] = [
		vscode.commands.registerCommand(
			constants.commands.createBackup,
			(uri?: Uri) => chronocopyModule.handleCreateBackup(uri),
		),
	]

	context.subscriptions.push(...disposables)
	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {}