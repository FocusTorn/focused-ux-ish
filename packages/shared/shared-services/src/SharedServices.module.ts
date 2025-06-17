// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import type { DependencyContainer } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'
import { ConfigurationTarget, FileType, Uri, extensions as VsCodeExtensions } from 'vscode'

//= NODE JS ===================================================================================================
import { createReadStream as nodeFsCreateReadStreamFunction } from 'node:fs'
import * as nodeFs from 'node:fs'
import * as nodeFsPromises from 'node:fs/promises'
import * as nodeOs from 'node:os'
import * as nodePath from 'node:path'

//= IMPLEMENTATION TYPES ======================================================================================
// VSCode Abstraction Interfaces
import type { ICommands } from './_vscode_abstractions/ICommands.ts'
import type { IEnv } from './_vscode_abstractions/IEnv.ts'
import type { IWindow } from './_vscode_abstractions/IWindow.ts'
import type { IWorkspace } from './_vscode_abstractions/IWorkspace.ts'

// VSCode Adapter Implementations
import { CommandsAdapter } from './_vscode_adapters/Commands.adapter.js'
import { EnvAdapter } from './_vscode_adapters/Env.adapter.js'
import { WindowAdapter } from './_vscode_adapters/Window.adapter.js'
import { WorkspaceAdapter } from './_vscode_adapters/Workspace.adapter.js'

//--------------------------------------------------------------------------------------------------------------<<

export class SharedServicesModule { //>
	public static registerDependencies(container: DependencyContainer, context: ExtensionContext): void { //>
		// Register VSCode API Adapters
		if (!container.isRegistered('ICommands')) {
			container.registerSingleton<ICommands>('ICommands', CommandsAdapter)
		}
		if (!container.isRegistered('IEnv')) {
			container.registerSingleton<IEnv>('IEnv', EnvAdapter)
		}
		if (!container.isRegistered('IWindow')) {
			container.registerSingleton<IWindow>('IWindow', WindowAdapter)
		}
		if (!container.isRegistered('IWorkspace')) {
			container.registerSingleton<IWorkspace>('IWorkspace', WorkspaceAdapter)
		}

		// Register VSCode Primitives
		if (!container.isRegistered('ExtensionContext')) {
			container.register<ExtensionContext>('ExtensionContext', { useValue: context })
		}
		if (!container.isRegistered('iContext')) { // Alias for CCP
			container.register<ExtensionContext>('iContext', { useValue: context })
		}
		if (!container.isRegistered('iExtensions')) {
			container.register<typeof VsCodeExtensions>('iExtensions', { useValue: VsCodeExtensions })
		}
		if (!container.isRegistered('vscodeUri')) {
			container.register<typeof Uri>('vscodeUri', { useValue: Uri })
		}
		if (!container.isRegistered('vscodeConfigurationTarget')) {
			container.register<typeof ConfigurationTarget>('vscodeConfigurationTarget', { useValue: ConfigurationTarget })
		}
		if (!container.isRegistered('vscodeFileType')) {
			container.register<typeof FileType>('vscodeFileType', { useValue: FileType })
		}

		// Register Node.js Primitives
		if (!container.isRegistered('iFsCreateReadStream')) {
			container.register<typeof nodeFsCreateReadStreamFunction>('iFsCreateReadStream', { useValue: nodeFsCreateReadStreamFunction })
		}
		if (!container.isRegistered('iFsReadFileSync')) {
			container.register<typeof nodeFs.readFileSync>('iFsReadFileSync', { useValue: nodeFs.readFileSync })
		}
		if (!container.isRegistered('iFsStatSync')) {
			container.register<typeof nodeFs.statSync>('iFsStatSync', { useValue: nodeFs.statSync })
		}
		if (!container.isRegistered('iFspStat')) {
			container.register<typeof nodeFsPromises.stat>('iFspStat', { useValue: nodeFsPromises.stat })
		}
		if (!container.isRegistered('iFspReadFile')) {
			container.register<typeof nodeFsPromises.readFile>('iFspReadFile', { useValue: nodeFsPromises.readFile })
		}
		if (!container.isRegistered('iFspWriteFile')) {
			container.register<typeof nodeFsPromises.writeFile>('iFspWriteFile', { useValue: nodeFsPromises.writeFile })
		}
		if (!container.isRegistered('iFspReaddir')) {
			container.register<typeof nodeFsPromises.readdir>('iFspReaddir', { useValue: nodeFsPromises.readdir })
		}
		if (!container.isRegistered('iFspCopyFile')) {
			container.register<typeof nodeFsPromises.copyFile>('iFspCopyFile', { useValue: nodeFsPromises.copyFile })
		}
		if (!container.isRegistered('iFspAccess')) {
			container.register<typeof nodeFsPromises.access>('iFspAccess', { useValue: nodeFsPromises.access })
		}
		if (!container.isRegistered('iFspMkdir')) {
			container.register<typeof nodeFsPromises.mkdir>('iFspMkdir', { useValue: nodeFsPromises.mkdir })
		}
		if (!container.isRegistered('iFspRename')) {
			container.register<typeof nodeFsPromises.rename>('iFspRename', { useValue: nodeFsPromises.rename })
		}
		if (!container.isRegistered('iPathDirname')) {
			container.register<typeof nodePath.dirname>('iPathDirname', { useValue: nodePath.dirname })
		}
		if (!container.isRegistered('iPathJoin')) {
			container.register<typeof nodePath.join>('iPathJoin', { useValue: nodePath.join })
		}
		if (!container.isRegistered('iPathBasename')) {
			container.register<typeof nodePath.basename>('iPathBasename', { useValue: nodePath.basename })
		}
		if (!container.isRegistered('iPathIsAbsolute')) {
			container.register<typeof nodePath.isAbsolute>('iPathIsAbsolute', { useValue: nodePath.isAbsolute })
		}
		if (!container.isRegistered('iPathResolve')) {
			container.register<typeof nodePath.resolve>('iPathResolve', { useValue: nodePath.resolve })
		}
		if (!container.isRegistered('iPathNormalize')) {
			container.register<typeof nodePath.normalize>('iPathNormalize', { useValue: nodePath.normalize })
		}
		if (!container.isRegistered('iPathRelative')) {
			container.register<typeof nodePath.relative>('iPathRelative', { useValue: nodePath.relative })
		}
		if (!container.isRegistered('iPathParse')) {
			container.register<typeof nodePath.parse>('iPathParse', { useValue: nodePath.parse })
		}
		if (!container.isRegistered('iPathExtname')) {
			container.register<typeof nodePath.extname>('iPathExtname', { useValue: nodePath.extname })
		}
		if (!container.isRegistered('iOsHomedir')) {
			container.register<typeof nodeOs.homedir>('iOsHomedir', { useValue: nodeOs.homedir })
		}
	} //<
}