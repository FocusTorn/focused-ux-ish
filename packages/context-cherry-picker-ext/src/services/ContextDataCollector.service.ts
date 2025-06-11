// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe';

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode';
import * as vscode from 'vscode'; // For vscode.FileType, vscode.Uri

//= IMPLEMENTATION TYPES ======================================================================================
import type { IContextDataCollectorService, CollectionResult } from '../_interfaces/IContextDataCollectorService.ts';
import type { FileSystemEntry } from '../_interfaces/ccp.types.ts';

//= INJECTED TYPES ============================================================================================
import type { IWorkspace } from '@focused-ux/shared-services'; // Using shared services
import type * as nodePath from 'node:path';
import micromatch from 'micromatch';
import { constants } from '../_config/constants.ts'; // Path to local constants

//--------------------------------------------------------------------------------------------------------------<<

const LOG_PREFIX = `[${constants.extension.nickName} - ContextDataCollector]:`; // Uses local nickName

@injectable()
export class ContextDataCollectorService implements IContextDataCollectorService { //>

	private projectRootUri!: Uri;

	constructor( //>
		@inject('iWorkspace') private readonly _workspace: IWorkspace,
		@inject('iPathBasename') private readonly _pathBasename: typeof nodePath.basename,
		@inject('iPathRelative') private readonly _pathRelative: typeof nodePath.relative,
	) {} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                          PUBLIC METHODS                                          │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	public async collectContextData( //>
		mode: 'all' | 'selected' | 'none',
		initialCheckedUris: Uri[],
		projectRootUri: Uri,
		coreScanIgnoreGlobs: string[],
		coreScanDirHideAndContentsGlobs: string[],
		coreScanDirShowDirHideContentsGlobs: string[],
	): Promise<CollectionResult> {
		this.projectRootUri = projectRootUri;

		const collectedFileSystemEntries = new Map<string, FileSystemEntry>();
		const urisForContentFsPaths = new Set<Uri>();
		const initialSelectionSet = new Set(initialCheckedUris.map(u => u.fsPath));

		console.log(`${LOG_PREFIX} Collecting file URIs for content based on initial selections.`);
		await this._recursivelyCollectFileUrisForContent(
			initialCheckedUris,
			urisForContentFsPaths,
			coreScanIgnoreGlobs,
			coreScanDirHideAndContentsGlobs,
			coreScanDirShowDirHideContentsGlobs,
			initialSelectionSet,
		);
		console.log(`${LOG_PREFIX} Found ${urisForContentFsPaths.size} actual file URIs for content.`);

		console.log(`${LOG_PREFIX} Collecting file system entries (mode: ${mode}).`);
		if (mode === 'all') {
			await this._recursivelyCollectTreeEntries(
				this.projectRootUri,
				collectedFileSystemEntries,
				coreScanIgnoreGlobs,
				coreScanDirHideAndContentsGlobs,
				coreScanDirShowDirHideContentsGlobs,
			);
		}
		else if (mode === 'selected') {
			for (const uri of initialCheckedUris) {
				await this._recursivelyCollectTreeEntries(
					uri,
					collectedFileSystemEntries,
					coreScanIgnoreGlobs,
					coreScanDirHideAndContentsGlobs,
					coreScanDirShowDirHideContentsGlobs,
				);
			}
		}

		for (const contentUri of urisForContentFsPaths) { //>
			if (!collectedFileSystemEntries.has(contentUri.fsPath)) {
				try {
					const stat = await this._workspace.fs.stat(contentUri);
					const relativePath = this._getRelativePath(contentUri);
					const name = this._pathBasename(contentUri.fsPath) || relativePath.split('/').pop() || relativePath;
					collectedFileSystemEntries.set(contentUri.fsPath, {
						uri: contentUri,
						isFile: true,
						size: stat.size,
						name,
						relativePath,
					});
				}
				catch (e: any) {
					console.warn(`${LOG_PREFIX} Error stating content file ${contentUri.fsPath} for metadata: ${e.message}`);
				}
			}
		} //<

		console.log(`${LOG_PREFIX} Collected ${collectedFileSystemEntries.size} entries for FileSystemEntry map.`);
		return { treeEntries: collectedFileSystemEntries, contentFileUris: urisForContentFsPaths };
	} //<

	// ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                         PRIVATE HELPERS                                          │
	// └──────────────────────────────────────────────────────────────────────────────────────────────────┘

	private _getRelativePath(uri: vscode.Uri): string { //>
		if (!this.projectRootUri) {
			console.warn(`${LOG_PREFIX} projectRootUri is not set when calling _getRelativePath for ${uri.fsPath}`);
			return this._workspace.asRelativePath(uri, false).replace(/\\/g, '/');
		}
		const rootFsPath = this.projectRootUri.fsPath;
		const currentFsPath = uri.fsPath;
		const relative = this._pathRelative(rootFsPath, currentFsPath);
		return relative.replace(/\\/g, '/');
	} //<

	private async _recursivelyCollectFileUrisForContent( //>
		urisToScan: Uri[],
		targetSet: Set<Uri>,
		baseIgnores: string[],
		hideDirAndContents: string[],
		showDirHideContents: string[],
		initialSelectionSet: Set<string>, // Keep for potential future use, currently unused in this exact logic
	): Promise<void> {
		for (const uri of urisToScan) { //>
			if (!uri.fsPath.startsWith(this.projectRootUri.fsPath)) {
				continue;
			}
			const relativePath = this._getRelativePath(uri);

			if (micromatch.isMatch(relativePath, baseIgnores) || micromatch.isMatch(relativePath, hideDirAndContents)) {
				continue;
			}

			try {
				const stat = await this._workspace.fs.stat(uri);
				if (stat.type === vscode.FileType.File) {
					targetSet.add(uri);
				}
				else if (stat.type === vscode.FileType.Directory) {
					if (micromatch.isMatch(relativePath, showDirHideContents)) {
						continue; 
					}
					const entries = await this._workspace.fs.readDirectory(uri);
					const childrenUris = entries.map(([name, _type]) => vscode.Uri.joinPath(uri, name));
					await this._recursivelyCollectFileUrisForContent(
						childrenUris,
						targetSet,
						baseIgnores,
						hideDirAndContents,
						showDirHideContents,
						initialSelectionSet,
					);
				}
			}
			catch (error: any) {
				console.error(`${LOG_PREFIX} [ContentScan] Error processing ${uri.fsPath}: ${error.message}`);
			}
		} //<
	} //<

	private async _recursivelyCollectTreeEntries( //>
		uri: Uri,
		targetMap: Map<string, FileSystemEntry>,
		baseIgnores: string[],
		hideDirAndContents: string[],
		showDirHideContents: string[],
	): Promise<void> {
		if (!uri.fsPath.startsWith(this.projectRootUri.fsPath)) {
			return;
		}
		const relativePath = this._getRelativePath(uri);

		if (micromatch.isMatch(relativePath, baseIgnores) || micromatch.isMatch(relativePath, hideDirAndContents)) {
			return;
		}

		try {
			const stat = await this._workspace.fs.stat(uri);
			const name = this._pathBasename(uri.fsPath) || (relativePath === '' ? this._pathBasename(this.projectRootUri.fsPath) : relativePath.split('/').pop() || relativePath);

			if (!targetMap.has(uri.fsPath)) {
				targetMap.set(uri.fsPath, {
					uri,
					isFile: stat.type === vscode.FileType.File,
					size: stat.size,
					name,
					relativePath,
				});
			}

			if (stat.type === vscode.FileType.Directory) { //>
				if (micromatch.isMatch(relativePath, showDirHideContents)) {
					return; 
				}
				const entries = await this._workspace.fs.readDirectory(uri);
				for (const [childName, _childType] of entries) { //>
					const childUri = vscode.Uri.joinPath(uri, childName);
					await this._recursivelyCollectTreeEntries(
						childUri,
						targetMap,
						baseIgnores,
						hideDirAndContents,
						showDirHideContents,
					);
				} //<
			} //<
		}
		catch (error: any) {
			console.error(`${LOG_PREFIX} [TreeScan] Error processing ${uri.fsPath}: ${error.message}`);
		}
	} //<

}