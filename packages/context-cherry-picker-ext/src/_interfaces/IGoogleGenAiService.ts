// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

export interface IGoogleGenAiCountTokensResult { //>
	tokens: number
	error?: 'API_KEY_MISSING' | 'API_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR' | 'SKIPPED_NO_KEY'
	errorMessage?: string
} //<

export interface IGoogleGenAiService { //>
	countTokens: (text: string) => Promise<IGoogleGenAiCountTokensResult>
} //<
