// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { injectable } from 'tsyringe';

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
} from 'vscode';
import { window as VsCodeWindow } from 'vscode';

//= IMPLEMENTATION TYPES ======================================================================================
import type { IWindow } from '../_vscode_abstractions/IWindow.ts'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class WindowAdapter implements IWindow {
	get activeTextEditor(): TextEditor | undefined { return VsCodeWindow.activeTextEditor; }
	get visibleTextEditors(): readonly TextEditor[] { return VsCodeWindow.visibleTextEditors; }
	get activeTerminal(): Terminal | undefined { return VsCodeWindow.activeTerminal; }
	get terminals(): readonly Terminal[] { return VsCodeWindow.terminals; }

	showInformationMessage(message: string, ...args: any[]): Thenable<any> { return VsCodeWindow.showInformationMessage(message, ...args); }
	showWarningMessage(message: string, ...args: any[]): Thenable<any> { return VsCodeWindow.showWarningMessage(message, ...args); }
	showErrorMessage(message: string, ...args: any[]): Thenable<any> { return VsCodeWindow.showErrorMessage(message, ...args); }
	showQuickPick(items: any, options?: any, token?: CancellationToken): Thenable<any> { return VsCodeWindow.showQuickPick(items, options, token); }
	showInputBox(options?: InputBoxOptions, token?: CancellationToken): Thenable<string | undefined> { return VsCodeWindow.showInputBox(options, token); }
	createQuickPick<T extends QuickPickItem>(): QuickPick<T> { return VsCodeWindow.createQuickPick<T>(); }
	createTreeView<T>(viewId: string, options: TreeViewOptions<T>): TreeView<T> { return VsCodeWindow.createTreeView(viewId, options); }
	showTextDocument(document: TextDocument, columnOrOptions?: ViewColumn | TextDocumentShowOptions, preserveFocus?: boolean): Thenable<TextEditor> { //>
		if (typeof columnOrOptions === 'number' || typeof preserveFocus === 'boolean') {
			return VsCodeWindow.showTextDocument(document, columnOrOptions as ViewColumn, preserveFocus);
		}
		return VsCodeWindow.showTextDocument(document, columnOrOptions as TextDocumentShowOptions);
	}  //<
	createTerminal(nameOrOptions?: string | ExtensionTerminalOptions, shellPath?: string, shellArgs?: string[] | string): Terminal { //>
		if (typeof nameOrOptions === 'object') {
			return VsCodeWindow.createTerminal(nameOrOptions);
		}
		return VsCodeWindow.createTerminal(nameOrOptions, shellPath, shellArgs);
	}  //<
	withProgress<R>(options: ProgressOptions, task: (progress: Progress<{ message?: string, increment?: number }>, token: CancellationToken) => Thenable<R>): Thenable<R> { //>
		return VsCodeWindow.withProgress(options, task);
	}  //<
	createOutputChannel(name: string): OutputChannel { return VsCodeWindow.createOutputChannel(name); }
	registerWebviewViewProvider(viewId: string, provider: WebviewViewProvider, options?: { webviewOptions?: { retainContextWhenHidden?: boolean } }): Disposable { //>
		return VsCodeWindow.registerWebviewViewProvider(viewId, provider, options);
	}  //<
}