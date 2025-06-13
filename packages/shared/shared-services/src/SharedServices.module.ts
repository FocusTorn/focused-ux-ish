// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import type { DependencyContainer } from 'tsyringe';

//= IMPLEMENTATION TYPES ======================================================================================
// Service Interfaces
import type { ICommonUtilsService } from './_interfaces/ICommonUtilsService.ts';
import type { IFileUtilsService } from './_interfaces/IFileUtilsService.ts';
import type { IFrontmatterUtilsService } from './_interfaces/IFrontmatterUtilsService.ts';
import type { IPathUtilsService } from './_interfaces/IPathUtilsService.ts';
import type { IQuickPickUtilsService } from './_interfaces/IQuickPickUtilsService.ts';
import type { IShellUtilsService } from './_interfaces/IShellUtilsService.ts';
import type { IWorkspaceUtilsService } from './_interfaces/IWorkspaceUtilsService.ts';

// Service Implementations
import { CommonUtilsService } from './services/CommonUtils.service.js';
import { FileUtilsService } from './services/FileUtils.service.js';
import { FrontmatterUtilsService } from './services/FrontmatterUtils.service.js';
import { PathUtilsService } from './services/PathUtils.service.js';
import { QuickPickUtilsService } from './services/QuickPickUtils.service.js';
import { ShellUtilsService } from './services/ShellUtils.service.js';
import { WorkspaceUtilsService } from './services/WorkspaceUtils.service.js';

// VSCode Abstraction Interfaces
import type { ICommands } from './_vscode_abstractions/ICommands.ts';
import type { IEnv } from './_vscode_abstractions/IEnv.ts';
import type { IWindow } from './_vscode_abstractions/IWindow.ts';
import type { IWorkspace } from './_vscode_abstractions/IWorkspace.ts';

// VSCode Adapter Implementations
import { CommandsAdapter } from './_vscode_adapters/Commands.adapter.js';
import { EnvAdapter } from './_vscode_adapters/Env.adapter.js';
import { WindowAdapter } from './_vscode_adapters/Window.adapter.js';
import { WorkspaceAdapter } from './_vscode_adapters/Workspace.adapter.js';

//--------------------------------------------------------------------------------------------------------------<<

export class SharedServicesModule { //>
	public static registerDependencies(container: DependencyContainer): void { //>


        container.registerSingleton<ICommonUtilsService>('ICommonUtilsService', CommonUtilsService);

        container.registerSingleton<IFileUtilsService>('IFileUtilsService', FileUtilsService);
		container.registerSingleton<IFrontmatterUtilsService>('IFrontmatterUtilsService', FrontmatterUtilsService);
		container.registerSingleton<IPathUtilsService>('IPathUtilsService', PathUtilsService);
		container.registerSingleton<IQuickPickUtilsService>('IQuickPickUtilsService', QuickPickUtilsService);
		container.registerSingleton<IShellUtilsService>('IShellUtilsService', ShellUtilsService);
		container.registerSingleton<IWorkspaceUtilsService>('IWorkspaceUtilsService', WorkspaceUtilsService);

		// Register VSCode API Adapters
		// These ensure that any part of the application (including satellites)
		// resolving these interfaces gets the standard adapter.
		if (!container.isRegistered('ICommands')) {
			container.registerSingleton<ICommands>('ICommands', CommandsAdapter);
		}
		if (!container.isRegistered('IEnv')) {
			container.registerSingleton<IEnv>('IEnv', EnvAdapter);
		}
		if (!container.isRegistered('IWindow')) {
			container.registerSingleton<IWindow>('IWindow', WindowAdapter);
		}
		if (!container.isRegistered('IWorkspace')) {
			container.registerSingleton<IWorkspace>('IWorkspace', WorkspaceAdapter);
		}
	} //<
}