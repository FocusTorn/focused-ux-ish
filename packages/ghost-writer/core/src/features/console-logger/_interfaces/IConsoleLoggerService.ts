export interface ConsoleLoggerGenerateOptions {
	documentContent: string
	fileName: string
	selectedVar: string
	selectionLine: number
	includeClassName: boolean
	includeFunctionName: boolean
}

export interface ConsoleLoggerResult {
	logStatement: string
	insertLine: number
}

export interface IConsoleLoggerService {
	generate(options: ConsoleLoggerGenerateOptions): ConsoleLoggerResult | undefined
}