import 'reflect-metadata'
import { container } from 'tsyringe'
import type { ExtensionContext, Disposable, Uri } from 'vscode'
import * as vscode from 'vscode'
import { registerDependencies } from './injection.js'
import { TerminalButlerModule } from './TerminalButler.module.js'
import { constants } from './_config/constants.js'

export function activate(context: ExtensionContext): void {
	console.log(`[${constants.extension.name}] Activating...`)

	registerDependencies(context)

	const terminalButlerModule = container.resolve(TerminalButlerModule)

	const disposables: Disposable[] = [
		vscode.commands.registerCommand(
			constants.commands.updateTerminalPath,
			(uri?: Uri) => terminalButlerModule.handleUpdateTerminalPath(uri),
		),
		vscode.commands.registerCommand(
			constants.commands.enterPoetryShell,
			(uri?: Uri) => terminalButlerModule.handleEnterPoetryShell(uri),
		),
	]

	context.subscriptions.push(...disposables)
	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {}
