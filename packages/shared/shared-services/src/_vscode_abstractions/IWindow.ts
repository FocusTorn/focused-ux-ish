// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type {
	CancellationToken,
	Disposable,
	ExtensionTerminalOptions,
	InputBoxOptions,
	MessageItem,
	MessageOptions,
	Progress,
	ProgressOptions,
	QuickPick,
	QuickPickItem,
	QuickPickOptions,
	Terminal,
	TextDocument,
	TextDocumentShowOptions,
	TextEditor,
	TreeView,
	TreeViewOptions,
	ViewColumn,
	OutputChannel,
	WebviewViewProvider,
} from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export interface IWindow { //>
	activeTextEditor: TextEditor | undefined
	visibleTextEditors: readonly TextEditor[]
	activeTerminal: Terminal | undefined
	terminals: readonly Terminal[]
	showInformationMessage: ((
		message: string,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & ((
		message: string,
		options: MessageOptions,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		...items: T[]
	) => Thenable<
	  | T
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		options: MessageOptions,
		...items: T[]
	) => Thenable<T | undefined>)
	showWarningMessage: ((
		message: string,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & ((
		message: string,
		options: MessageOptions,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		...items: T[]
	) => Thenable<
	  | T
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		options: MessageOptions,
		...items: T[]
	) => Thenable<T | undefined>)
	showErrorMessage: ((
		message: string,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & ((
		message: string,
		options: MessageOptions,
		...items: string[]
	) => Thenable<
	  | string
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		...items: T[]
	) => Thenable<
	  | T
	  | undefined
	>) & (<T extends MessageItem>(
		message: string,
		options: MessageOptions,
		...items: T[]
	) => Thenable<T | undefined>)
	showQuickPick: (<T extends QuickPickItem>(
		items: readonly T[] | Thenable<readonly T[]>,
		options?: QuickPickOptions,
		token?: CancellationToken
	) => Thenable<
	  | T
	  | undefined
	>) & (<T extends QuickPickItem>(
		items: readonly T[] | Thenable<readonly T[]>,
		options?: QuickPickOptions & { canPickMany: true },
		token?: CancellationToken
	) => Thenable<T[] | undefined>)
	showInputBox: (
		options?: InputBoxOptions,
		token?: CancellationToken
	) => Thenable<string | undefined>
	createQuickPick: <T extends QuickPickItem>() => QuickPick<T>
	createTreeView: <T>(viewId: string, options: TreeViewOptions<T>) => TreeView<T>
	showTextDocument: ((
		document: TextDocument,
		column?: ViewColumn,
		preserveFocus?: boolean
	) => Thenable<TextEditor>) & ((
		document: TextDocument,
		options?: TextDocumentShowOptions
	) => Thenable<TextEditor>)
	createTerminal: ((
		name?: string,
		shellPath?: string,
		shellArgs?: string[] | string
	) => Terminal) & ((options: ExtensionTerminalOptions) => Terminal)
	withProgress: <R>(
		options: ProgressOptions,
		task: (
			progress: Progress<{ message?: string, increment?: number }>,
			token: CancellationToken
		) => Thenable<R>
	) => Thenable<R>
	createOutputChannel: (name: string) => OutputChannel
	registerWebviewViewProvider: (
		viewId: string,
		provider: WebviewViewProvider,
		options?: { webviewOptions?: { retainContextWhenHidden?: boolean } }
	) => Disposable
} //<
