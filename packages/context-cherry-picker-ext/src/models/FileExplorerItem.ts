// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { //>
	TreeItem,
	TreeItemCollapsibleState,
	ThemeIcon,
	FileType as VsCodeFileTypeEnum,
	TreeItemCheckboxState as VsCodeCheckboxStateValue,
} from 'vscode' //<
import type { //>
	TreeItemCheckboxState,
	FileType as VsCodeFileType,
	TreeItemLabel,
	MarkdownString,
	Uri,
	TreeItemCollapsibleState as VsCodeTreeItemCollapsibleState,
} from 'vscode' //<

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFileExplorerItem } from '../_interfaces/IFileExplorerItem.ts'

//--------------------------------------------------------------------------------------------------------------<<

export class FileExplorerItem extends TreeItem implements IFileExplorerItem {

	public type: 'file' | 'directory'
	public parentUri?: Uri
	public declare label: string | TreeItemLabel | undefined
	public declare tooltip: string | MarkdownString | undefined
	public declare checkboxState?: TreeItemCheckboxState

	constructor(
		public readonly uri: Uri,
		fileName: string,
		fileType: VsCodeFileType,
		initialCheckboxState: TreeItemCheckboxState = VsCodeCheckboxStateValue.Unchecked,
		parentUri?: Uri,
		initialCollapsibleState?: VsCodeTreeItemCollapsibleState,
	) {
		const defaultCollapsibleState = fileType === VsCodeFileTypeEnum.Directory
			? TreeItemCollapsibleState.Collapsed
			: TreeItemCollapsibleState.None

		super(fileName, initialCollapsibleState ?? defaultCollapsibleState)

		this.uri = uri
		this.type = fileType === VsCodeFileTypeEnum.Directory ? 'directory' : 'file'
		this.checkboxState = initialCheckboxState
		this.parentUri = parentUri
		this.resourceUri = uri

		if (this.type === 'directory') {
			this.iconPath = new ThemeIcon('folder')
			this.contextValue = 'directory'
		} else {
			this.iconPath = new ThemeIcon('file')
			this.contextValue = 'file'
		}
		
		this.tooltip = uri.fsPath
	}
    
}
