// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= NODE JS ===================================================================================================
import * as readline from 'node:readline'
import type { ReadStream, createReadStream as nodeCreateReadStreamType } from 'node:fs'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFrontmatterUtilsService } from '../_interfaces/IFrontmatterUtilsService.js'

//= INJECTED TYPES ============================================================================================
import type { ICommonUtilsService } from '../_interfaces/ICommonUtilsService.js'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class FrontmatterUtilsService implements IFrontmatterUtilsService { //>

	constructor(
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
		@inject(
			'iFsCreateReadStream',
		) private readonly iFsCreateReadStream: typeof nodeCreateReadStreamType,
	) {}

	public async getFrontmatter( //>
		filePath: string,
	): Promise<{ [key: string]: string } | undefined> {
		const fileStream = this.iFsCreateReadStream(filePath, { encoding: 'utf8' })
		const fileContent = (await this.getFrontmatter_extractContent(fileStream)) ?? ''

		if (!fileContent || !fileContent.trim()) {
			return undefined
		}

		return this.getFrontmatter_parseContent(fileContent)
	} //<

	public async getFrontmatter_extractContent( //>
		fileStream: ReadStream,
	): Promise<string | undefined> {
		return new Promise((resolve) => {
			const rl = readline.createInterface({
				input: fileStream,
				crlfDelay: Infinity,
			})

			let frontmatterContent = ''
			let frontmatterStarted = false
			let lineCount = 0
			const maxHeaderLines = 50
			let resolved = false

			const cleanupAndResolve = (value: string | undefined) => {
				if (resolved)
					return
				resolved = true

				rl.close()
				if (!fileStream.destroyed) {
					fileStream.destroy()
				}
				resolve(value)
			}

			fileStream.on('error', (err: Error) => {
				this.iCommonUtils.errMsg('File stream error in getFrontmatter_extractContent', err)
				cleanupAndResolve(undefined)
			})

			rl.on('line', (line: string) => {
				if (resolved)
					return

				lineCount++
				if (line.trim() === '---') {
					if (frontmatterStarted) {
						cleanupAndResolve(frontmatterContent.trimEnd())
						return
					} else {
						frontmatterStarted = true
					}
				} else if (frontmatterStarted) {
					frontmatterContent += `${line}\n`
				} else if (line.trim() !== '' && lineCount > 1) {
					cleanupAndResolve(undefined)
					return
				}

				if (lineCount > maxHeaderLines && frontmatterStarted) {
					console.warn(
						`[FrontmatterUtilsService] Max header lines (${maxHeaderLines}) reached while parsing frontmatter.`,
					)
					cleanupAndResolve(undefined)
				}
			})

			rl.on('close', () => {
				if (!resolved) {
					cleanupAndResolve(undefined)
				}
			})
		})
	} //<

	public getFrontmatter_validateFrontmatter( //>
		fileContent: string,
	): boolean {
		if (!fileContent || typeof fileContent !== 'string') {
			return false
		}

		const lines = fileContent.split(/\r?\n/)

		if (lines.length === 0 || lines[0].trim() !== '---') {
			return false
		}

		if (lines.length < 2) {
			return false
		}

		let frontmatterEndFound = false

		for (let i = 1; i < lines.length; i++) {
			if (lines[i].trim() === '---') {
				frontmatterEndFound = true
				break
			}
		}
		return frontmatterEndFound
	} //<

	public getFrontmatter_parseContent( //>
		frontmatterContent: string,
	): { [key: string]: string } {
		const result: { [key: string]: string } = {}
		const lines = frontmatterContent.split('\n')

		for (const line of lines) {
			if (!line.trim())
				continue

			const separatorIndex = line.indexOf(':')

			if (separatorIndex !== -1) {
				const key = line.slice(0, separatorIndex).trim()
				const value = line.slice(separatorIndex + 1).trim()

				if (key) {
					result[key] = value
				}
			}
		}
		return result
	} //<

} // <
