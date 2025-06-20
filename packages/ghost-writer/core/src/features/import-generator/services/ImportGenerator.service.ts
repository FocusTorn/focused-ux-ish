import { inject, injectable } from 'tsyringe'
import type { IPathUtilsService, ICommonUtilsService } from '@focused-ux/shared-services'
import type { StoredFragment } from '../../clipboard/_interfaces/IClipboardService.js'
import type { IImportGeneratorService } from '../_interfaces/IImportGeneratorService.js'

@injectable()
export class ImportGeneratorService implements IImportGeneratorService {
	constructor(
		@inject('IPathUtilsService') private readonly pathUtils: IPathUtilsService,
		@inject('ICommonUtilsService') private readonly commonUtils: ICommonUtilsService,
	) {}

	public generate(currentFilePath: string, fragment: StoredFragment): string | undefined {
		const { text: name, sourceFilePath } = fragment
		const relativePath = this.pathUtils.getDottedPath(sourceFilePath, currentFilePath)

		if (!relativePath) {
			this.commonUtils.errMsg('Could not determine relative path for import.')
			return undefined
		}

		const pathWithoutExt = relativePath.replace(/\.[^/.]+$/, '')

		return `import { ${name} } from '${pathWithoutExt}.js'\n`
	}
}