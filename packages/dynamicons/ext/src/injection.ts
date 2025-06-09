// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container, Lifecycle } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'
import {
	commands as VsCodeCommands,
	window as VsCodeWindow,
	workspace as VsCodeWorkspace,
	Uri,
	ConfigurationTarget,
	FileType,
} from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import type { IIconActionsService, IIconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import { IconActionsService, IconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import type { // Corrected: Added 'type' for all interface imports
	ICommonUtilsService,
	IFileUtilsService,
	IFrontmatterUtilsService,
	IPathUtilsService,
	IQuickPickUtilsService,
	IShellUtilsService,
	IWorkspaceUtilsService,
	IWindow,
	IWorkspace,
	ICommands,
} from '@focused-ux/shared-services'
import {
	CommonUtilsService,
	FileUtilsService,
	FrontmatterUtilsService,
	PathUtilsService,
	QuickPickUtilsService,
	ShellUtilsService,
	WorkspaceUtilsService,
} from '@focused-ux/shared-services'

//= NODE JS ===================================================================================================
import { createReadStream as nodeFsCreateReadStreamFunction } from 'node:fs'
import * as nodeFs from 'node:fs'
import * as nodePath from 'node:path'
import * as nodeOs from 'node:os'
import * as nodeFsPromises from 'node:fs/promises'

//--------------------------------------------------------------------------------------------------------------<<

class WindowAdapter implements IWindow { //>

	get activeTextEditor() {
		return VsCodeWindow.activeTextEditor
	}

	get visibleTextEditors() {
		return VsCodeWindow.visibleTextEditors
	}

	get activeTerminal() {
		return VsCodeWindow.activeTerminal
	}

	get terminals() {
		return VsCodeWindow.terminals
	}

	showInformationMessage(
		...args: any[]
	): Thenable<any> {
		return (VsCodeWindow.showInformationMessage as any)(...args)
	}

	showWarningMessage(
		...args: any[]
	): Thenable<any> {
		return (VsCodeWindow.showWarningMessage as any)(...args)
	}

	showErrorMessage(
		...args: any[]
	): Thenable<any> {
		return (VsCodeWindow.showErrorMessage as any)(...args)
	}

	showQuickPick(
		...args: any[]
	): Thenable<any> {
		return (VsCodeWindow.showQuickPick as any)(...args)
	}

	showInputBox(...args: any[]): Thenable<string | undefined> {
		return (VsCodeWindow.showInputBox as any)(...args)
	}

	createQuickPick<T extends import('vscode').QuickPickItem>(): import('vscode').QuickPick<T> {
		return VsCodeWindow.createQuickPick<T>()
	}

	createTreeView<T>(
		viewId: string,
		options: import('vscode').TreeViewOptions<T>,
	): import('vscode').TreeView<T> {
		return VsCodeWindow.createTreeView(viewId, options)
	}

	showTextDocument(
		...args: any[]
	): Thenable<import('vscode').TextEditor> {
		return (VsCodeWindow.showTextDocument as any)(...args)
	}

	createTerminal(
		...args: any[]
	): import('vscode').Terminal {
		return (VsCodeWindow.createTerminal as any)(...args)
	}

	withProgress<R>(
		options: import('vscode').ProgressOptions,
		task: (
			progress: import('vscode').Progress<{ message?: string, increment?: number }>,
			token: import('vscode').CancellationToken
		) => Thenable<R>,
	): Thenable<R> {
		return VsCodeWindow.withProgress(options, task)
	}

	createOutputChannel(
		name: string,
	): import('vscode').OutputChannel {
		return VsCodeWindow.createOutputChannel(name)
	}

	registerWebviewViewProvider(
		viewId: string,
		provider: import('vscode').WebviewViewProvider,
		options?: { webviewOptions?: { retainContextWhenHidden?: boolean } },
	): import('vscode').Disposable {
		return VsCodeWindow.registerWebviewViewProvider(
			viewId,
			provider,
			options,
		)
	}

} //<

class WorkspaceAdapter implements IWorkspace { //>

	get fs() {
		return VsCodeWorkspace.fs
	}
    
	get name() {
		return VsCodeWorkspace.name
	}

	get workspaceFolders() {
		return VsCodeWorkspace.workspaceFolders
	}

	getConfiguration(
		section?: string,
		resource?: Uri,
	) {
		return VsCodeWorkspace.getConfiguration(section, resource)
	}

	openTextDocument(uriOrOptions?: any) {
		return VsCodeWorkspace.openTextDocument(uriOrOptions)
	}

	createFileSystemWatcher(
		globPattern: any,
		ignoreCreateEvents?: boolean,
		ignoreChangeEvents?: boolean,
		ignoreDeleteEvents?: boolean,
	) {
		return VsCodeWorkspace.createFileSystemWatcher(
			globPattern,
			ignoreCreateEvents,
			ignoreChangeEvents,
			ignoreDeleteEvents,
		)
	}

	getWorkspaceFolder(uri: Uri) {
		return VsCodeWorkspace.getWorkspaceFolder(uri)
	}

	asRelativePath(
		pathOrUri: string | Uri,
		includeWorkspaceFolder?: boolean,
	) {
		return VsCodeWorkspace.asRelativePath(pathOrUri, includeWorkspaceFolder)
	}

	findFiles(
		include: any,
		exclude?: any,
		maxResults?: number,
		token?: any,
	) {
		return VsCodeWorkspace.findFiles(include, exclude, maxResults, token)
	}

	saveAll(includeUntitled?: boolean) {
		return VsCodeWorkspace.saveAll(includeUntitled)
	}

	applyEdit(edit: import('vscode').WorkspaceEdit) {
		return VsCodeWorkspace.applyEdit(edit)
	}

	onDidChangeConfiguration(
		listener: any,
		thisArgs?: any,
		disposables?: any,
	) {
		return VsCodeWorkspace.onDidChangeConfiguration(listener, thisArgs, disposables)
	}

	onDidOpenTextDocument(
		listener: any,
		thisArgs?: any,
		disposables?: any,
	) {
		return VsCodeWorkspace.onDidOpenTextDocument(listener, thisArgs, disposables)
	}

	onDidCloseTextDocument(
		listener: any,
		thisArgs?: any,
		disposables?: any,
	) {
		return VsCodeWorkspace.onDidCloseTextDocument(listener, thisArgs, disposables)
	}

	onDidSaveTextDocument(
		listener: any,
		thisArgs?: any,
		disposables?: any,
	) {
		return VsCodeWorkspace.onDidSaveTextDocument(listener, thisArgs, disposables)
	}

	onDidChangeWorkspaceFolders(
		listener: any,
		thisArgs?: any,
		disposables?: any,
	) {
		return VsCodeWorkspace.onDidChangeWorkspaceFolders(listener, thisArgs, disposables)
	}

} //<

class CommandsAdapter implements ICommands { //>

	registerCommand(
		command: string,
		callback: (...args: any[]) => any,
		thisArg?: any,
	) {
		return VsCodeCommands.registerCommand(command, callback, thisArg)
	}

	executeCommand<T = unknown>(
		command: string,
		...rest: any[]
	) {
		return VsCodeCommands.executeCommand<T>(command, ...rest)
	}

	getCommands(filterInternal?: boolean) {
		return VsCodeCommands.getCommands(filterInternal)
	}

} //<

export function registerDynamiconsDependencies(context: ExtensionContext): void { //>
	container.register<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService)
	container.register<IFileUtilsService>('IFileUtilsService', FileUtilsService)
	container.register<IFrontmatterUtilsService>('IFrontmatterUtilsService', FrontmatterUtilsService)
	container.register<IPathUtilsService>('IPathUtilsService', PathUtilsService)
	container.register<IQuickPickUtilsService>('IQuickPickUtilsService', QuickPickUtilsService)
	container.register<IShellUtilsService>('IShellUtilsService', ShellUtilsService)
	container.register<IWorkspaceUtilsService>('IWorkspaceUtilsService', WorkspaceUtilsService)

	container.register<IWindow>('iWindow', WindowAdapter)
	container.register<IWorkspace>('iWorkspace', WorkspaceAdapter)
	container.register<ICommands>('iCommands', CommandsAdapter)

	container.register<typeof nodeFsCreateReadStreamFunction>(
		'iFsCreateReadStream',
		{ useValue: nodeFsCreateReadStreamFunction },
	)
	container.register<typeof nodeFs.readFileSync>(
		'iFsReadFileSync',
		{ useValue: nodeFs.readFileSync },
	)
	container.register<typeof nodeFs.statSync>('iFsStatSync', { useValue: nodeFs.statSync })
	container.register<typeof nodeFsPromises.stat>('iFspStat', { useValue: nodeFsPromises.stat })
	container.register<typeof nodeFsPromises.readFile>(
		'iFspReadFile',
		{ useValue: nodeFsPromises.readFile },
	)
	container.register<typeof nodeFsPromises.writeFile>(
		'iFspWriteFile',
		{ useValue: nodeFsPromises.writeFile },
	)
	container.register<typeof nodeFsPromises.readdir>(
		'iFspReaddir',
		{ useValue: nodeFsPromises.readdir },
	)
	container.register<typeof nodeFsPromises.copyFile>(
		'iFspCopyFile',
		{ useValue: nodeFsPromises.copyFile },
	)
	container.register<typeof nodeFsPromises.access>('iFspAccess', { useValue: nodeFsPromises.access })
	container.register<typeof nodeFsPromises.mkdir>('iFspMkdir', { useValue: nodeFsPromises.mkdir })
	container.register<typeof nodeFsPromises.rename>('iFspRename', { useValue: nodeFsPromises.rename })

	container.register<typeof nodePath.dirname>('iPathDirname', { useValue: nodePath.dirname })
	container.register<typeof nodePath.join>('iPathJoin', { useValue: nodePath.join })
	container.register<typeof nodePath.basename>('iPathBasename', { useValue: nodePath.basename })
	container.register<typeof nodePath.isAbsolute>(
		'iPathIsAbsolute',
		{ useValue: nodePath.isAbsolute },
	)
	container.register<typeof nodePath.resolve>('iPathResolve', { useValue: nodePath.resolve })
	container.register<typeof nodePath.normalize>('iPathNormalize', { useValue: nodePath.normalize })
	container.register<typeof nodePath.relative>('iPathRelative', { useValue: nodePath.relative })
	container.register<typeof nodePath.parse>('iPathParse', { useValue: nodePath.parse })
	container.register<typeof nodePath.extname>('iPathExtname', { useValue: nodePath.extname })
	container.register<typeof nodeOs.homedir>('iOsHomedir', { useValue: nodeOs.homedir })

	container.register<IIconActionsService>(
		'IIconActionsService',
		{ useClass: IconActionsService },
		{ lifecycle: Lifecycle.Singleton },
	)
	container.register<IIconThemeGeneratorService>(
		'IIconThemeGeneratorService',
		{ useClass: IconThemeGeneratorService },
		{ lifecycle: Lifecycle.Singleton },
	)

	container.register<ExtensionContext>('ExtensionContext', { useValue: context })
	container.register<typeof Uri>('vscodeUri', { useValue: Uri })
	container.register<typeof ConfigurationTarget>(
		'vscodeConfigurationTarget',
		{ useValue: ConfigurationTarget },
	)
	container.register<typeof FileType>('vscodeFileType', { useValue: FileType })
} //<
