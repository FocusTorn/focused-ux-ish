// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe' // Lifecycle might not be needed if all are singletons

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'
import { //>
	extensions as VsCodeExtensions,
	Uri,
	ConfigurationTarget,
	FileType,
} from 'vscode' //<

//= IMPLEMENTATIONS ===========================================================================================
import { SharedServicesModule } from '@focused-ux/shared-services'
// CCP Module for its dependencies
import { ContextCherryPickerModule } from './ContextCherryPicker.module.js'

//= NODE JS ===================================================================================================
import { createReadStream as nodeFsCreateReadStreamFunction } from 'node:fs'
import * as nodeFs from 'node:fs'
import * as nodePath from 'node:path'
import * as nodeOs from 'node:os'
import * as nodeFsPromises from 'node:fs/promises'

//--------------------------------------------------------------------------------------------------------------<<

export function registerCCP_Dependencies(context: ExtensionContext): void { //>
	// Register dependencies from @focused-ux/shared-services
	// This handles IWindow, IWorkspace, ICommands, IEnv, and shared utility services.
	SharedServicesModule.registerDependencies(container)

	// Register ExtensionContext and other common VS Code types
	// Note: SharedServicesModule might not register these specific values, so keep them here.
	container.register<ExtensionContext>('iContext', { useValue: context })
	container.register<typeof VsCodeExtensions>('iExtensions', { useValue: VsCodeExtensions })
	container.register<typeof Uri>('vscodeUri', { useValue: Uri })
	container.register<typeof ConfigurationTarget>('vscodeConfigurationTarget', { useValue: ConfigurationTarget })
	container.register<typeof FileType>('vscodeFileType', { useValue: FileType })

	// Register Node.js module providers
	// Ensure all Node.js functions directly injected into CCP services are registered here.
	container.register<typeof nodeFsCreateReadStreamFunction>('iFsCreateReadStream', { useValue: nodeFsCreateReadStreamFunction })
	container.register<typeof nodeFs.readFileSync>('iFsReadFileSync', { useValue: nodeFs.readFileSync })
	container.register<typeof nodeFs.statSync>('iFsStatSync', { useValue: nodeFs.statSync })
	container.register<typeof nodeFsPromises.stat>('iFspStat', { useValue: nodeFsPromises.stat })
	container.register<typeof nodeFsPromises.readFile>('iFspReadFile', { useValue: nodeFsPromises.readFile })
	container.register<typeof nodeFsPromises.writeFile>('iFspWriteFile', { useValue: nodeFsPromises.writeFile })
	container.register<typeof nodeFsPromises.readdir>('iFspReaddir', { useValue: nodeFsPromises.readdir })
	container.register<typeof nodeFsPromises.copyFile>('iFspCopyFile', { useValue: nodeFsPromises.copyFile })
	container.register<typeof nodeFsPromises.access>('iFspAccess', { useValue: nodeFsPromises.access })
	container.register<typeof nodeFsPromises.mkdir>('iFspMkdir', { useValue: nodeFsPromises.mkdir })
	container.register<typeof nodeFsPromises.rename>('iFspRename', { useValue: nodeFsPromises.rename })

	container.register<typeof nodePath.dirname>('iPathDirname', { useValue: nodePath.dirname })
	container.register<typeof nodePath.join>('iPathJoin', { useValue: nodePath.join })
	container.register<typeof nodePath.basename>('iPathBasename', { useValue: nodePath.basename })
	container.register<typeof nodePath.isAbsolute>('iPathIsAbsolute', { useValue: nodePath.isAbsolute })
	container.register<typeof nodePath.resolve>('iPathResolve', { useValue: nodePath.resolve })
	container.register<typeof nodePath.normalize>('iPathNormalize', { useValue: nodePath.normalize })
	container.register<typeof nodePath.relative>('iPathRelative', { useValue: nodePath.relative })
	container.register<typeof nodePath.parse>('iPathParse', { useValue: nodePath.parse })
	container.register<typeof nodePath.extname>('iPathExtname', { useValue: nodePath.extname })

	container.register<typeof nodeOs.homedir>('iOsHomedir', { useValue: nodeOs.homedir })

	// Register CCP-specific dependencies
	ContextCherryPickerModule.registerDependencies(container)
} //<