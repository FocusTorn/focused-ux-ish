// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import { container, Lifecycle } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext } from 'vscode'
import { //>
	Uri,
	ConfigurationTarget,
	FileType,
} from 'vscode' //<

//= IMPLEMENTATIONS ===========================================================================================
import type { IIconActionsService, IIconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import { IconActionsService, IconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import { SharedServicesModule } from '@focused-ux/shared-services' // Import SharedServicesModule
import type { ICommands, IWindow, IWorkspace } from '@focused-ux/shared-services' // Keep these for type safety if needed, but registration comes from SharedServicesModule

//= NODE JS ===================================================================================================
import { createReadStream as nodeFsCreateReadStreamFunction } from 'node:fs'
import * as nodeFs from 'node:fs'
import * as nodePath from 'node:path'
import * as nodeOs from 'node:os'
import * as nodeFsPromises from 'node:fs/promises'

//--------------------------------------------------------------------------------------------------------------<<

// Removed local adapter definitions (WindowAdapter, WorkspaceAdapter, CommandsAdapter)
// They will be registered by SharedServicesModule.

export function registerDynamiconsDependencies(context: ExtensionContext): void { //>
	// Register dependencies from @focused-ux/shared-services
	// This will register ICommonUtilsService, IFileUtilsService, IPathUtilsService,
	// IQuickPickUtilsService, IShellUtilsService, IWorkspaceUtilsService,
	// and the VSCode Adapters (IWindow, IWorkspace, ICommands, IEnv).
	SharedServicesModule.registerDependencies(container)

	// Register Node.js module providers if not already covered by SharedServicesModule
	// or if specific ones are needed here and not universally provided by SharedServicesModule.
	// SharedServicesModule does not typically register these raw Node functions, so keep them.
	container.register<typeof nodeFsCreateReadStreamFunction>(
		'iFsCreateReadStream',
		{ useValue: nodeFsCreateReadStreamFunction },
	)
	container.register<typeof nodeFs.readFileSync>(
		'iFsReadFileSync',
		{ useValue: nodeFs.readFileSync },
	)
	container.register<typeof nodeFs.statSync>('iFsStatSync', { useValue: nodeFs.statSync })
	container.register<typeof nodeFsPromises.stat>('iFspStat', { useValue: nodeFsPromises.stat })
	container.register<typeof nodeFsPromises.readFile>(
		'iFspReadFile',
		{ useValue: nodeFsPromises.readFile },
	)
	container.register<typeof nodeFsPromises.writeFile>(
		'iFspWriteFile',
		{ useValue: nodeFsPromises.writeFile },
	)
	container.register<typeof nodeFsPromises.readdir>(
		'iFspReaddir',
		{ useValue: nodeFsPromises.readdir },
	)
	container.register<typeof nodeFsPromises.copyFile>(
		'iFspCopyFile',
		{ useValue: nodeFsPromises.copyFile },
	)
	container.register<typeof nodeFsPromises.access>('iFspAccess', { useValue: nodeFsPromises.access })
	container.register<typeof nodeFsPromises.mkdir>('iFspMkdir', { useValue: nodeFsPromises.mkdir })
	container.register<typeof nodeFsPromises.rename>('iFspRename', { useValue: nodeFsPromises.rename })

	container.register<typeof nodePath.dirname>('iPathDirname', { useValue: nodePath.dirname })
	container.register<typeof nodePath.join>('iPathJoin', { useValue: nodePath.join })
	container.register<typeof nodePath.basename>('iPathBasename', { useValue: nodePath.basename })
	container.register<typeof nodePath.isAbsolute>(
		'iPathIsAbsolute',
		{ useValue: nodePath.isAbsolute },
	)
	container.register<typeof nodePath.resolve>('iPathResolve', { useValue: nodePath.resolve })
	container.register<typeof nodePath.normalize>('iPathNormalize', { useValue: nodePath.normalize })
	container.register<typeof nodePath.relative>('iPathRelative', { useValue: nodePath.relative })
	container.register<typeof nodePath.parse>('iPathParse', { useValue: nodePath.parse })
	container.register<typeof nodePath.extname>('iPathExtname', { useValue: nodePath.extname })
	container.register<typeof nodeOs.homedir>('iOsHomedir', { useValue: nodeOs.homedir })

	// Register Dynamicons-specific services
	container.register<IIconActionsService>(
		'IIconActionsService',
		{ useClass: IconActionsService },
		{ lifecycle: Lifecycle.Singleton },
	)
	container.register<IIconThemeGeneratorService>(
		'IIconThemeGeneratorService',
		{ useClass: IconThemeGeneratorService },
		{ lifecycle: Lifecycle.Singleton },
	)

	// Register VSCode specific values
	container.register<ExtensionContext>('ExtensionContext', { useValue: context })
	container.register<typeof Uri>('vscodeUri', { useValue: Uri })
	container.register<typeof ConfigurationTarget>(
		'vscodeConfigurationTarget',
		{ useValue: ConfigurationTarget },
	)
	container.register<typeof FileType>('vscodeFileType', { useValue: FileType })
} //<