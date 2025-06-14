// ESLint & Imports -->>

//--------------------------------------------------------------------------------------------------------------<<

// VSCode Abstraction Interfaces & Adapters
export type { ICommands } from './_vscode_abstractions/ICommands.js';
export { CommandsAdapter } from './_vscode_adapters/Commands.adapter.js';
export type { IEnv } from './_vscode_abstractions/IEnv.js';
export { EnvAdapter } from './_vscode_adapters/Env.adapter.js';
export type { IWindow } from './_vscode_abstractions/IWindow.js';
export { WindowAdapter } from './_vscode_adapters/Window.adapter.js';
export type { IWorkspace } from './_vscode_abstractions/IWorkspace.js';
export { WorkspaceAdapter } from './_vscode_adapters/Workspace.adapter.js';

// Service Interfaces
export type { ICommonUtilsService } from './_interfaces/ICommonUtilsService.js';
export type { IFileUtilsService } from './_interfaces/IFileUtilsService.js';
export type { IFrontmatterUtilsService } from './_interfaces/IFrontmatterUtilsService.js';
export type { IPathUtilsService } from './_interfaces/IPathUtilsService.js';
export type { IQuickPickUtilsService } from './_interfaces/IQuickPickUtilsService.js';
export type { IShellUtilsService } from './_interfaces/IShellUtilsService.js';
export type { IWorkspaceUtilsService, WorkspaceInfo } from './_interfaces/IWorkspaceUtilsService.js';

// Service Implementations
export { CommonUtilsService } from './services/CommonUtils.service.js';
export { FileUtilsService } from './services/FileUtils.service.js';
export { FrontmatterUtilsService } from './services/FrontmatterUtils.service.js';
export { PathUtilsService } from './services/PathUtils.service.js';
export { QuickPickUtilsService } from './services/QuickPickUtils.service.js';
export { ShellUtilsService } from './services/ShellUtils.service.js';
export { WorkspaceUtilsService } from './services/WorkspaceUtils.service.js';

// Main Module for DI Registration
export { SharedServicesModule } from './SharedServices.module.js';