// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { Uri } from 'vscode'

//= NODE JS ===================================================================================================
import type * as nodePath from 'node:path'
import type {
	access as fspAccessType,
	copyFile as fspCopyFileType,
	readFile as fspReadFileType,
	writeFile as fspWriteFileType,
	mkdir as fspMkdirType,
} from 'node:fs/promises'
import type {
	PathLike,
	MakeDirectoryOptions,
	WriteFileOptions,
	readFileSync as nodeFsReadFileSyncType,
} from 'node:fs'

// import type { Buffer } from 'node:buffer'

//= MISC ======================================================================================================
import stripJsonComments from 'strip-json-comments'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFileUtilsService } from '../_interfaces/IFileUtilsService.js'
import type { ICommonUtilsService } from '../_interfaces/ICommonUtilsService.js'

//= INJECTED TYPES ============================================================================================
import type { IWindow } from '../_vscode_abstractions/IWindow.js'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class FileUtilsService implements IFileUtilsService { //>

	constructor(
		@inject('IWindow') private readonly iWindow: IWindow,
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject('iPathBasename') private readonly iPathBasename: typeof nodePath.basename,
		@inject('iPathDirname') private readonly iPathDirname: typeof nodePath.dirname,
		@inject('iPathJoin') private readonly iPathJoin: typeof nodePath.join,
		@inject('iPathNormalize') private readonly iPathNormalize: typeof nodePath.normalize,
		@inject('iPathIsAbsolute') private readonly iPathIsAbsolute: typeof nodePath.isAbsolute,
		@inject('iPathResolve') private readonly iPathResolve: typeof nodePath.resolve,
		@inject('iFspAccess') private readonly iFspAccess_node: typeof fspAccessType,
		@inject('iFspCopyFile') private readonly iFspCopyFile_node: typeof fspCopyFileType,
		@inject('iFsReadFileSync') private readonly iFsReadFileSync_node: typeof nodeFsReadFileSyncType,
		@inject('iFspReadFile') private readonly iFspReadFile_node: typeof fspReadFileType,
		@inject('iFspWriteFile') private readonly iFspWriteFile_node: typeof fspWriteFileType,
		@inject('iFspMkdir') private readonly iFspMkdir_node: typeof fspMkdirType,
	) {}

	public async createFileBackup(fileUri: Uri): Promise<void> { //>
		try {
			const sourcePath = fileUri.fsPath
			const baseName = this.iPathBasename(sourcePath)
			const directory = this.iPathDirname(sourcePath)
			let backupNumber = 1
			let backupFileName = `${baseName}.bak`
			let destinationPath = this.iPathNormalize(this.iPathJoin(directory, backupFileName))

			try {
				while (true) {
					await this.iFspAccess_node(destinationPath)
					backupNumber++
					backupFileName = `${baseName}.bak${backupNumber}`
					destinationPath = this.iPathNormalize(this.iPathJoin(directory, backupFileName))
				}
			} catch (error: any) {
				if (error.code !== 'ENOENT') {
					throw error
				}
			}

			await this.iFspCopyFile_node(sourcePath, destinationPath)
			this.iWindow.showInformationMessage(`Backup created: ${backupFileName}`)
		} catch (error) {
			this.iCommonUtils.errMsg(`Error creating backup for ${fileUri.fsPath}`, error)
		}
	} //<

	public readJsonFileSync<T = any>(
		filePath: string,
		encoding: BufferEncoding = 'utf-8',
	): T | undefined { //>
		try {
			const absolutePath = this.iPathIsAbsolute(filePath) ? filePath : this.iPathResolve(filePath)
			const fileContent = this.iFsReadFileSync_node(absolutePath, encoding)
			const contentWithoutComments = stripJsonComments(fileContent.toString())

			return JSON.parse(contentWithoutComments) as T
		} catch (error) {
			this.iCommonUtils.errMsg(`Error reading or parsing JSON file synchronously: ${filePath}`, error)
			return undefined
		}
	} //<

	public async readJsonFileAsync<T = any>(
		filePath: string,
		encoding: BufferEncoding = 'utf-8',
	): Promise<T | undefined> { //>
		try {
			const absolutePath = this.iPathIsAbsolute(filePath) ? filePath : this.iPathResolve(filePath)
			const fileContent = await this.iFspReadFile_node(absolutePath, { encoding })
			const contentWithoutComments = stripJsonComments(fileContent.toString())

			return JSON.parse(contentWithoutComments) as T
		} catch (error) {
			this.iCommonUtils.errMsg(`Error reading or parsing JSON file asynchronously: ${filePath}`, error)
			return undefined
		}
	} //<

	public formatFileSize(bytes: number): string { //>
		if (bytes < 1024)
			return `${bytes} B`

		const kb = bytes / 1024

		if (kb < 1024)
			return `${kb.toFixed(2)} KB`
		return `${(kb / 1024).toFixed(2)} MB`
	} //<

	public async iFspWriteFile(
		path: PathLike | import('node:fs/promises').FileHandle,
		data: string | Uint8Array,
		options?: WriteFileOptions,
	): Promise<void> { //>
		return this.iFspWriteFile_node(path, data, options)
	} //<

	public async iFspAccess(path: PathLike, mode?: number): Promise<void> { //>
		return this.iFspAccess_node(path, mode)
	} //<

	public async iFspMkdir(
		path: PathLike,
		options?: MakeDirectoryOptions,
	): Promise<string | undefined> { //>
		return this.iFspMkdir_node(path, options)
	} //<

} // <