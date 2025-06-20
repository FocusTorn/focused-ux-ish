import type { StoredFragment } from '../../clipboard/_interfaces/IClipboardService.js'

export interface IImportGeneratorService {
	generate(currentFilePath: string, fragment: StoredFragment): string | undefined
}