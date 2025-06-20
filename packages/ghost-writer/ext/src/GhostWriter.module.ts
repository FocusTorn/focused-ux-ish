import { inject, singleton } from 'tsyringe'
import type { IWindow, IWorkspace } from '@focused-ux/shared-services'
import type { IClipboardService, IImportGeneratorService, IConsoleLoggerService } from '@focused-ux/ghost-writer-core'
import { Position } from 'vscode'
import { constants } from './_config/constants.js'

@singleton()
export class GhostWriterModule {
	constructor(
		@inject('IClipboardService') private readonly clipboardService: IClipboardService,
		@inject('IImportGeneratorService') private readonly importGeneratorService: IImportGeneratorService,
		@inject('IConsoleLoggerService') private readonly consoleLoggerService: IConsoleLoggerService,
		@inject('IWindow') private readonly window: IWindow,
		@inject('IWorkspace') private readonly workspace: IWorkspace,
	) {}

	public async handleStoreCodeFragment(): Promise<void> {
		const editor = this.window.activeTextEditor
		if (!editor) {
			this.window.showErrorMessage('No active text editor.')
			return
		}

		const selection = editor.selection
		const selectedText = editor.document.getText(selection)

		if (selectedText.trim()) {
			await this.clipboardService.store({
				text: selectedText,
				sourceFilePath: editor.document.fileName,
			})
			this.window.showInformationMessage(`Stored fragment: ${selectedText}`)
		} else {
			this.window.showErrorMessage('No text selected to store.')
		}
	}

	public async handleInsertImportStatement(): Promise<void> {
		const editor = this.window.activeTextEditor
		if (!editor) {
			this.window.showErrorMessage('No active text editor.')
			return
		}

		const fragment = await this.clipboardService.retrieve()
		if (!fragment) {
			this.window.showErrorMessage('No fragment stored in Ghost Writer clipboard.')
			return
		}

		const importStatement = this.importGeneratorService.generate(editor.document.fileName, fragment)

		if (importStatement) {
			await editor.edit((editBuilder) => {
				editBuilder.insert(editor.selection.active, importStatement)
			})
			// Clear the clipboard after successful insertion
			await this.clipboardService.clear()
		}
		// Error messages are handled by the service layer
	}

	public async handleLogSelectedVariable(): Promise<void> {
		const editor = this.window.activeTextEditor
		if (!editor) {
			this.window.showErrorMessage('No active text editor.')
			return
		}

		const config = this.workspace.getConfiguration(constants.extension.configKey)
		const includeClassName = config.get<boolean>(constants.configKeys.loggerIncludeClassName, true)
		const includeFunctionName = config.get<boolean>(constants.configKeys.loggerIncludeFunctionName, true)

		for (const selection of editor.selections) {
			const selectedVar = editor.document.getText(selection)
			if (!selectedVar.trim()) {
				continue
			}

			const result = this.consoleLoggerService.generate({
				documentContent: editor.document.getText(),
				fileName: editor.document.fileName,
				selectedVar,
				selectionLine: selection.active.line,
				includeClassName,
				includeFunctionName,
			})

			if (result) {
				await editor.edit((editBuilder) => {
					const position = new Position(result.insertLine, 0)
					editBuilder.insert(position, result.logStatement)
				})
			}
		}
	}
}