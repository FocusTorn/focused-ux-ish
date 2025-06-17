// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { injectable } from 'tsyringe'

//= MISC ======================================================================================================
import { encode } from 'gpt-tokenizer'

//--------------------------------------------------------------------------------------------------------------<<

export interface ITokenizerService { //>
	calculateTokens: (text: string) => number
} //<

@injectable()
export class TokenizerService implements ITokenizerService { //>

	public calculateTokens(text: string): number { //>
		if (!text) {
			return 0
		}
		try {
			// This is now the single point of contact with the gpt-tokenizer library.
			return encode(text).length
		}
		catch (error) {
			console.error(
				'[TokenizerService] Error using gpt-tokenizer for token calculation:',
				error,
			)
			// Fallback to a simple estimation if the tokenizer fails.
			return Math.ceil(text.length / 4)
		}
	} //<

}