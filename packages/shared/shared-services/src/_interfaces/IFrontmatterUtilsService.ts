// ESLint & Imports -->>

//= NODE JS ===================================================================================================
import type { ReadStream } from 'node:fs'

//--------------------------------------------------------------------------------------------------------------<<

export interface IFrontmatterUtilsService { //>
	getFrontmatter: (filePath: string) => Promise<{ [key: string]: string } | undefined>
	getFrontmatter_extractContent: (fileStream: ReadStream) => Promise<string | undefined>
	getFrontmatter_validateFrontmatter: (fileContent: string) => boolean
	getFrontmatter_parseContent: (frontmatterContent: string) => { [key: string]: string }
} //<
