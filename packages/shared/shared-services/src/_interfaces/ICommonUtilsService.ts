// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface ICommonUtilsService { //>
	delay: (ms: number) => Promise<void>
	errMsg: (msg: string, err?: any) => void
	calculateTokens: (text: string) => number
} //<
