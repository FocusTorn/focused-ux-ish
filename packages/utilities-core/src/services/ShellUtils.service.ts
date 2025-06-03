// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { inject, injectable } from 'tsyringe'

//= NODE JS ===================================================================================================
import * as cp from 'node:child_process'
import * as process from 'node:process'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IShellUtilsService } from '../_interfaces/IShellUtilsService.ts'

//= INJECTED TYPES ============================================================================================
import type { IWindow } from '../_vscode_abstractions/IWindow.ts'
import type { ICommonUtilsService } from '../_interfaces/ICommonUtilsService.ts'

//--------------------------------------------------------------------------------------------------------------<<

@injectable()
export class ShellUtilsService implements IShellUtilsService { //>

	constructor(
		@inject('iWindow') private readonly iWindow: IWindow,
		@inject('ICommonUtilsService') private readonly iCommonUtils: ICommonUtilsService,
	) {}

	public async executeCommand( //>
		command: string,
		args: string[] = [],
		cwd?: string,
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const spawnedProcess = cp.spawn(command, args, { cwd, shell: true })

			spawnedProcess.on('error', (error: Error) => {
				reject(error)
			})

			spawnedProcess.on('close', (code: number | null) => {
				if (code !== 0) {
					reject(new Error(`Command "${command}" exited with code ${code}`))
				}
				else {
					resolve()
				}
			})
		})
	} //<

	public async getCDCommand( //>
		path: string | undefined,
		enterPoetryShell = false,
	): Promise<string | undefined> {
		const isWindows = process.platform === 'win32'
		const activeTerminal = this.iWindow?.activeTerminal
		let commandStr: string | undefined

		if (activeTerminal && path !== undefined) {
			const terminalName = activeTerminal.name.toLowerCase()

			if (isWindows && terminalName.includes('cmd')) {
				commandStr = `cd /d "${path}"`
			}
			else if (isWindows && (terminalName.includes('powershell') || terminalName.includes('pwsh'))) {
				commandStr = `Set-Location '${path}'`
			}
			else {
				commandStr = `cd "${path}"`
			}

			if (enterPoetryShell) {
				try {
					cp.execSync('poetry --version', { stdio: 'ignore' })
					commandStr += ' && poetry shell'
				}
				catch (error) {
					console.warn('[ShellUtilsService] Poetry check failed:', error)
					this.iWindow.showWarningMessage('Poetry command not found or failed. Cannot activate Poetry shell.')
				}
			}
		}
		else {
			return undefined
		}
		return commandStr
	} //<

} // <
