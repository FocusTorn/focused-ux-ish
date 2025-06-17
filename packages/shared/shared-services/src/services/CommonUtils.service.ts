// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= IMPLEMENTATION TYPES ======================================================================================
import type { ICommonUtilsService } from '../_interfaces/ICommonUtilsService.js'

//= INJECTED TYPES ============================================================================================
import type { IWindow } from '../_vscode_abstractions/IWindow.js'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class CommonUtilsService implements ICommonUtilsService { //>

	constructor(
		@inject('IWindow') private readonly iWindow: IWindow,
	) {}

	public delay( //>
		ms: number,
	): Promise<void> {
		if (ms === 0) {
			return Promise.resolve()
		}
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

}