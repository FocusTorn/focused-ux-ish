// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { TreeItem, TreeItemCollapsibleState, ThemeIcon, ThemeColor, Uri } from 'vscode'
import type { TreeItemLabel } from 'vscode'

//= IMPLEMENTATION TYPES ======================================================================================

import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'

//--------------------------------------------------------------------------------------------------------------<<

const NOTESHUB_DEFAULT_NOTE_ICON = 'dash'
const NOTESHUB_DEFAULT_NOTE_COLOR_ID = 'notesHub.foreground'

const priorityColorIds: string[] = [
	'notesHub.priority0',
	'notesHub.priority1',
	'notesHub.priority2',
	'notesHub.priority3',
	'notesHub.priority4',
	'notesHub.priority5',
]

export class NotesHubItem extends TreeItem implements INotesHubItem {

	public filePath: string
	public isDirectory: boolean
	public parentUri?: Uri
	public frontmatter?: { [key: string]: string }
	public declare label: TreeItemLabel | string
	public fileName: string

	constructor(
		fileName: string,
		filePath: string,
		isDirectory: boolean,
		parentUri?: Uri,
		frontmatter?: { [key: string]: string },
	) {
		const displayLabel = (
			frontmatter?.Label && (frontmatter.Label.trim() !== '' && frontmatter.Label.trim() !== 'fn')
				? frontmatter.Label
				: fileName
		)
		super(displayLabel, isDirectory ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None)

		this.fileName = fileName
		this.filePath = filePath
		this.isDirectory = isDirectory
		this.parentUri = parentUri
		this.frontmatter = frontmatter

		if (!filePath || filePath.trim() === '') {
			console.error('Error creating NotesHubItem: filePath is invalid.', filePath)
			throw new Error('Invalid filePath provided for NotesHubItem')
		}

		this.resourceUri = Uri.file(filePath)
		this.description = frontmatter?.Desc
		this.tooltip = this.filePath
		this.contextValue = isDirectory ? 'notesHubFolderItem' : 'notesHubFileItem'
		
		if (isDirectory) {
			this.iconPath = new ThemeIcon('folder')
		}
		else {
			this.iconPath = this.iconPathFromFrontmatter(frontmatter)
		}
	}

	private getPriorityThemeColor(
		priority: number,
	): ThemeColor {
		const colorId = priorityColorIds[Math.min(priority, priorityColorIds.length - 1)]
		return new ThemeColor(colorId)
	}

	public iconPathFromFrontmatter(
		frontmatterData?: { [key: string]: string },
	): ThemeIcon {
		if (!frontmatterData) {
			return new ThemeIcon(NOTESHUB_DEFAULT_NOTE_ICON, new ThemeColor(NOTESHUB_DEFAULT_NOTE_COLOR_ID))
		}

		const iconName = frontmatterData.Codicon || frontmatterData.Icon || NOTESHUB_DEFAULT_NOTE_ICON
		const match = iconName.match(/^([{[($]{0,2})(.*?)([}\])$]?)$/)
		const usedIcon = match?.[2] || iconName
		const priority = Number.parseInt(frontmatterData.Priority, 10)

		return Number.isNaN(priority)
			? new ThemeIcon(usedIcon)
			: new ThemeIcon(usedIcon, this.getPriorityThemeColor(priority))
	}
}