// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= NODE JS ===================================================================================================
import type * as nodePath from 'node:path'
import type { statSync as nodeFsStatSyncType } from 'node:fs'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IPathUtilsService } from '../_interfaces/IPathUtilsService.js'
import type { ICommonUtilsService } from '../_interfaces/ICommonUtilsService.js'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class PathUtilsService implements IPathUtilsService {

	constructor(
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject('iPathNormalize') private readonly nodePathNormalize: typeof nodePath.normalize,
		@inject('iPathIsAbsolute') private readonly nodePathIsAbsolute: typeof nodePath.isAbsolute,
		@inject('iPathResolve') private readonly nodePathResolve: typeof nodePath.resolve,
		@inject('iPathDirname') private readonly nodePathDirname: typeof nodePath.dirname,
		@inject('iPathRelative') private readonly nodePathRelative: typeof nodePath.relative,
		@inject('iPathBasename') private readonly nodePathBasename: typeof nodePath.basename,
		@inject('iPathJoin') private readonly nodePathJoin_constructor: typeof nodePath.join,
		@inject('iFsStatSync') private readonly iFsStatSync: typeof nodeFsStatSyncType,
	) {}

	public santizePath( //>
		uncleanPath: string,
	): string {
		const normalPath = this.nodePathNormalize(uncleanPath)
		let cleanPath = normalPath.replace(/\\/g, '/')

		cleanPath = cleanPath.replace(/\/+/g, '/')
		cleanPath = cleanPath.replace(/\/+$/, '')
		return cleanPath
	} //<

	public getNormalizedDirectory( //>
		filePath: string,
	): string {
		const isAbsolute = this.nodePathIsAbsolute(filePath)
		const resolvedPath = isAbsolute ? filePath : this.nodePathResolve(filePath)
		const posixPath = resolvedPath.replace(/\\/g, '/')
		const normalPath = this.nodePathNormalize(posixPath)

		try {
			const stats = this.iFsStatSync(normalPath)

			return stats.isDirectory() ? normalPath : this.nodePathDirname(normalPath)
		} catch (error: any) {
			if (error.code === 'ENOENT') {
				return this.nodePathDirname(normalPath)
			}
			this.iCommonUtils.errMsg(
				`Error in getNormalizedDirectory for ${filePath}. Falling back to dirname.`,
				error,
			)
			return this.nodePathDirname(normalPath)
		}
	} //<

	public getDottedPath( //>
		targetPath: string,
		pointingPath: string,
	): string | null {
		try {
			const targetDirNormal = this.getNormalizedDirectory(targetPath)
			const pointingDirNormal = this.getNormalizedDirectory(pointingPath)

			let relativeDirPath = this.nodePathRelative(pointingDirNormal, targetDirNormal)

			relativeDirPath = relativeDirPath.replace(/\\/g, '/')

			let finalPath: string

			const normalizedTargetPathForStat = this.nodePathIsAbsolute(targetPath)
				? targetPath
				: this.nodePathResolve(targetPath)
			let isTargetDirectoryLike = targetPath.replace(/\\/g, '/').endsWith('/')

			if (!isTargetDirectoryLike) {
				try {
					if (this.iFsStatSync(normalizedTargetPathForStat).isDirectory()) {
						isTargetDirectoryLike = true
					}
				} catch { /* ignore */ }
			}

			if (isTargetDirectoryLike) {
				if (relativeDirPath === '') {
					finalPath = './'
				} else {
					finalPath = relativeDirPath.endsWith('/') ? relativeDirPath : `${relativeDirPath}/`
					if (!finalPath.startsWith('.') && !finalPath.startsWith('/')) {
						finalPath = `./${finalPath}`
					}
				}
			} else {
				const targetBasename = this.nodePathBasename(targetPath)

				if (relativeDirPath === '') {
					finalPath = `./${targetBasename}`
				} else {
					finalPath = this.nodePathJoin_constructor(relativeDirPath, targetBasename).replace(/\\/g, '/')
					if (!finalPath.startsWith('.') && !finalPath.startsWith('/')) {
						finalPath = `./${finalPath}`
					}
				}
			}
			return finalPath
		} catch (error) {
			this.iCommonUtils.errMsg(
				`Error in getDottedPath for target '${targetPath}' from '${pointingPath}'`,
				error,
			)
			return null
		}
	} //<

	public iPathJoin( //>
		...paths: string[]
	): string {
		return this.nodePathJoin_constructor(...paths)
	} //<

}
