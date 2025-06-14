// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'
import * as vscode from 'vscode' // For vscode.Uri

//= IMPLEMENTATION TYPES ======================================================================================
import type { IProjectTreeFormatterService } from '../_interfaces/IProjectTreeFormatterService.ts'
import type { FileSystemEntry } from '../_interfaces/ccp.types.ts'

//= INJECTED TYPES ============================================================================================
import micromatch from 'micromatch'

//--------------------------------------------------------------------------------------------------------------<<

interface TreeNode { //>
	entry: FileSystemEntry
	children: TreeNode[]
} //<

// const LOG_PREFIX = `[${constants.extension.nickName} - ProjectTreeFormatter]:` // Uses local nickName

@injectable()
export class ProjectTreeFormatterService implements IProjectTreeFormatterService { //>

	private projectRootUri!: Uri

	constructor() {}

	private _formatFileSize(bytes: number): string { //>
		if (bytes < 1024)
			return `${bytes} B`

		const kb = bytes / 1024

		if (kb < 1024)
			return `${kb.toFixed(2)} KB`
		return `${(kb / 1024).toFixed(2)} MB`
	} //<

	private _buildTree(entries: FileSystemEntry[], projectRootName: string): TreeNode | null { //>
		if (entries.length === 0)
			return null

		const rootEntry: FileSystemEntry = {
			uri: this.projectRootUri,
			isFile: false,
			name: projectRootName,
			relativePath: '',
		}
		const rootNode: TreeNode = { entry: rootEntry, children: [] }
		const map: { [key: string]: TreeNode } = { '': rootNode }

		const sortedEntries = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))

		for (const entry of sortedEntries) { //>
			if (entry.relativePath === '') {
				if (entry.uri.fsPath === this.projectRootUri.fsPath) {
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
							uri: vscode.Uri.joinPath(this.projectRootUri, nodePathKey),
							isFile: false,
							name: part,
							relativePath: nodePathKey,
						}
					const newNode: TreeNode = { entry: nodeEntryForMap, children: [] }

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

	private _generateTreeString(node: TreeNode, indentPrefix: string, isRoot: boolean): string { //>
		let output = ''

		if (isRoot) {
			output += `${node.entry.name}\n`
		}

		const childrenCount = node.children.length

		for (let i = 0; i < childrenCount; i++) { //>
			const child = node.children[i]
			const isLastChild = i === childrenCount - 1
			const connector = isLastChild ? '└─' : '├─'
			const childPrefix = !child.entry.isFile && child.children.length > 0 ? '┬ ' : '─ '

			output += `${indentPrefix}${connector}${childPrefix}${child.entry.name}`
			if (child.entry.isFile) {
				output += ` [${this._formatFileSize(child.entry.size || 0)}]`
			} else {
				output += '/'
			}
			output += '\n'

			if (child.children.length > 0) {
				output += this._generateTreeString(child, indentPrefix + (isLastChild ? '  ' : '│ '), false)
			}
		} //<
		return output
	} //<

	public formatProjectTree( //>
		treeEntriesMap: Map<string, FileSystemEntry>,
		projectRootUri: Uri,
		projectRootName: string,
		outputFilterAlwaysShow: string[],
		outputFilterAlwaysHide: string[],
		outputFilterShowIfSelected: string[],
		initialCheckedUris: Uri[],
	): string {
		this.projectRootUri = projectRootUri

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

		const treeRootNode = this._buildTree(entriesForTreeDisplay, projectRootName)

		if (treeRootNode) {
			return this._generateTreeString(treeRootNode, '', true).trimEnd()
		}

		if (treeEntriesMap.size > 0 || entriesForTreeDisplay.length > 0) {
			return `${projectRootName}/\n`
		}
		return ''
	} //<

}