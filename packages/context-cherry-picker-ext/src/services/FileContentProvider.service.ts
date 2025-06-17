// ESLint & Imports -->>

import { TextDecoder } from 'node:util'

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================
import type { FileContentResult, IFileContentProviderService } from '../_interfaces/IFileContentProviderService.ts'
import type { FileSystemEntry } from '../_interfaces/ccp.types.ts'

//= INJECTED TYPES ============================================================================================
import type { IWindow, IWorkspace } from '@focused-ux/shared-services'
import type { ITokenizerService } from '@focused-ux/shared-services/services/Tokenizer.service.js'
import { constants } from '../_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

const LOG_PREFIX = `[${constants.extension.nickName} - FileContentProvider]:`

@injectable()
export class FileContentProviderService implements IFileContentProviderService { //>

	constructor(
		@inject('IWorkspace') private readonly _workspace: IWorkspace,
		@inject('IWindow') private readonly _window: IWindow,
		@inject('ITokenizerService') private readonly _tokenizer: ITokenizerService,
	) {}

	private _localEstimateTokens(text: string): number { //>
		return this._tokenizer.calculateTokens(text)
	} //<

	public async getFileContents( //>
		contentFileUrisSet: Set<Uri>,
		collectedFileSystemEntries: Map<string, FileSystemEntry>,
		maxTokens: number,
		currentTotalTokens: number,
	): Promise<FileContentResult> {
		let tempFilesContentString = ''
		let processedTokensThisCall = 0
		let limitReachedInThisCall = false

		const sortedContentUris = Array.from(contentFileUrisSet).sort((a, b) => { //>
			const entryA = collectedFileSystemEntries.get(a.fsPath)
			const entryB = collectedFileSystemEntries.get(b.fsPath)
			const pathA = entryA ? entryA.relativePath : a.fsPath
			const pathB = entryB ? entryB.relativePath : b.fsPath

			return pathA.localeCompare(pathB)
		}) //<

		if (sortedContentUris.length > 0) { //|>
			console.log(`${LOG_PREFIX} Starting to process file contents for ${sortedContentUris.length} items.`)
			for (const uri of sortedContentUris) { //>
				const entry = collectedFileSystemEntries.get(uri.fsPath)

				if (!entry || !entry.isFile) {
					console.warn(`${LOG_PREFIX} URI ${uri.fsPath} for content but not a valid file entry. Skipping.`)
					continue
				}

				try {
					const fileContentBytes = await this._workspace.fs.readFile(uri)
					const fileContent = new TextDecoder().decode(fileContentBytes)
					const fileEntryString = `<file name="${entry.name}" path="/${entry.relativePath}">\n${fileContent}\n</file>\n`
					const tokensForThisFile = this._localEstimateTokens(fileEntryString)

					if (currentTotalTokens + processedTokensThisCall + tokensForThisFile > maxTokens) {
						this._window.showWarningMessage(`Context limit reached. File '${entry.name}' and subsequent files were not added.`)
						console.log(`${LOG_PREFIX} Token limit reached processing ${entry.name}.`)
						limitReachedInThisCall = true
						break
					}
					tempFilesContentString += fileEntryString
					processedTokensThisCall += tokensForThisFile
				}
				catch (error: any) {
					this._window.showErrorMessage(`Error reading file ${uri.fsPath} for content: ${error.message}`)
					console.error(`${LOG_PREFIX} Error reading file ${uri.fsPath}: ${error.message}`)
				}
			} //<
		}
		else { //||>
			console.log(`${LOG_PREFIX} No file items were identified for content processing.`)
		} //<|

		return {
			contentString: tempFilesContentString,
			processedTokens: processedTokensThisCall,
			limitReached: limitReachedInThisCall,
		}
	} //<

}
