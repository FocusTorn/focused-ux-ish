import 'reflect-metadata'
import { container } from 'tsyringe'
import type { ExtensionContext, Disposable, Uri } from 'vscode'
import * as vscode from 'vscode'
import { registerDependencies } from './injection.js'
import { AutotermModule } from './Autoterm.module.js'
import { constants } from './_config/constants.js'

export function activate(context: ExtensionContext): void {
	console.log(`[${constants.extension.name}] Activating...`)

	registerDependencies(context)

	const autotermModule = container.resolve(AutotermModule)

	const disposables: Disposable[] = [
		vscode.commands.registerCommand(
			constants.commands.updateTerminalPath,
			(uri?: Uri) => autotermModule.handleUpdateTerminalPath(uri),
		),
		vscode.commands.registerCommand(
			constants.commands.enterPoetryShell,
			(uri?: Uri) => autotermModule.handleEnterPoetryShell(uri),
		),
	]

	context.subscriptions.push(...disposables)
	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {}