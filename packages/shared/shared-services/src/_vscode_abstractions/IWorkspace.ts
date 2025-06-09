// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type {
	CancellationToken,
	ConfigurationChangeEvent,
	Disposable,
	FileSystemWatcher,
	GlobPattern,
	TextDocument,
	Uri,
	WorkspaceConfiguration,
	WorkspaceEdit,
	WorkspaceFolder,
	WorkspaceFoldersChangeEvent,
	workspace as VsCodeWorkspace, // For VsCodeWorkspace.fs type
} from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IWorkspace { //>
	fs: typeof VsCodeWorkspace.fs
	getConfiguration: (section?: string, resource?: Uri) => WorkspaceConfiguration
	name: string | undefined
	openTextDocument: ((uri: Uri | string) => Thenable<TextDocument>) &
	  ((options?: { language?: string, content?: string }) => Thenable<TextDocument>)
	workspaceFolders: readonly WorkspaceFolder[] | undefined
	createFileSystemWatcher: (
		globPattern: GlobPattern,
		ignoreCreateEvents?: boolean,
		ignoreChangeEvents?: boolean,
		ignoreDeleteEvents?: boolean
	) => FileSystemWatcher
	getWorkspaceFolder: (uri: Uri) => WorkspaceFolder | undefined
	asRelativePath: (pathOrUri: string | Uri, includeWorkspaceFolder?: boolean) => string
	findFiles: (
		include: GlobPattern,
		exclude?: GlobPattern | null,
		maxResults?: number,
		token?: CancellationToken
	) => Thenable<Uri[]>
	saveAll: (includeUntitled?: boolean) => Thenable<boolean>
	applyEdit: (edit: WorkspaceEdit) => Thenable<boolean>
	onDidChangeConfiguration: (
		listener: (e: ConfigurationChangeEvent) => any,
		thisArgs?: any,
		disposables?: Disposable[]
	) => Disposable
	onDidOpenTextDocument: (
		listener: (document: TextDocument) => any,
		thisArgs?: any,
		disposables?: Disposable[]
	) => Disposable
	onDidCloseTextDocument: (
		listener: (document: TextDocument) => any,
		thisArgs?: any,
		disposables?: Disposable[]
	) => Disposable
	onDidSaveTextDocument: (
		listener: (document: TextDocument) => any,
		thisArgs?: any,
		disposables?: Disposable[]
	) => Disposable
	onDidChangeWorkspaceFolders: (
		listener: (event: WorkspaceFoldersChangeEvent) => any,
		thisArgs?: any,
		disposables?: Disposable[]
	) => Disposable
} //<
