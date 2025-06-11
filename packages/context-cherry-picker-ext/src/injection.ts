// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe' // Lifecycle might not be needed if all are singletons

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'
import { // Added for IEnv
	extensions as VsCodeExtensions, // Added for iExtensions
	Uri,
	ConfigurationTarget,
	FileType,
} from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
// Import adapters and interfaces for VS Code API wrappers
// These would be identical to those in the main extension's injection.ts
// For brevity, I'm assuming they are defined here or imported from a shared location.
// If they are part of @focused-ux/shared-services, that's even better.
// For now, let's assume we need to define them or copy them if not in shared-services.
// To keep this focused, I'll use the interfaces from shared-services.

import type {
	ICommands,
	IEnv,
	IWindow,
	IWorkspace,
	// Adapters are not directly imported if shared-services provides them via its own DI or direct export
} from '@focused-ux/shared-services'
import {
	CommandsAdapter, // Assuming these are exported for direct use or registered by SharedServicesModule
	EnvAdapter,
	WindowAdapter,
	WorkspaceAdapter,
	SharedServicesModule, // Assuming SharedServicesModule handles its own DI registration
} from '@focused-ux/shared-services'

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
	// Register VS Code API Adapters (if not handled by SharedServicesModule)
	// If SharedServicesModule registers these with the global container,
	// this explicit registration might be redundant or could be conditional.
	// For clarity, let's assume we ensure they are registered here.
	if (!container.isRegistered('iWindow')) {
		container.registerSingleton<IWindow>('iWindow', WindowAdapter)
	}
	if (!container.isRegistered('iWorkspace')) {
		container.registerSingleton<IWorkspace>('iWorkspace', WorkspaceAdapter)
	}
	if (!container.isRegistered('iCommands')) {
		container.registerSingleton<ICommands>('iCommands', CommandsAdapter)
	}
	if (!container.isRegistered('iEnv')) {
		container.registerSingleton<IEnv>('iEnv', EnvAdapter)
	}

	// Register ExtensionContext and other common VS Code types
	container.register<ExtensionContext>('iContext', { useValue: context })
	container.register<typeof VsCodeExtensions>('iExtensions', { useValue: VsCodeExtensions })
	container.register<typeof Uri>('vscodeUri', { useValue: Uri }) // If needed directly
	container.register<typeof ConfigurationTarget>('vscodeConfigurationTarget', { useValue: ConfigurationTarget })
	container.register<typeof FileType>('vscodeFileType', { useValue: FileType })

	// Register Node.js module providers (fs, path, os)
	// These are identical to what's in the main extension's injection.ts
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

	// Register dependencies from @focused-ux/shared-services
	// This assumes SharedServicesModule has a static method to register its own services.
	SharedServicesModule.registerDependencies(container)

	// Register CCP-specific dependencies
	ContextCherryPickerModule.registerDependencies(container)
} //<
