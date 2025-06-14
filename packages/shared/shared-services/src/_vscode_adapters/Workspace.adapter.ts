// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { injectable } from 'tsyringe';

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
	workspace as VsCodeWorkspaceType, // For VsCodeWorkspace.fs type
} from 'vscode';
import { workspace as VsCodeWorkspace } from 'vscode';

//= IMPLEMENTATION TYPES ======================================================================================
import type { IWorkspace } from '../_vscode_abstractions/IWorkspace.ts'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class WorkspaceAdapter implements IWorkspace {
	get fs(): typeof VsCodeWorkspaceType.fs { return VsCodeWorkspace.fs; }
	get name(): string | undefined { return VsCodeWorkspace.name; }
	get workspaceFolders(): readonly WorkspaceFolder[] | undefined { return VsCodeWorkspace.workspaceFolders; }

	getConfiguration(section?: string, resource?: Uri): WorkspaceConfiguration { return VsCodeWorkspace.getConfiguration(section, resource); }
	openTextDocument(uriOrOptions?: any): Thenable<TextDocument> { return VsCodeWorkspace.openTextDocument(uriOrOptions); }
	createFileSystemWatcher(globPattern: GlobPattern, ignoreCreateEvents?: boolean, ignoreChangeEvents?: boolean, ignoreDeleteEvents?: boolean): FileSystemWatcher { //>
		return VsCodeWorkspace.createFileSystemWatcher(globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents);
	} //<
	getWorkspaceFolder(uri: Uri): WorkspaceFolder | undefined { return VsCodeWorkspace.getWorkspaceFolder(uri); }
	asRelativePath(pathOrUri: string | Uri, includeWorkspaceFolder?: boolean): string { return VsCodeWorkspace.asRelativePath(pathOrUri, includeWorkspaceFolder); }
	findFiles(include: GlobPattern, exclude?: GlobPattern | null, maxResults?: number, token?: CancellationToken): Thenable<Uri[]> { return VsCodeWorkspace.findFiles(include, exclude, maxResults, token); }
	saveAll(includeUntitled?: boolean): Thenable<boolean> { return VsCodeWorkspace.saveAll(includeUntitled); }
	applyEdit(edit: WorkspaceEdit): Thenable<boolean> { return VsCodeWorkspace.applyEdit(edit); }
	onDidChangeConfiguration(listener: (e: ConfigurationChangeEvent) => any, thisArgs?: any, disposables?: Disposable[]): Disposable { return VsCodeWorkspace.onDidChangeConfiguration(listener, thisArgs, disposables); }
	onDidOpenTextDocument(listener: (document: TextDocument) => any, thisArgs?: any, disposables?: Disposable[]): Disposable { return VsCodeWorkspace.onDidOpenTextDocument(listener, thisArgs, disposables); }
	onDidCloseTextDocument(listener: (document: TextDocument) => any, thisArgs?: any, disposables?: Disposable[]): Disposable { return VsCodeWorkspace.onDidCloseTextDocument(listener, thisArgs, disposables); }
	onDidSaveTextDocument(listener: (document: TextDocument) => any, thisArgs?: any, disposables?: Disposable[]): Disposable { return VsCodeWorkspace.onDidSaveTextDocument(listener, thisArgs, disposables); }
	onDidChangeWorkspaceFolders(listener: (event: WorkspaceFoldersChangeEvent) => any, thisArgs?: any, disposables?: Disposable[]): Disposable { return VsCodeWorkspace.onDidChangeWorkspaceFolders(listener, thisArgs, disposables); }
}