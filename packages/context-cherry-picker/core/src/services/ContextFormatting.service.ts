// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'
import * as vscode from 'vscode'

//= MISC ======================================================================================================
import micromatch from 'micromatch'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IContextFormattingService } from '../_interfaces/IContextFormattingService.js'
import type { FileSystemEntry } from '../_interfaces/ccp.types.js'

//= INJECTED TYPES ============================================================================================
import type { ITreeFormatterService, TreeFormatterNode, IFileUtilsService } from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

interface InternalTreeNode { //>
	entry: FileSystemEntry
	children: InternalTreeNode[]
} //<

@injectable()
export class ContextFormattingService implements IContextFormattingService {

	constructor( //>
		@inject('ITreeFormatterService') private readonly _treeFormatter: ITreeFormatterService,
		@inject('IFileUtilsService') private readonly _fileUtils: IFileUtilsService,
	) {}

	public generateProjectTreeString( //>
		treeEntriesMap: Map<string, FileSystemEntry>,
		projectRootUri: Uri,
		projectRootName: string,
		outputFilterAlwaysShow: string[],
		outputFilterAlwaysHide: string[],
		outputFilterShowIfSelected: string[],
		initialCheckedUris: Uri[],
	): string {
		const entriesForTreeDisplay = Array.from(treeEntriesMap.values()).filter((entry) => { //>
			const relativePath = entry.relativePath
			const isExplicitlySelected = initialCheckedUris.some(u => u.fsPath === entry.uri.fsPath)

			// Rule 1: `always_show` has the highest precedence.
			if (micromatch.isMatch(relativePath, outputFilterAlwaysShow)) {
				return true
			}

			// Rule 2: `always_hide` is a hard filter (unless overridden by always_show).
			if (micromatch.isMatch(relativePath, outputFilterAlwaysHide)) {
				return false
			}

			// Rule 3: If an item matches a `show_if_selected` glob, its visibility
			// depends on whether it's currently selected in the UI.
			if (micromatch.isMatch(relativePath, outputFilterShowIfSelected)) {
				return isExplicitlySelected
			}

			// Rule 4: If not covered by any specific rule, the item is included by default.
			return true
		}) //<

		const internalTreeRoot = this._buildInternalTree(entriesForTreeDisplay, projectRootUri, projectRootName)

		if (internalTreeRoot) {
			const formatterTreeRoot = this._transformToFormatterTree(internalTreeRoot)

			return this._treeFormatter.formatTree(formatterTreeRoot)
		}

		if (treeEntriesMap.size > 0 || entriesForTreeDisplay.length > 0) {
			return `${projectRootName}/\n`
		}
		return ''
	} //<

	private _buildInternalTree(entries: FileSystemEntry[], projectRootUri: Uri, projectRootName: string): InternalTreeNode | null { //>
		if (entries.length === 0)
			return null

		const rootEntry: FileSystemEntry = {
			uri: projectRootUri,
			isFile: false,
			name: projectRootName,
			relativePath: '',
		}
		const rootNode: InternalTreeNode = { entry: rootEntry, children: [] }
		const map: { [key: string]: InternalTreeNode } = { '': rootNode }

		const sortedEntries = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))

		for (const entry of sortedEntries) { //>
			if (entry.relativePath === '') {
				if (entry.uri.fsPath === projectRootUri.fsPath) {
					rootNode.entry = entry // Update root with actual entry if provided
				}
				continue
			}

			const parts = entry.relativePath.split('/')
			let currentPath = ''
			let parentNode = rootNode

			for (let i = 0; i < parts.length; i++) { //>
				const part = parts[i]
				const isLastPart = i === parts.length - 1
				const nodePathKey = currentPath ? `${currentPath}/${part}` : part

				if (!map[nodePathKey]) { //>
					const nodeEntryForMap = isLastPart
						? entry
						: {
							uri: vscode.Uri.joinPath(projectRootUri, nodePathKey),
							isFile: false,
							name: part,
							relativePath: nodePathKey,
						}
					const newNode: InternalTreeNode = { entry: nodeEntryForMap, children: [] }

					map[nodePathKey] = newNode
					parentNode.children.push(newNode)
					parentNode.children.sort((a, b) => { //>
						if (a.entry.isFile === b.entry.isFile) {
							return a.entry.name.localeCompare(b.entry.name)
						}
						return a.entry.isFile ? 1 : -1
					}) //<
				} //<
				parentNode = map[nodePathKey]
				currentPath = nodePathKey
			} //<
		} //<
		return rootNode
	} //<

	private _transformToFormatterTree(node: InternalTreeNode): TreeFormatterNode { //>
		const formatterNode: TreeFormatterNode = {
			label: node.entry.name,
			isDirectory: !node.entry.isFile,
			children: node.children.map(child => this._transformToFormatterTree(child)),
		}

		if (node.entry.isFile && node.entry.size !== undefined) {
			formatterNode.details = `[${this._fileUtils.formatFileSize(node.entry.size)}]`
		}
		return formatterNode
	} //<

}
