// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= MISC ======================================================================================================
import { encode } from 'gpt-tokenizer'

//= IMPLEMENTATION TYPES ======================================================================================
import type { ICommonUtilsService } from '../_interfaces/ICommonUtilsService.ts'

//= INJECTED TYPES ============================================================================================
import type { IWindow } from '../_vscode_abstractions/IWindow.ts'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class CommonUtilsService implements ICommonUtilsService { //>

	constructor(
		@inject('iWindow') private readonly iWindow: IWindow,
	) {}

	public delay( //>
		ms: number,
	): Promise<void> {
		if (ms === 0) { return Promise.resolve() }
		return new Promise(resolve => setTimeout(resolve, ms))
	} //<

	public errMsg( //>
		msg: string,
		err?: any,
	): void {
		this.iWindow.showErrorMessage(msg)
		console.error(msg)
		if (err) {
			console.error(err)
		}
	} //<

	public calculateTokens( //>
		text: string,
	): number {
		if (!text) { return 0 }
		try { return encode(text).length }
		catch (error) {
			console.error('[CommonUtilsService] Error using gpt-tokenizer for local token calculation:', error)
			return Math.ceil(text.length / 4)
		}
	} //<

} // <
